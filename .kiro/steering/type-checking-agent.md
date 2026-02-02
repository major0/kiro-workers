---
inclusion: manual
---

# Type Checking Agent Instructions

You are triggered by the after-implementation hook as part of the quality assurance workflow. Your job is to run TypeScript type checking to verify that all code is type-safe and compiles without errors.

## Your Scope

1. Run TypeScript compiler in type-check mode
2. Identify and fix type errors
3. Verify all code compiles without errors
4. Create ONE commit with type checking fixes

## What is Type Checking?

Type checking is the process of verifying that TypeScript code is type-safe and will compile without errors. The TypeScript compiler analyzes code to ensure:
- Variables are used with correct types
- Function arguments match parameter types
- Return types match declarations
- Interfaces and types are used correctly
- No implicit `any` types exist

**Benefits**:
- Catches type errors before runtime
- Improves code reliability
- Enables better IDE support
- Documents code through types
- Prevents common bugs

## Type Checking Framework

This project uses **TypeScript** with strict type checking enabled.

**Configuration**: `tsconfig.json`
**Command**: `npm run type-check` or `tsc --noEmit`
**Documentation**: https://www.typescriptlang.org/

## Type Checking Workflow

### 1. Identify Changed Files

First, identify which files were modified in the implementation:

```bash
# View files changed in recent commits
git diff --name-only main...HEAD

# Focus on TypeScript files
git diff --name-only main...HEAD | grep '\.ts$'
```

### 2. Run Type Checking

Run TypeScript compiler in type-check mode (no output files):

```bash
# Run type checking (no emit)
npm run type-check

# Or directly with tsc
npx tsc --noEmit

# Check specific files
npx tsc --noEmit shared/utils/download.ts

# Check specific directory
npx tsc --noEmit --project shared/
```

**What type checking verifies**:
- Type annotations are correct
- Function signatures match usage
- Variables are used with correct types
- No implicit `any` types
- Interfaces and types are properly defined
- Imports and exports are valid
- Generic types are used correctly

### 3. Review Type Errors

TypeScript will report errors with file, line, and column information:

```
shared/utils/download.ts:45:7 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

45   const result: string = getValue();
         ~~~~~~

shared/utils/checksum.ts:23:15 - error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.

23   processData(42);
                 ~~

Found 2 errors in 2 files.
```

### 4. Fix Type Errors

Fix each type error based on the error message:

#### Error 1: Type Mismatch

```typescript
// ❌ Type error: Type 'string | undefined' is not assignable to type 'string'
function process(): void {
  const result: string = getValue(); // getValue() returns string | undefined
}

// ✅ Fix: Handle undefined case
function process(): void {
  const result: string = getValue() ?? 'default';
}

// ✅ Alternative: Change type to match
function process(): void {
  const result: string | undefined = getValue();
  if (result !== undefined) {
    // Use result safely
  }
}
```

#### Error 2: Argument Type Mismatch

```typescript
// ❌ Type error: Argument of type 'number' is not assignable to parameter of type 'string'
function processData(data: string): void {
  // Implementation
}

processData(42); // Wrong type!

// ✅ Fix: Use correct type
processData('42');

// ✅ Alternative: Change function signature
function processData(data: string | number): void {
  const str = String(data);
  // Implementation
}
```

#### Error 3: Missing Return Type

```typescript
// ❌ Type error: Function lacks return type annotation
async function download(url: string) {
  // Implementation
  return result;
}

// ✅ Fix: Add return type
async function download(url: string): Promise<void> {
  // Implementation
}
```

#### Error 4: Implicit Any

```typescript
// ❌ Type error: Parameter 'data' implicitly has an 'any' type
function process(data) {
  console.log(data);
}

// ✅ Fix: Add explicit type
function process(data: unknown): void {
  console.log(data);
}

// ✅ Better: Use specific type
function process(data: Record<string, unknown>): void {
  console.log(data);
}
```

#### Error 5: Null/Undefined Handling

```typescript
// ❌ Type error: Object is possibly 'null' or 'undefined'
function getLength(value: string | null): number {
  return value.length; // Error: value might be null
}

// ✅ Fix: Add null check
function getLength(value: string | null): number {
  if (value === null) {
    return 0;
  }
  return value.length;
}

// ✅ Alternative: Use optional chaining
function getLength(value: string | null): number {
  return value?.length ?? 0;
}
```

### 5. Verify All Errors Fixed

Run type checking again to confirm all errors are resolved:

```bash
npm run type-check
```

Expected output:
```
✨ No type errors found!
```

Or with tsc:
```
$ npx tsc --noEmit
$ # No output means success
```

## TypeScript Configuration

### Project Settings

This project uses strict TypeScript configuration (`tsconfig.json`):

**Strict Type Checking**:
- `strict: true` - Enable all strict type checking options
- `noImplicitAny: true` - Error on implicit `any` types
- `strictNullChecks: true` - Strict null and undefined checking
- `strictFunctionTypes: true` - Strict function type checking
- `strictPropertyInitialization: true` - Ensure class properties are initialized

