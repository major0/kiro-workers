---
inclusion: manual
---

# Property Testing Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to create property-based tests for the implemented functionality.

## Your Scope

1. Create property-based tests using fast-check
2. Verify universal correctness properties (not specific examples)
3. Run tests with 100+ iterations
4. Link properties to requirements
5. Create ONE testing commit

## What is Property-Based Testing?

Property-based testing validates that code satisfies universal properties across a wide range of inputs, rather than testing specific examples. Instead of writing:

```typescript
// Example-based test
expect(add(2, 3)).toBe(5);
```

You write:

```typescript
// Property-based test
fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    // Property: addition is commutative
    return add(a, b) === add(b, a);
  })
);
```

## Property-Based Testing Framework

This project uses **fast-check** for property-based testing.

**Installation**: Already included in devDependencies
**Import**: `import * as fc from 'fast-check';`
**Documentation**: https://fast-check.dev/

## Identifying Properties

### Good Properties to Test

1. **Invariants**: Things that should always be true
   - "Output is always non-negative"
   - "Result length equals input length"
   - "Function never throws for valid inputs"

2. **Relationships**: How inputs relate to outputs
   - "Larger input produces larger output"
   - "Output is always less than input"
   - "Result is idempotent (f(f(x)) = f(x))"

3. **Round-trip Properties**: Encode/decode cycles
   - "parse(stringify(x)) === x"
   - "decompress(compress(x)) === x"

4. **Algebraic Properties**: Mathematical relationships
   - "Commutative: f(a, b) === f(b, a)"
   - "Associative: f(f(a, b), c) === f(a, f(b, c))"
   - "Identity: f(x, identity) === x"

5. **Error Handling**: Failure conditions
   - "Invalid input always throws specific error"
   - "Retries occur on transient failures"
   - "Timeouts are respected"

### Properties to Avoid

- Properties that just reimplement the function
- Properties that test specific values (use unit tests instead)
- Properties that are too weak ("function returns something")

## Test File Structure

### File Naming

Create property test files alongside source files:
- Source: `shared/utils/download.ts`
- Property tests: `shared/utils/download.properties.test.ts`

### File Template

```typescript
/**
 * Property-based tests for <module name>
 *
 * This file contains property-based tests using fast-check to validate
 * universal correctness properties of <module description>.
 *
 * Property <number>: <property name>
 * Validates: Requirements <requirement-ids>
 */

import * as fc from 'fast-check';
import { functionToTest } from './module';

describe('Property-Based Tests: <Module Name>', () => {
  /**
   * Property <number>: <Property Name>
   *
   * **Validates: Requirements <requirement-ids>**
   *
   * This property verifies that <description of what property checks>.
   *
   * The property checks:
   * 1. <First thing checked>
   * 2. <Second thing checked>
   * 3. <Third thing checked>
   */
  describe('Property <number>: <Property Name>', () => {
    it('should <property description>', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Arbitraries (input generators)
          fc.integer({ min: 1, max: 100 }),
          fc.string(),
          // Property function
          async (num, str) => {
            // Test the property
            const result = await functionToTest(num, str);

            // Assert the property holds
            expect(result).toSatisfyProperty();
          }
        ),
        {
          numRuns: 100, // Minimum 100 iterations
          verbose: true,
        }
      );
    });
  });
});
```

## Fast-Check Arbitraries

### Common Arbitraries

```typescript
// Numbers
fc.integer()                          // Any integer
fc.integer({ min: 0, max: 100 })     // Range
fc.nat()                              // Natural numbers (>= 0)
fc.float()                            // Floating point
fc.double()                           // Double precision

// Strings
fc.string()                           // Any string
fc.string({ minLength: 1 })          // Non-empty string
fc.hexaString()                       // Hex strings
fc.webUrl()                           // Valid URLs

// Booleans
fc.boolean()                          // true or false

// Arrays
fc.array(fc.integer())                // Array of integers
fc.array(fc.string(), { minLength: 1 }) // Non-empty array

// Objects
fc.record({                           // Object with specific shape
  name: fc.string(),
  age: fc.nat(),
})

// Choices
fc.constantFrom('a', 'b', 'c')        // Pick from values
fc.oneof(fc.string(), fc.integer())   // Union types

// Tuples
fc.tuple(fc.string(), fc.integer())   // Fixed-size array

// Dates
fc.date()                             // Any date
fc.date({ min: new Date('2020-01-01') }) // Date range
```

