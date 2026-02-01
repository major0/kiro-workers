/**
 * Unit tests for download utility
 *
 * Tests cover:
 * - Successful downloads
 * - Retry logic with exponential backoff
 * - Non-retryable errors (404)
 * - Platform detection
 * - Error handling
 */

import { Readable } from 'stream';

// Create mock functions
const mockInfo = jest.fn();
const mockWarning = jest.fn();
const mockError = jest.fn();
const mockHttpClientGet = jest.fn();
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockCreateWriteStream = jest.fn();

// Mock modules using virtual mocks
jest.mock(
  '@actions/core',
  () => ({
    info: mockInfo,
    warning: mockWarning,
    error: mockError,
  }),
  { virtual: true }
);

jest.mock(
  '@actions/http-client',
  () => ({
    HttpClient: jest.fn().mockImplementation(() => ({
      get: mockHttpClientGet,
    })),
  }),
  { virtual: true }
);

jest.mock(
  'fs',
  () => ({
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    createWriteStream: mockCreateWriteStream,
  }),
  { virtual: true }
);

// Import after mocks
import { downloadFile, getPlatform } from './download.js';

describe('downloadFile', () => {
  let mockResponse: any;
  let mockWriteStream: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs.existsSync
    mockExistsSync.mockReturnValue(true);

    // Mock fs.mkdirSync
    mockMkdirSync.mockImplementation(() => undefined);

    // Mock fs.createWriteStream with proper event handling
    mockWriteStream = {
      write: jest.fn((_chunk, encoding, callback) => {
        if (typeof encoding === 'function') {
          encoding();
        } else if (typeof callback === 'function') {
          callback();
        }
        return true;
      }),
      end: jest.fn(callback => {
        if (typeof callback === 'function') {
          // Use process.nextTick instead of setImmediate for better compatibility
          process.nextTick(callback);
        }
        // Emit finish event
        process.nextTick(() => {
          if (mockWriteStream._finishHandler) {
            mockWriteStream._finishHandler();
          }
        });
      }),
      on: jest.fn((event, handler) => {
        if (event === 'finish') {
          mockWriteStream._finishHandler = handler;
        } else if (event === 'error') {
          mockWriteStream._errorHandler = handler;
        }
        return mockWriteStream;
      }),
      once: jest.fn((event, handler) => {
        if (event === 'finish') {
          mockWriteStream._finishHandler = handler;
        } else if (event === 'error') {
          mockWriteStream._errorHandler = handler;
        }
        return mockWriteStream;
      }),
      emit: jest.fn(),
      _finishHandler: null,
      _errorHandler: null,
    };
    mockCreateWriteStream.mockReturnValue(mockWriteStream);

    // Mock successful response with proper stream
    const mockStream: any = new Readable({
      read() {
        this.push('test data');
        this.push(null);
      },
    });
    mockStream.statusCode = 200;
    mockStream.statusMessage = 'OK';

    mockResponse = {
      message: mockStream,
      readBody: jest.fn().mockResolvedValue('test data'),
    };

    mockHttpClientGet.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    // No need to restore timers since we're not using fake timers by default
  });

  describe('successful downloads', () => {
    it('should download file successfully on first attempt', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      await downloadFile(url, destPath);

      expect(mockHttpClientGet).toHaveBeenCalledWith(url);
      expect(mockHttpClientGet).toHaveBeenCalledTimes(1);
      expect(mockInfo).toHaveBeenCalledWith(`Downloading from ${url}...`);
      expect(mockInfo).toHaveBeenCalledWith(`Successfully downloaded to ${destPath}`);
    });

    it('should create destination directory if it does not exist', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/subdir/file.bin';

      mockExistsSync.mockReturnValue(false);

      await downloadFile(url, destPath);

      expect(mockMkdirSync).toHaveBeenCalledWith('/tmp/subdir', {
        recursive: true,
      });
    });

    it('should not create directory if it already exists', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      mockExistsSync.mockReturnValue(true);

      await downloadFile(url, destPath);

      expect(mockMkdirSync).not.toHaveBeenCalled();
    });

    it('should use custom retry parameters', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';
      const maxRetries = 5;
      const retryDelayMs = 2000;

      await downloadFile(url, destPath, maxRetries, retryDelayMs);

      expect(mockHttpClientGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry logic with transient failures', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry on network errors and succeed', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      // First attempt fails, second succeeds
      mockHttpClientGet
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const promise = downloadFile(url, destPath, 3, 1000);

      // Fast-forward through the retry delay
      await jest.advanceTimersByTimeAsync(1000);

      await promise;

      expect(mockHttpClientGet).toHaveBeenCalledTimes(2);
      expect(mockWarning).toHaveBeenCalledWith('Download attempt 1/4 failed: Network error');
      expect(mockInfo).toHaveBeenCalledWith('Retry attempt 1/3 after 1000ms delay...');
    });

    it('should retry on HTTP 500 errors', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      const errorStream: any = new Readable({
        read() {
          this.push(null);
        },
      });
      errorStream.statusCode = 500;
      errorStream.statusMessage = 'Internal Server Error';

      const errorResponse = {
        message: errorStream,
        readBody: jest.fn().mockResolvedValue(''),
      };

      mockHttpClientGet.mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(mockResponse);

      const promise = downloadFile(url, destPath, 3, 1000);

      await jest.advanceTimersByTimeAsync(1000);

      await promise;

      expect(mockHttpClientGet).toHaveBeenCalledTimes(2);
      expect(mockWarning).toHaveBeenCalledWith(
        'Download attempt 1/4 failed: HTTP 500: Internal Server Error'
      );
    });

    it('should retry on HTTP 429 (rate limit) errors', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      const rateLimitStream: any = new Readable({
        read() {
          this.push(null);
        },
      });
      rateLimitStream.statusCode = 429;
      rateLimitStream.statusMessage = 'Too Many Requests';

      const rateLimitResponse = {
        message: rateLimitStream,
        readBody: jest.fn().mockResolvedValue(''),
      };

      mockHttpClientGet
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(mockResponse);

      const promise = downloadFile(url, destPath, 3, 1000);

      await jest.advanceTimersByTimeAsync(1000);

      await promise;

      expect(mockHttpClientGet).toHaveBeenCalledTimes(2);
      expect(mockWarning).toHaveBeenCalledWith(
        'Download attempt 1/4 failed: HTTP 429: Too Many Requests'
      );
    });

    it('should throw error after max retries exceeded', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      mockHttpClientGet.mockRejectedValue(new Error('Network error'));

      // Start the download and catch the error
      let error: Error | undefined;
      const promise = downloadFile(url, destPath, 2, 1000).catch(e => {
        error = e;
      });

      // Fast-forward through all retry delays
      await jest.advanceTimersByTimeAsync(1000); // First retry
      await jest.advanceTimersByTimeAsync(2000); // Second retry

      // Wait for the promise to settle
      await promise;

      expect(error).toBeDefined();
      expect(error?.message).toBe('Failed to download after 3 attempts: Network error');
      expect(mockHttpClientGet).toHaveBeenCalledTimes(3);
    });
  });

  describe('exponential backoff timing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use exponential backoff for retries', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';
      const retryDelayMs = 1000;

      // Fail first 3 attempts, succeed on 4th
      mockHttpClientGet
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValueOnce(mockResponse);

      const promise = downloadFile(url, destPath, 3, retryDelayMs);

      // First retry: 1000ms * 2^0 = 1000ms
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockInfo).toHaveBeenCalledWith('Retry attempt 1/3 after 1000ms delay...');

      // Second retry: 1000ms * 2^1 = 2000ms
      await jest.advanceTimersByTimeAsync(2000);
      expect(mockInfo).toHaveBeenCalledWith('Retry attempt 2/3 after 2000ms delay...');

      // Third retry: 1000ms * 2^2 = 4000ms
      await jest.advanceTimersByTimeAsync(4000);
      expect(mockInfo).toHaveBeenCalledWith('Retry attempt 3/3 after 4000ms delay...');

      await promise;

      expect(mockHttpClientGet).toHaveBeenCalledTimes(4);
    });

    it('should calculate correct delays with custom initial delay', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';
      const retryDelayMs = 500;

      mockHttpClientGet
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(mockResponse);

      const promise = downloadFile(url, destPath, 2, retryDelayMs);

      // First retry: 500ms * 2^0 = 500ms
      await jest.advanceTimersByTimeAsync(500);
      expect(mockInfo).toHaveBeenCalledWith('Retry attempt 1/2 after 500ms delay...');

      // Second retry: 500ms * 2^1 = 1000ms
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockInfo).toHaveBeenCalledWith('Retry attempt 2/2 after 1000ms delay...');

      await promise;
    });
  });

  describe('non-retryable errors', () => {
    it('should not retry on HTTP 404 errors', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      const notFoundStream: any = new Readable({
        read() {
          this.push(null);
        },
      });
      notFoundStream.statusCode = 404;
      notFoundStream.statusMessage = 'Not Found';

      const notFoundResponse = {
        message: notFoundStream,
        readBody: jest.fn().mockResolvedValue(''),
      };

      mockHttpClientGet.mockResolvedValue(notFoundResponse);

      await expect(downloadFile(url, destPath, 3, 1000)).rejects.toThrow('HTTP 404: Not Found');

      expect(mockHttpClientGet).toHaveBeenCalledTimes(1);
      expect(mockWarning).toHaveBeenCalledWith('Download attempt 1/4 failed: HTTP 404: Not Found');
    });

    it('should not retry on HTTP 400 errors', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      const badRequestStream: any = new Readable({
        read() {
          this.push(null);
        },
      });
      badRequestStream.statusCode = 400;
      badRequestStream.statusMessage = 'Bad Request';

      const badRequestResponse = {
        message: badRequestStream,
        readBody: jest.fn().mockResolvedValue(''),
      };

      mockHttpClientGet.mockResolvedValue(badRequestResponse);

      await expect(downloadFile(url, destPath, 3, 1000)).rejects.toThrow('HTTP 400: Bad Request');

      expect(mockHttpClientGet).toHaveBeenCalledTimes(1);
    });

    it('should not retry on HTTP 403 errors', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      const forbiddenStream: any = new Readable({
        read() {
          this.push(null);
        },
      });
      forbiddenStream.statusCode = 403;
      forbiddenStream.statusMessage = 'Forbidden';

      const forbiddenResponse = {
        message: forbiddenStream,
        readBody: jest.fn().mockResolvedValue(''),
      };

      mockHttpClientGet.mockResolvedValue(forbiddenResponse);

      await expect(downloadFile(url, destPath, 3, 1000)).rejects.toThrow('HTTP 403: Forbidden');

      expect(mockHttpClientGet).toHaveBeenCalledTimes(1);
    });

    it('should retry on HTTP 429 even though it starts with 4', async () => {
      jest.useFakeTimers();

      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      const rateLimitStream: any = new Readable({
        read() {
          this.push(null);
        },
      });
      rateLimitStream.statusCode = 429;
      rateLimitStream.statusMessage = 'Too Many Requests';

      const rateLimitResponse = {
        message: rateLimitStream,
        readBody: jest.fn().mockResolvedValue(''),
      };

      mockHttpClientGet
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(mockResponse);

      const promise = downloadFile(url, destPath, 3, 1000);

      await jest.advanceTimersByTimeAsync(1000);

      await promise;

      // Should retry because 429 is explicitly allowed
      expect(mockHttpClientGet).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should handle stream errors during download', async () => {
      const url = 'https://example.com/file.bin';
      const destPath = '/tmp/file.bin';

      // Mock a stream that emits an error
      const errorStream: any = new Readable({
        read() {
          this.emit('error', new Error('Stream error'));
        },
      });
      errorStream.statusCode = 200;
      errorStream.statusMessage = 'OK';

      const errorResponse = {
        message: errorStream,
        readBody: jest.fn().mockResolvedValue(''),
      };

      mockHttpClientGet.mockResolvedValue(errorResponse);

      await expect(downloadFile(url, destPath, 0, 1000)).rejects.toThrow();

      expect(mockWarning).toHaveBeenCalled();
    });
  });
});

