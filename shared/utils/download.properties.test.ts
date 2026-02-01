/**
 * Property-based tests for download utility
 *
 * This file contains property-based tests using fast-check to validate
 * universal correctness properties of the download utility.
 *
 * Property 35: Retry with Exponential Backoff
 * Validates: Requirements 9.4
 */

import * as fc from 'fast-check';
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
import { downloadFile } from './download.js';

describe('Property-Based Tests: Download Utility', () => {
  let mockWriteStream: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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
          process.nextTick(callback);
        }
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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Property 35: Retry with Exponential Backoff
   *
   * **Validates: Requirements 9.4**
   *
   * This property verifies that for any transient network error, the download
   * utility retries the operation with exponentially increasing delays.
   *
   * The property checks:
   * 1. The number of retry attempts matches maxRetries + 1 (initial attempt)
   * 2. Delays between retries follow exponential backoff: delay_n = initialDelay * 2^(n-1)
   * 3. The function eventually throws an error after exhausting all retries
   * 4. Each retry is logged with the correct delay information
   */
  describe('Property 35: Retry with Exponential Backoff', () => {
    it('should retry with exponentially increasing delays for any transient error', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random retry parameters
          fc.integer({ min: 1, max: 5 }), // maxRetries
          fc.integer({ min: 100, max: 2000 }), // retryDelayMs
          fc.constantFrom(
            'Network timeout',
            'Connection refused',
            'ECONNRESET',
            'ETIMEDOUT',
            'Socket hang up'
          ), // transient error messages
          async (maxRetries, retryDelayMs, errorMessage) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Mock all attempts to fail with transient error
            mockHttpClientGet.mockRejectedValue(new Error(errorMessage));

            const url = 'https://example.com/file.bin';
            const destPath = '/tmp/file.bin';

            // Start the download (will fail after all retries)
            const downloadPromise = downloadFile(url, destPath, maxRetries, retryDelayMs).catch(
              e => e
            );

            // Calculate expected delays and advance timers
            const expectedDelays: number[] = [];
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              const delay = retryDelayMs * Math.pow(2, attempt - 1);
              expectedDelays.push(delay);
              await jest.advanceTimersByTimeAsync(delay);
            }

            // Wait for the promise to settle
            const error = await downloadPromise;

            // Verify the error was thrown after all retries
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain(`Failed to download after ${maxRetries + 1} attempts`);

            // Verify the correct number of attempts (initial + retries)
            expect(mockHttpClientGet).toHaveBeenCalledTimes(maxRetries + 1);

            // Verify exponential backoff delays were logged
            for (let i = 0; i < expectedDelays.length; i++) {
              expect(mockInfo).toHaveBeenCalledWith(
                `Retry attempt ${i + 1}/${maxRetries} after ${expectedDelays[i]}ms delay...`
              );
            }

            // Verify all attempts were logged as failures
            for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
              expect(mockWarning).toHaveBeenCalledWith(
                `Download attempt ${attempt}/${maxRetries + 1} failed: ${errorMessage}`
              );
            }
          }
        ),
        {
          numRuns: 100, // Run 100 iterations to test various parameter combinations
          verbose: true,
        }
      );
    });

    it('should succeed on any retry attempt if the error is transient', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random retry parameters
          fc.integer({ min: 2, max: 5 }), // maxRetries (at least 2 for meaningful test)
          fc.integer({ min: 100, max: 1000 }), // retryDelayMs
          fc.integer({ min: 1, max: 4 }), // successOnAttempt (which attempt succeeds)
          async (maxRetries, retryDelayMs, successOnAttempt) => {
            // Ensure successOnAttempt is within valid range
            const actualSuccessAttempt = Math.min(successOnAttempt, maxRetries);

            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Mock successful response
            const mockStream: any = new Readable({
              read() {
                this.push('test data');
                this.push(null);
              },
            });
            mockStream.statusCode = 200;
            mockStream.statusMessage = 'OK';

            const mockResponse = {
              message: mockStream,
              readBody: jest.fn().mockResolvedValue('test data'),
            };

            // Mock failures for first N attempts, then success
            for (let i = 0; i < actualSuccessAttempt; i++) {
              mockHttpClientGet.mockRejectedValueOnce(new Error('Transient error'));
            }
            mockHttpClientGet.mockResolvedValueOnce(mockResponse);

            const url = 'https://example.com/file.bin';
            const destPath = '/tmp/file.bin';

            // Start the download
            const downloadPromise = downloadFile(url, destPath, maxRetries, retryDelayMs);

            // Advance timers for each retry until success
            for (let attempt = 1; attempt <= actualSuccessAttempt; attempt++) {
              const delay = retryDelayMs * Math.pow(2, attempt - 1);
              await jest.advanceTimersByTimeAsync(delay);
            }

            // Wait for the promise to settle
            await downloadPromise;

            // Verify the correct number of attempts (failures + success)
            expect(mockHttpClientGet).toHaveBeenCalledTimes(actualSuccessAttempt + 1);

            // Verify success was logged
            expect(mockInfo).toHaveBeenCalledWith(`Successfully downloaded to ${destPath}`);

            // Verify exponential backoff delays were used for retries
            for (let i = 0; i < actualSuccessAttempt; i++) {
              const expectedDelay = retryDelayMs * Math.pow(2, i);
              expect(mockInfo).toHaveBeenCalledWith(
                `Retry attempt ${i + 1}/${maxRetries} after ${expectedDelay}ms delay...`
              );
            }
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    it('should not retry on non-retryable 4xx errors (except 429)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random 4xx status codes (excluding 429)
          fc.constantFrom(400, 401, 403, 404, 405, 406, 408, 410, 422),
          fc.integer({ min: 1, max: 5 }), // maxRetries
          async (statusCode, maxRetries) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Mock error response with 4xx status
            const errorStream: any = new Readable({
              read() {
                this.push(null);
              },
            });
            errorStream.statusCode = statusCode;
            errorStream.statusMessage = `Error ${statusCode}`;

            const errorResponse = {
              message: errorStream,
              readBody: jest.fn().mockResolvedValue(''),
            };

            mockHttpClientGet.mockResolvedValue(errorResponse);

            const url = 'https://example.com/file.bin';
            const destPath = '/tmp/file.bin';

            // Start the download (should fail immediately)
            await expect(downloadFile(url, destPath, maxRetries, 1000)).rejects.toThrow(
              `HTTP ${statusCode}`
            );

            // Verify only one attempt was made (no retries)
            expect(mockHttpClientGet).toHaveBeenCalledTimes(1);

            // Verify the error was logged
            expect(mockWarning).toHaveBeenCalledWith(
              `Download attempt 1/${maxRetries + 1} failed: HTTP ${statusCode}: Error ${statusCode}`
            );
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    it('should retry on 429 rate limit errors with exponential backoff', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // maxRetries
          fc.integer({ min: 100, max: 1000 }), // retryDelayMs
          async (maxRetries, retryDelayMs) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Mock 429 response
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

            // Mock successful response
            const successStream: any = new Readable({
              read() {
                this.push('test data');
                this.push(null);
              },
            });
            successStream.statusCode = 200;
            successStream.statusMessage = 'OK';

            const successResponse = {
              message: successStream,
              readBody: jest.fn().mockResolvedValue('test data'),
            };

            // First attempt returns 429, second succeeds
            mockHttpClientGet
              .mockResolvedValueOnce(rateLimitResponse)
              .mockResolvedValueOnce(successResponse);

            const url = 'https://example.com/file.bin';
            const destPath = '/tmp/file.bin';

            // Start the download
            const downloadPromise = downloadFile(url, destPath, maxRetries, retryDelayMs);

            // Advance timer for first retry
            await jest.advanceTimersByTimeAsync(retryDelayMs);

            // Wait for the promise to settle
            await downloadPromise;

            // Verify retry occurred (2 attempts total)
            expect(mockHttpClientGet).toHaveBeenCalledTimes(2);

            // Verify exponential backoff delay was used
            expect(mockInfo).toHaveBeenCalledWith(
              `Retry attempt 1/${maxRetries} after ${retryDelayMs}ms delay...`
            );

            // Verify success
            expect(mockInfo).toHaveBeenCalledWith(`Successfully downloaded to ${destPath}`);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });
  });
});