### Custom Arbitraries

Create domain-specific generators:

```typescript
// Generate valid download options
const downloadOptionsArbitrary = fc.record({
  retries: fc.integer({ min: 0, max: 10 }),
  timeout: fc.integer({ min: 1000, max: 60000 }),
  checksum: fc.option(fc.hexaString({ minLength: 64, maxLength: 64 })),
});

// Generate valid URLs
const urlArbitrary = fc.webUrl({ validSchemes: ['https'] });

// Generate error messages
const errorMessageArbitrary = fc.constantFrom(
  'Network timeout',
  'Connection refused',
  'ECONNRESET',
  'ETIMEDOUT'
);
```

## Writing Properties

### Example 1: Retry Logic

```typescript
/**
 * Property 1: Exponential Backoff
 *
 * **Validates: Requirements 2.3.2**
 *
 * This property verifies that retry delays follow exponential backoff.
 */
it('should use exponential backoff for retries', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 5 }),      // maxRetries
      fc.integer({ min: 100, max: 2000 }), // initialDelay
      async (maxRetries, initialDelay) => {
        const delays: number[] = [];

        // Mock to capture delays
        const mockDelay = jest.fn((ms) => {
          delays.push(ms);
          return Promise.resolve();
        });

        // Run function that retries
        await functionWithRetry({ maxRetries, initialDelay, delay: mockDelay });

        // Verify exponential backoff: delay_n = initialDelay * 2^(n-1)
        for (let i = 0; i < delays.length; i++) {
          const expectedDelay = initialDelay * Math.pow(2, i);
          expect(delays[i]).toBe(expectedDelay);
        }
      }
    ),
    { numRuns: 100, verbose: true }
  );
});
```

### Example 2: Idempotency

```typescript
/**
 * Property 2: Idempotency
 *
 * **Validates: Requirements 3.1.1**
 *
 * This property verifies that applying the function twice produces
 * the same result as applying it once.
 */
it('should be idempotent', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string(),
      async (input) => {
        const once = await normalize(input);
        const twice = await normalize(once);

        // Property: f(f(x)) === f(x)
        expect(twice).toBe(once);
      }
    ),
    { numRuns: 100, verbose: true }
  );
});
```

### Example 3: Error Handling

```typescript
/**
 * Property 3: Invalid Input Rejection
 *
 * **Validates: Requirements 4.2.1**
 *
 * This property verifies that invalid inputs always throw
 * a specific error type.
 */
it('should reject invalid inputs with TypeError', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(''),
        fc.integer({ max: -1 })
      ),
      async (invalidInput) => {
        // Property: invalid input always throws TypeError
        await expect(validateInput(invalidInput)).rejects.toThrow(TypeError);
      }
    ),
    { numRuns: 100, verbose: true }
  );
});
```

### Example 4: Relationship Properties

```typescript
/**
 * Property 4: Monotonicity
 *
 * **Validates: Requirements 5.1.3**
 *
 * This property verifies that larger inputs produce larger outputs.
 */
it('should produce larger outputs for larger inputs', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 0, max: 1000 }),
      fc.integer({ min: 0, max: 1000 }),
      async (a, b) => {
        fc.pre(a < b); // Precondition: a must be less than b

        const resultA = await computeScore(a);
        const resultB = await computeScore(b);

        // Property: a < b implies f(a) <= f(b)
        expect(resultA).toBeLessThanOrEqual(resultB);
      }
    ),
    { numRuns: 100, verbose: true }
  );
});
```

## Mocking for Property Tests

### When to Mock

Mock external dependencies:
- HTTP requests
- File system operations
- Time/delays
- Random number generation

### Mocking Pattern

```typescript
describe('Property-Based Tests: Download Utility', () => {
  // Create mocks
  const mockHttpGet = jest.fn();
  const mockWriteStream = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    jest.mock('@actions/http-client', () => ({
      HttpClient: jest.fn().mockImplementation(() => ({
        get: mockHttpGet,
      })),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('property test with mocks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        async (url) => {
          // Configure mock for this iteration
          mockHttpGet.mockResolvedValue({ statusCode: 200, body: 'data' });

          // Test property
          const result = await download(url);
          expect(result).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Test Configuration

### Minimum Iterations

**CRITICAL**: All property tests must run at least 100 iterations.

```typescript
await fc.assert(
  fc.property(/* ... */),
  {
    numRuns: 100,      // Minimum 100 iterations
    verbose: true,     // Show detailed output on failure
  }
);
```

### Timeout Configuration

For async properties with delays:

```typescript
it('property test', async () => {
  await fc.assert(
    fc.asyncProperty(/* ... */),
    {
      numRuns: 100,
      verbose: true,
      timeout: 10000,  // 10 second timeout per iteration
    }
  );
}, 30000); // 30 second Jest timeout for entire test
```

## Requirement Linking

**CRITICAL**: Every property must link to specific requirements.

### Format

Use this exact format in the property documentation:

```typescript
/**
 * Property <number>: <Property Name>
 *
 * **Validates: Requirements <requirement-ids>**
 *
 * <Description>
 */
