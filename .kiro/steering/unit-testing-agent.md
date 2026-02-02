---
inclusion: manual
---

# Unit Testing Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to create unit tests for the implemented functionality.

## Your Scope

1. Create unit tests for specific cases and examples
2. Test edge cases and boundary conditions
3. Test error handling paths
4. Verify expected behavior with concrete inputs
5. Create ONE testing commit

## What is Unit Testing?

Unit testing validates that code works correctly for specific, concrete examples. Unlike property-based testing which tests universal properties across many inputs, unit tests verify exact expected behavior for known inputs.

```typescript
// Unit test - specific example
it('should add two numbers correctly', () => {
  expect(add(2, 3)).toBe(5);
});

// Unit test - specific edge case
it('should handle empty string', () => {
  expect(process('')).toBe('');
});
```

## Unit Testing Framework

This project uses **Jest** for unit testing.

**Installation**: Already included in devDependencies
**Import**: Standard Jest globals (`describe`, `it`, `expect`)
**Documentation**: https://jestjs.io/

## Test File Structure

### File Naming

Create unit test files alongside source files:
- Source: `shared/utils/download.ts`
- Unit tests: `shared/utils/download.test.ts`

### File Template

```typescript
/**
 * Unit tests for <module name>
 *
 * Tests cover:
 * - <Category 1>
 * - <Category 2>
 * - <Category 3>
 */

import { functionToTest } from './module';

describe('<Module Name>', () => {
  describe('<feature or function name>', () => {
    it('should <expected behavior>', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Test Organization

### Arrange-Act-Assert Pattern

Structure tests using the AAA pattern:

```typescript
it('should download file successfully', async () => {
  // Arrange - Set up test data and mocks
  const url = 'https://example.com/file.bin';
  const destPath = '/tmp/file.bin';
  mockHttpClient.get.mockResolvedValue(mockResponse);

  // Act - Execute the function
  await downloadFile(url, destPath);

  // Assert - Verify the results
  expect(mockHttpClient.get).toHaveBeenCalledWith(url);
  expect(mockInfo).toHaveBeenCalledWith(`Successfully downloaded to ${destPath}`);
});
```

### Nested Describe Blocks

Organize tests hierarchically:

```typescript
describe('downloadFile', () => {
  describe('successful downloads', () => {
    it('should download file successfully on first attempt', async () => {
      // Test implementation
    });

    it('should create destination directory if it does not exist', async () => {
      // Test implementation
    });
  });

  describe('retry logic with transient failures', () => {
    it('should retry on network errors and succeed', async () => {
      // Test implementation
    });
  });

  describe('non-retryable errors', () => {
    it('should not retry on HTTP 404 errors', async () => {
      // Test implementation
    });
  });
});
```

## What to Test

### 1. Happy Path (Success Cases)

Test the main functionality with valid inputs:

```typescript
describe('successful downloads', () => {
  it('should download file successfully on first attempt', async () => {
    const url = 'https://example.com/file.bin';
    const destPath = '/tmp/file.bin';

    await downloadFile(url, destPath);

    expect(mockHttpClient.get).toHaveBeenCalledWith(url);
    expect(mockInfo).toHaveBeenCalledWith(`Successfully downloaded to ${destPath}`);
  });
});
```

### 2. Edge Cases

Test boundary conditions and special values:

```typescript
describe('edge cases', () => {
  it('should handle empty string input', () => {
    expect(process('')).toBe(defaultValue);
  });

  it('should handle null input', () => {
    expect(process(null)).toBe(defaultValue);
  });

  it('should handle undefined input', () => {
    expect(process(undefined)).toBe(defaultValue);
  });

  it('should handle maximum safe integer', () => {
    expect(calculate(Number.MAX_SAFE_INTEGER)).toBeDefined();
  });

  it('should handle minimum safe integer', () => {
    expect(calculate(Number.MIN_SAFE_INTEGER)).toBeDefined();
  });

  it('should handle zero', () => {
    expect(calculate(0)).toBe(0);
  });
});
```

### 3. Error Handling

Test that errors are thrown and handled correctly:

```typescript
describe('error handling', () => {
  it('should throw error on invalid input', async () => {
    await expect(download('', destination))
      .rejects.toThrow('URL cannot be empty');
  });

  it('should throw error on HTTP 404', async () => {
    mockHttpClient.get.mockResolvedValue({ statusCode: 404 });

    await expect(download(url, destination))
      .rejects.toThrow('HTTP 404: Not Found');
  });

  it('should handle file write errors', async () => {
    mockFs.createWriteStream.mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    await expect(download(url, destination))
      .rejects.toThrow('permission denied');
  });
});
```

### 4. Conditional Branches

Test all branches of conditionals:

```typescript
describe('conditional logic', () => {
  it('should use default retries when not specified', async () => {
    await download(url, destination); // No options

    // Verify default behavior
    expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
  });

  it('should use custom retries when specified', async () => {
    await download(url, destination, { retries: 5 });

    // Verify custom value used
  });

  it('should create directory when it does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false);

    await download(url, destination);

    expect(mockFs.mkdirSync).toHaveBeenCalled();
  });

  it('should not create directory when it exists', async () => {
    mockFs.existsSync.mockReturnValue(true);

    await download(url, destination);

    expect(mockFs.mkdirSync).not.toHaveBeenCalled();
  });
});
```

### 5. Specific Scenarios

Test concrete, real-world scenarios:

```typescript
describe('specific scenarios', () => {
  it('should retry exactly 3 times on network error', async () => {
    jest.useFakeTimers();

    mockHttpClient.get.mockRejectedValue(new Error('Network error'));

    const promise = downloadFile(url, destination, 2, 1000).catch(e => e);

    await jest.advanceTimersByTimeAsync(1000); // First retry
    await jest.advanceTimersByTimeAsync(2000); // Second retry

    await promise;

    expect(mockHttpClient.get).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  it('should use exponential backoff with delays 1000ms, 2000ms, 4000ms', async () => {
    jest.useFakeTimers();

    mockHttpClient.get
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockRejectedValueOnce(new Error('Error 3'))
      .mockResolvedValueOnce(mockResponse);

    const promise = downloadFile(url, destination, 3, 1000);

    await jest.advanceTimersByTimeAsync(1000);
    expect(mockInfo).toHaveBeenCalledWith('Retry attempt 1/3 after 1000ms delay...');

    await jest.advanceTimersByTimeAsync(2000);
    expect(mockInfo).toHaveBeenCalledWith('Retry attempt 2/3 after 2000ms delay...');

    await jest.advanceTimersByTimeAsync(4000);
    expect(mockInfo).toHaveBeenCalledWith('Retry attempt 3/3 after 4000ms delay...');

    await promise;

    jest.useRealTimers();
  });
});
```

## Mocking

### When to Mock

Mock external dependencies to isolate the unit under test:
- HTTP requests
- File system operations
- Database calls
- External APIs
- Time/delays
- Random number generation

### Mocking Pattern

```typescript
// Create mock functions
const mockInfo = jest.fn();
const mockHttpClientGet = jest.fn();
const mockExistsSync = jest.fn();

// Mock modules
jest.mock('@actions/core', () => ({
  info: mockInfo,
  warning: jest.fn(),
  error: jest.fn(),
}), { virtual: true });

jest.mock('@actions/http-client', () => ({
  HttpClient: jest.fn().mockImplementation(() => ({
    get: mockHttpClientGet,
  })),
}), { virtual: true });

jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(),
}), { virtual: true });