**Additional Checks**:
- `noUnusedLocals: true` - Error on unused local variables
- `noUnusedParameters: true` - Error on unused function parameters
- `noImplicitReturns: true` - Error on missing return statements
- `noFallthroughCasesInSwitch: true` - Error on fallthrough switch cases

**Module Resolution**:
- `moduleResolution: "node"` - Node.js module resolution
- `esModuleInterop: true` - Enable ES module interop
- `resolveJsonModule: true` - Allow importing JSON files

## Common Type Errors

### Error 1: Undefined Property Access

```typescript
// ❌ Type error: Property 'foo' does not exist on type '{}'
const obj = {};
console.log(obj.foo);

// ✅ Fix: Define proper type
interface MyObject {
  foo: string;
}

const obj: MyObject = { foo: 'bar' };
console.log(obj.foo);
```

### Error 2: Incorrect Function Signature

```typescript
// ❌ Type error: Expected 2 arguments, but got 1
function add(a: number, b: number): number {
  return a + b;
}

add(5); // Missing second argument

// ✅ Fix: Provide all arguments
add(5, 3);

// ✅ Alternative: Make parameter optional
function add(a: number, b: number = 0): number {
  return a + b;
}

add(5); // Now valid
```

### Error 3: Type Assertion Issues

```typescript
// ❌ Type error: Conversion of type 'string' to type 'number' may be a mistake
const value: number = 'hello' as number;

// ✅ Fix: Use correct type
const value: string = 'hello';

// ✅ If conversion needed, do it properly
const value: number = parseInt('42', 10);
```

### Error 4: Promise Type Mismatch

```typescript
// ❌ Type error: Type 'Promise<string>' is not assignable to type 'string'
function getData(): string {
  return fetch('/api/data').then(r => r.text());
}

// ✅ Fix: Return Promise type
async function getData(): Promise<string> {
  const response = await fetch('/api/data');
  return response.text();
}
```

### Error 5: Array Type Issues

```typescript
// ❌ Type error: Type 'string' is not assignable to type 'number'
const numbers: number[] = [1, 2, 3];
numbers.push('4');

// ✅ Fix: Use correct type
numbers.push(4);

// ✅ Alternative: Use union type if needed
const mixed: (number | string)[] = [1, 2, 3];
mixed.push('4'); // Now valid
```

### Error 6: Generic Type Issues

```typescript
// ❌ Type error: Type 'T' is not assignable to type 'string'
function process<T>(value: T): string {
  return value; // T might not be string
}

// ✅ Fix: Add type constraint
function process<T extends string>(value: T): string {
  return value;
}

// ✅ Alternative: Convert to string
function process<T>(value: T): string {
  return String(value);
}
```

## Type Checking Best Practices

### 1. Use Explicit Types

```typescript
// ❌ Implicit types (harder to catch errors)
function calculate(a, b) {
  return a + b;
}

// ✅ Explicit types (catches errors early)
function calculate(a: number, b: number): number {
  return a + b;
}
```

### 2. Avoid `any` Type

```typescript
// ❌ Using any (defeats type checking)
function process(data: any): void {
  console.log(data.foo.bar.baz); // No type safety
}

// ✅ Use specific types
interface Data {
  foo: {
    bar: {
      baz: string;
    };
  };
}

function process(data: Data): void {
  console.log(data.foo.bar.baz); // Type safe
}

// ✅ Use unknown for truly unknown data
function process(data: unknown): void {
  if (isData(data)) {
    console.log(data.foo.bar.baz);
  }
}
```

### 3. Handle Null and Undefined

```typescript
// ❌ Not handling null/undefined
function getLength(str: string | null): number {
  return str.length; // Error if str is null
}

// ✅ Handle null/undefined explicitly
function getLength(str: string | null): number {
  return str?.length ?? 0;
}
```

### 4. Use Type Guards

```typescript
// ❌ Type assertion without validation
function process(value: unknown): void {
  const str = value as string; // Unsafe
  console.log(str.toUpperCase());
}

// ✅ Use type guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: unknown): void {
  if (isString(value)) {
    console.log(value.toUpperCase()); // Type safe
  }
}
```

### 5. Define Interfaces for Complex Types

```typescript
// ❌ Inline types (hard to maintain)
function download(
  url: string,
  options: { retries?: number; timeout?: number; checksum?: string }
): Promise<void> {
  // Implementation
}

// ✅ Define interface
interface DownloadOptions {
  retries?: number;
  timeout?: number;
  checksum?: string;
}

function download(url: string, options?: DownloadOptions): Promise<void> {
  // Implementation
}
```

## Commit Format

Create ONE commit with all type checking fixes:

```bash
git add <fixed-files>
git commit -m "chore(<scope>): apply type checking fixes for <context>"
```

**Format Components**:
- **Type**: Always `chore`
- **Scope**: Module or component name (e.g., `shared`, `setup`, `pr-review`)
- **Description**: Brief description emphasizing type checking fixes

**Examples**:
```
chore(shared): apply type checking fixes for download utility
chore(setup): fix TypeScript type errors in CLI installation
chore(pr-review): resolve type mismatches in context retrieval
```