```

### Examples

```typescript
/**
 * Property 35: Retry with Exponential Backoff
 *
 * **Validates: Requirements 9.4**
 *
 * This property verifies that retry delays follow exponential backoff.
 */

/**
 * Property 12: Checksum Verification
 *
 * **Validates: Requirements 3.2.1, 3.2.2**
 *
 * This property verifies that downloads with mismatched checksums are rejected.
 */
```

## Running Property Tests

### Run All Property Tests

```bash
npm run test:properties
```

### Run Specific Property Test File

```bash
npm test -- download.properties.test.ts
```

### Run with Coverage

```bash
npm run test:coverage -- --testMatch='**/*.properties.test.ts'
```

## Commit Format

Create ONE commit with all property test files:

```bash
git add <test-files>
git commit -m "test(<scope>): add property-based tests for <context>"
```

**Format Components**:
- **Type**: Always `test`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description of what was tested

**Examples**:
```
test(shared): add property-based tests for download utility
test(setup): add property-based tests for CLI installation
test(pr-review): add property-based tests for context retrieval
```

## Quality Checklist

Before committing, verify:
- [ ] All properties run at least 100 iterations
- [ ] Each property has clear documentation
- [ ] Each property links to specific requirements
- [ ] Properties test universal correctness (not specific examples)
- [ ] Mocks are used for external dependencies
- [ ] Tests pass locally: `npm run test:properties`
- [ ] Commit message follows format

## Common Patterns

### Pattern 1: Testing Retry Logic

```typescript
await fc.assert(
  fc.asyncProperty(
    fc.integer({ min: 1, max: 5 }),
    async (maxRetries) => {
      let attempts = 0;
      mockFunction.mockImplementation(() => {
        attempts++;
        if (attempts <= maxRetries) {
          throw new Error('Transient error');
        }
        return 'success';
      });

      await functionWithRetry({ maxRetries });

      // Property: attempts = maxRetries + 1 (initial + retries)
      expect(attempts).toBe(maxRetries + 1);
    }
  ),
  { numRuns: 100 }
);
```

### Pattern 2: Testing Input Validation

```typescript
await fc.assert(
  fc.asyncProperty(
    fc.string({ minLength: 1 }),
    async (validInput) => {
      // Property: valid input never throws
      await expect(validate(validInput)).resolves.not.toThrow();
    }
  ),
  { numRuns: 100 }
);
```

### Pattern 3: Testing Determinism

```typescript
await fc.assert(
  fc.asyncProperty(
    fc.anything(),
    async (input) => {
      const result1 = await deterministicFunction(input);
      const result2 = await deterministicFunction(input);

      // Property: same input produces same output
      expect(result1).toEqual(result2);
    }
  ),
  { numRuns: 100 }
);
```

## Debugging Failed Properties

When a property fails, fast-check provides a counterexample:

```
Property failed after 42 runs
Counterexample: [5, "test", true]
Shrunk 3 times
```

### Steps to Debug

1. **Reproduce**: Use the counterexample to reproduce the failure
   ```typescript
   it('debug failing case', async () => {
     await functionToTest(5, "test", true);
   });
   ```

2. **Analyze**: Understand why this input causes failure

3. **Fix**: Either fix the code or adjust the property

4. **Verify**: Re-run property tests to ensure fix works

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent (you)
- Unit testing agent
- Coverage testing agent
- Linting agent
- Formatting agent
- Pre-commit validation agent
- Security audit agent
- Type checking agent
- Build verification agent

Your work will be consolidated with others during PR submission.

## Final Notes

- Property tests complement unit tests (don't replace them)
- Focus on universal properties, not specific examples
- Use smart generators that constrain to valid input space
- 100+ iterations minimum to catch edge cases
- Link every property to requirements
- Document what each property validates

Begin now.