// Import after mocks
import { downloadFile } from './download.js';

describe('downloadFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock behavior
    mockExistsSync.mockReturnValue(true);
    mockHttpClientGet.mockResolvedValue(mockResponse);
  });

  it('should use mocked dependencies', async () => {
    await downloadFile(url, destination);

    expect(mockHttpClientGet).toHaveBeenCalled();
  });
});
```

### Mock Setup and Cleanup

```typescript
describe('Module Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock behavior
    mockFunction.mockReturnValue(defaultValue);
  });

  afterEach(() => {
    // Restore mocks if needed
    jest.restoreAllMocks();
  });
});
```

### Fake Timers

Use fake timers for testing time-dependent code:

```typescript
describe('retry logic with delays', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should wait for delay before retrying', async () => {
    mockFunction.mockRejectedValueOnce(new Error('Fail'))
                 .mockResolvedValueOnce('Success');

    const promise = retryableFunction();

    // Fast-forward time
    await jest.advanceTimersByTimeAsync(1000);

    await promise;

    expect(mockFunction).toHaveBeenCalledTimes(2);
  });
});
```

## Jest Matchers

### Common Matchers

```typescript
// Equality
expect(value).toBe(5);                    // Strict equality (===)
expect(value).toEqual({ a: 1 });          // Deep equality
expect(value).not.toBe(null);             // Negation