describe('getPlatform', () => {
  const originalPlatform = process.platform;
  const originalArch = process.arch;

  afterEach(() => {
    // Restore original values
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: originalArch,
      writable: true,
      configurable: true,
    });
  });

  describe('supported platforms', () => {
    it('should return correct info for linux x64', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const result = getPlatform();

      expect(result).toEqual({
        platform: 'linux',
        arch: 'x64',
      });
    });

    it('should return correct info for linux arm64', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });

      const result = getPlatform();

      expect(result).toEqual({
        platform: 'linux',
        arch: 'arm64',
      });
    });

    it('should return correct info for darwin x64', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const result = getPlatform();

      expect(result).toEqual({
        platform: 'darwin',
        arch: 'x64',
      });
    });

    it('should return correct info for darwin arm64', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });

      const result = getPlatform();

      expect(result).toEqual({
        platform: 'darwin',
        arch: 'arm64',
      });
    });

    it('should return correct info for win32 x64', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const result = getPlatform();

      expect(result).toEqual({
        platform: 'win32',
        arch: 'x64',
      });
    });

    it('should return correct info for win32 arm64', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });

      const result = getPlatform();

      expect(result).toEqual({
        platform: 'win32',
        arch: 'arm64',
      });
    });
  });

  describe('unsupported platforms', () => {
    it('should throw error for unsupported platform', () => {
      Object.defineProperty(process, 'platform', { value: 'freebsd' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      expect(() => getPlatform()).toThrow('Unsupported platform: freebsd');
    });

    it('should throw error for unsupported architecture', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'ia32' });

      expect(() => getPlatform()).toThrow('Unsupported architecture: ia32');
    });

    it('should throw error for aix platform', () => {
      Object.defineProperty(process, 'platform', { value: 'aix' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      expect(() => getPlatform()).toThrow('Unsupported platform: aix');
    });

    it('should throw error for sunos platform', () => {
      Object.defineProperty(process, 'platform', { value: 'sunos' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      expect(() => getPlatform()).toThrow('Unsupported platform: sunos');
    });

    it('should throw error for s390x architecture', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 's390x' });

      expect(() => getPlatform()).toThrow('Unsupported architecture: s390x');
    });

    it('should throw error for ppc64 architecture', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'ppc64' });

      expect(() => getPlatform()).toThrow('Unsupported architecture: ppc64');
    });
  });
});