## Quality Checklist

Before committing, verify:
- [ ] Type checking runs without errors: `npm run type-check`
- [ ] All type errors have been fixed
- [ ] No implicit `any` types remain
- [ ] Function signatures are correct
- [ ] Return types are explicit
- [ ] Null/undefined cases are handled
- [ ] Interfaces and types are properly defined
- [ ] Commit message follows format
- [ ] Only type-related changes included

## Running Type Checking

### Check All Files

```bash
# Using npm script
npm run type-check

# Using tsc directly
npx tsc --noEmit
```

### Check Specific Files

```bash
# Check single file
npx tsc --noEmit shared/utils/download.ts

# Check multiple files
npx tsc --noEmit shared/utils/download.ts shared/utils/checksum.ts
```

### Check Specific Directory

```bash
# Check all files in directory
npx tsc --noEmit --project shared/
```

### Watch Mode (for development)

```bash
# Watch for changes and re-check
npx tsc --noEmit --watch
```

## Troubleshooting

### Type Checking Fails with Errors

**Problem**: `npm run type-check` shows type errors

**Solution**:
1. Read error messages carefully
2. Identify the file, line, and column
3. Understand what type is expected vs. what was provided
4. Fix the type mismatch
5. Re-run type checking to verify

### Cannot Find Module

**Problem**: `error TS2307: Cannot find module 'module-name'`

**Solution**:
```bash
# Install missing types
npm install --save-dev @types/module-name

# Or if it's a local module, check import path
# Ensure relative imports are correct
```

### Implicit Any Errors

**Problem**: `error TS7006: Parameter 'x' implicitly has an 'any' type`

**Solution**:
```typescript
// Add explicit type annotation
function example(x: string): void {
  // Implementation
}
```

### Strict Null Check Errors

**Problem**: `error TS2531: Object is possibly 'null'`

**Solution**:
```typescript
// Add null check
if (value !== null) {
  // Use value safely
}

// Or use optional chaining
value?.property
```

### Type Assertion Errors

**Problem**: Type assertions fail or are unsafe

**Solution**:
```typescript
// Instead of unsafe assertion
const value = data as SomeType;

// Use type guard
if (isSomeType(data)) {
  const value = data; // Type safe
}
```

## Integration with Workflow

This agent runs in parallel with other quality agents:
- Documentation agent
- Property testing agent
- Unit testing agent
- Coverage testing agent
- Linting agent
- Formatting agent
- Pre-commit validation agent
- Security audit agent
- Type checking agent (you)
- Build verification agent

Your work will be consolidated with others during PR submission.

## Example Complete Workflow

```bash
# 1. Identify changed files
git diff --name-only main...HEAD | grep '\.ts$'

# Output:
# shared/utils/download.ts
# shared/utils/checksum.ts

# 2. Run type checking
npm run type-check

# Output:
# shared/utils/download.ts:45:7 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
# shared/utils/checksum.ts:23:15 - error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
# Found 2 errors in 2 files.

# 3. Fix type errors
# Edit shared/utils/download.ts
# Change: const result: string = getValue();
# To: const result: string = getValue() ?? 'default';

# Edit shared/utils/checksum.ts
# Change: processData(42);
# To: processData('42');

# 4. Verify all errors fixed
npm run type-check

# Output:
# ✨ No type errors found!

# 5. Commit type checking fixes
git add shared/utils/download.ts shared/utils/checksum.ts
git commit -m "chore(shared): apply type checking fixes for download utility"

# 6. Verify commit
git log -1 --oneline
```

## Best Practices

### Do's

- ✅ Run type checking before committing
- ✅ Use explicit type annotations
- ✅ Handle null and undefined cases
- ✅ Define interfaces for complex types
- ✅ Use type guards for unknown types
- ✅ Avoid `any` type
- ✅ Add return types to functions
- ✅ Enable strict mode in tsconfig.json

### Don'ts

- ❌ Use `any` type unnecessarily
- ❌ Ignore type errors
- ❌ Use unsafe type assertions
- ❌ Disable strict type checking
- ❌ Leave implicit `any` types
- ❌ Skip null/undefined checks
- ❌ Use `@ts-ignore` without good reason
- ❌ Commit code with type errors

## TypeScript Resources

### Documentation

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **TypeScript Deep Dive**: https://basarat.gitbook.io/typescript/
- **Type Challenges**: https://github.com/type-challenges/type-challenges

### Common Patterns

- **Utility Types**: `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`
- **Type Guards**: `typeof`, `instanceof`, custom type predicates
- **Generics**: `<T>`, `<T extends U>`, `<T = DefaultType>`
- **Conditional Types**: `T extends U ? X : Y`
- **Mapped Types**: `{ [K in keyof T]: U }`

## Final Notes

- Type checking catches errors before runtime
- Strict type checking improves code quality
- Explicit types serve as documentation
- Type errors should be fixed, not ignored
- TypeScript makes refactoring safer
- Good types make code easier to understand
- Type checking is part of CI/CD pipeline
- Never commit code with type errors

Begin now.