// Truthiness
expect(value).toBeTruthy();               // Truthy value
expect(value).toBeFalsy();                // Falsy value
expect(value).toBeNull();                 // Null
expect(value).toBeUndefined();            // Undefined
expect(value).toBeDefined();              // Not undefined

// Numbers
expect(value).toBeGreaterThan(3);         // >
expect(value).toBeGreaterThanOrEqual(3);  // >=
expect(value).toBeLessThan(5);            // <
expect(value).toBeLessThanOrEqual(5);     // <=
expect(value).toBeCloseTo(0.3);           // Floating point

// Strings
expect(string).toMatch(/pattern/);        // Regex match
expect(string).toContain('substring');    // Contains

// Arrays
expect(array).toContain(item);            // Contains item
expect(array).toHaveLength(3);            // Length

// Objects
expect(object).toHaveProperty('key');     // Has property
expect(object).toMatchObject({ a: 1 });   // Partial match

// Functions
expect(fn).toThrow();                     // Throws error
expect(fn).toThrow('error message');      // Throws specific error
expect(fn).toThrow(TypeError);            // Throws error type

// Async
await expect(promise).resolves.toBe(5);   // Promise resolves to value
await expect(promise).rejects.toThrow();  // Promise rejects

// Mocks
expect(mockFn).toHaveBeenCalled();        // Called at least once
expect(mockFn).toHaveBeenCalledTimes(2);  // Called exact number
expect(mockFn).toHaveBeenCalledWith(arg); // Called with arguments
expect(mockFn).toHaveBeenLastCalledWith(arg); // Last call arguments
```

## Test Coverage Goals

Unit tests should focus on:
- **Specific examples**: Concrete inputs and expected outputs
- **Edge cases**: Boundary values, empty inputs, null/undefined
- **Error paths**: All error conditions and exceptions
- **Branch coverage**: All if/else, switch, ternary branches
- **Real scenarios**: Common use cases from requirements

Unit tests should NOT:
- Test implementation details that may change
- Duplicate property-based tests
- Test framework code or dependencies
- Test obvious getters/setters with no logic

## Running Unit Tests

### Run All Unit Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- download.test.ts
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run with Coverage

```bash
npm run test:coverage
```

## Commit Format

Create ONE commit with all unit test files:

```bash
git add <test-files>
git commit -m "test(<scope>): add unit tests for <context>"
```

**Format Components**:
- **Type**: Always `test`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description of what was tested

**Examples**:
```
test(shared): add unit tests for download utility
test(setup): add unit tests for CLI installation
test(pr-review): add unit tests for context retrieval
```

## Quality Checklist

Before committing, verify:
- [ ] All exported functions have unit tests
- [ ] Happy path is tested with specific examples
- [ ] Edge cases are covered (empty, null, undefined, boundaries)
- [ ] Error paths are tested
- [ ] All conditional branches are tested
- [ ] Mocks are used for external dependencies
- [ ] Tests are clear and well-organized
- [ ] Tests pass locally: `npm test`
- [ ] Commit message follows format

## Common Patterns

### Pattern 1: Testing Success Cases

```typescript
describe('successful operations', () => {
  it('should perform operation successfully', async () => {
    const input = 'valid input';

    const result = await performOperation(input);

    expect(result).toBe('expected output');
  });
});
```

### Pattern 2: Testing Error Cases

```typescript
describe('error handling', () => {
  it('should throw error on invalid input', () => {
    expect(() => validate('')).toThrow('Input cannot be empty');
  });

  it('should throw specific error type', () => {
    expect(() => validate(null)).toThrow(TypeError);
  });
});
```

### Pattern 3: Testing Async Functions

```typescript
describe('async operations', () => {
  it('should resolve with correct value', async () => {
    const result = await asyncFunction();

    expect(result).toBe('expected');
  });

  it('should reject with error', async () => {
    await expect(asyncFunction()).rejects.toThrow('Error message');
  });
});
```

### Pattern 4: Testing with Mocks

```typescript
describe('with mocked dependencies', () => {
  it('should call dependency with correct arguments', async () => {
    mockDependency.mockResolvedValue('mocked result');

    await functionUnderTest('input');

    expect(mockDependency).toHaveBeenCalledWith('input');
  });

  it('should handle dependency failure', async () => {
    mockDependency.mockRejectedValue(new Error('Dependency failed'));

    await expect(functionUnderTest('input')).rejects.toThrow('Dependency failed');
  });
});
```

### Pattern 5: Testing Conditional Logic

```typescript
describe('conditional behavior', () => {
  it('should take true branch', () => {
    const result = conditionalFunction(true);
    expect(result).toBe('true branch');
  });

  it('should take false branch', () => {
    const result = conditionalFunction(false);
    expect(result).toBe('false branch');
  });

  it('should use default value when undefined', () => {
    const result = conditionalFunction(undefined);
    expect(result).toBe('default value');
  });
});
```

## Example Complete Test File

```typescript
/**
 * Unit tests for download utility
 *
 * Tests cover:
 * - Successful downloads
 * - Retry logic with exponential backoff
 * - Non-retryable errors (404)
 * - Edge cases (empty paths, null values)
 * - Error handling
 */

import { downloadFile } from './download';

// Mock setup
const mockHttpGet = jest.fn();
jest.mock('@actions/http-client', () => ({
  HttpClient: jest.fn().mockImplementation(() => ({
    get: mockHttpGet,
  })),
}), { virtual: true });

describe('downloadFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpGet.mockResolvedValue(mockSuccessResponse);
  });

  describe('successful downloads', () => {
    it('should download file successfully', async () => {
      await downloadFile('https://example.com/file', '/tmp/file');

      expect(mockHttpGet).toHaveBeenCalledWith('https://example.com/file');
    });
  });

  describe('edge cases', () => {
    it('should handle empty URL', async () => {
      await expect(downloadFile('', '/tmp/file'))
        .rejects.toThrow('URL cannot be empty');
    });
  });

  describe('error handling', () => {
    it('should throw on HTTP 404', async () => {
      mockHttpGet.mockResolvedValue({ statusCode: 404 });

      await expect(downloadFile('https://example.com/file', '/tmp/file'))
        .rejects.toThrow('HTTP 404');
    });
  });
});
```

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent
- Unit testing agent (you)
- Coverage testing agent
- Linting agent
- Formatting agent
- Pre-commit validation agent
- Security audit agent
- Type checking agent
- Build verification agent

Your work will be consolidated with others during PR submission.

## Final Notes

- Unit tests verify specific examples and concrete cases
- Property tests verify universal properties across many inputs
- Both types of tests are valuable and complement each other
- Focus on testing behavior, not implementation details
- Write clear, readable tests that serve as documentation
- Test edge cases and error conditions thoroughly
- Use mocks to isolate the unit under test
- Keep tests simple and focused on one thing

Begin now.
