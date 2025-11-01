# Unit Testing Documentation

This document provides comprehensive documentation for all unit tests in the project.

## Table of Contents

1. [Overview](#overview)
2. [Test Setup](#test-setup)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Module Test Documentation](#module-test-documentation)
   - [Database Module Tests](#database-module-tests)
   - [Authentication Module Tests](#authentication-module-tests)
   - [Email Service Module Tests](#email-service-module-tests)
   - [Email Queue Processor Tests](#email-queue-processor-tests)
   - [Utils Module Tests](#utils-module-tests)
   - [Contact Groups Hook Tests](#contact-groups-hook-tests)
6. [Test Best Practices](#test-best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The project uses **Jest** as the testing framework with **TypeScript** support. All unit tests are located in `__tests__` directories alongside their corresponding source files.

### Testing Stack

- **Jest**: JavaScript testing framework
- **ts-jest**: TypeScript preprocessor for Jest
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM

## Test Setup

### Installation

Dependencies are included in `package.json`. Install them with:

```bash
npm install
```

### Configuration

- **Jest Config**: `jest.config.js` - Main Jest configuration
- **Jest Setup**: `jest.setup.js` - Global test setup and configuration
- **TypeScript Config**: `tsconfig.json` - TypeScript configuration

### Environment Variables

For testing, you may need to set up environment variables. Create a `.env.test` file if needed:

```env
DB_HOST=localhost
DB_USER=test_user
DB_PASS=test_password
DB_NAME=test_db
SMTP_HOST=smtp.test.com
SMTP_PORT=587
SMTP_USER=test@test.com
SMTP_PASS=test_password
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage Report

```bash
npm run test:coverage
```

This will generate a coverage report showing:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

### Run Specific Test File

```bash
npm test -- db.test.ts
```

### Run Tests Matching a Pattern

```bash
npm test -- --testNamePattern="should create a connection"
```

## Test Coverage

### Target Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Current Coverage

Run `npm run test:coverage` to see current coverage metrics for each module.

## Module Test Documentation

### Database Module Tests

**File**: `app/lib/__tests__/db.test.ts`

#### Tested Methods

1. **`createConnection()`**
   - Creates database connection with default config
   - Creates connection with environment variables
   - Handles connection failures

2. **`executeQuery(query, params, retries)`**
   - Executes SELECT queries and returns arrays
   - Executes non-SELECT queries and returns results
   - Handles retries with exponential backoff
   - Throws errors after all retries fail
   - Uses default retry count of 3

3. **`executeTransaction(queries)`**
   - Executes multiple queries in a transaction
   - Commits transaction on success
   - Rolls back on error
   - Handles empty queries array

#### Test Scenarios

- ✅ Successful connection creation
- ✅ Connection with environment variables
- ✅ Connection failure handling
- ✅ SELECT query execution
- ✅ Non-SELECT query execution
- ✅ Query retry mechanism
- ✅ Transaction success
- ✅ Transaction rollback on error

### Authentication Module Tests

**File**: `app/lib/__tests__/auth.test.ts`

#### Tested Methods

1. **`createToken(payload)`**
   - Creates JWT token with correct payload
   - Sets proper token headers and expiration
   - Handles different payload types

2. **`verifyToken(token)`**
   - Verifies valid tokens
   - Returns null for invalid token structure
   - Returns null for tokens missing required fields
   - Handles verification errors

3. **`getTokenFromRequest(request)`**
   - Extracts token from Bearer authorization header
   - Returns null when header is missing
   - Returns null for non-Bearer auth schemes
   - Handles tokens with spaces

4. **`isTokenExpired(token)`**
   - Returns false for valid non-expired tokens
   - Returns true for expired tokens
   - Returns true for tokens without exp field
   - Handles invalid token formats
   - Handles malformed base64

#### Test Scenarios

- ✅ Token creation with valid payload
- ✅ Token creation with admin payload
- ✅ Token verification success
- ✅ Token verification with invalid structure
- ✅ Token extraction from request
- ✅ Token expiration checking
- ✅ Error handling for all methods

### Email Service Module Tests

**File**: `app/lib/__tests__/email.test.ts`

#### Tested Methods

1. **`sendEmail(emailData)`**
   - Sends email successfully
   - Handles array of recipients
   - Includes CC and BCC
   - Includes attachments
   - Handles transporter initialization errors
   - Handles sendMail errors

2. **`sendBulkEmails(emails)`**
   - Sends multiple emails in sequence
   - Handles partial failures
   - Adds delay between emails

3. **`testConnection()`**
   - Returns success when connection is valid
   - Returns error when connection fails
   - Handles timeout scenarios

4. **`sendTestEmail(to)`**
   - Sends test email with correct format

5. **`getConfiguration()`**
   - Returns configuration when available

6. **`isReady()`**
   - Returns boolean indicating readiness

7. **`getInitializationError()`**
   - Returns error message or null

8. **`getStatus()`**
   - Returns comprehensive status object

#### Test Scenarios

- ✅ Email sending success
- ✅ Bulk email sending
- ✅ Connection testing
- ✅ Test email sending
- ✅ Configuration retrieval
- ✅ Status checking
- ✅ Error handling

### Email Queue Processor Tests

**File**: `app/lib/__tests__/emailQueue.test.ts`

#### Tested Methods

1. **`processQueue()`**
   - Processes pending emails
   - Handles email service readiness check
   - Skips emails for opted-out contacts (opt1 for campaigns)
   - Skips emails for opted-out contacts (opt2 for newsletters)
   - Handles email send failures and retries
   - Marks as failed on SMTP transport failures
   - Prevents concurrent processing

2. **`triggerProcessing()`**
   - Triggers processing when not already processing

3. **`getQueueStats()`**
   - Returns comprehensive queue statistics
   - Handles empty queue scenarios

#### Test Scenarios

- ✅ Queue processing
- ✅ Concurrent processing prevention
- ✅ Opt-out handling for campaigns
- ✅ Opt-out handling for newsletters
- ✅ Retry logic
- ✅ SMTP failure handling
- ✅ Queue statistics retrieval

### Utils Module Tests

**File**: `app/lib/__tests__/utils.test.ts`

#### Tested Methods

1. **`cn(...inputs)`**
   - Merges class names correctly
   - Handles conditional classes
   - Merges Tailwind classes (removes conflicts)
   - Handles empty inputs
   - Handles undefined and null values
   - Handles array inputs
   - Handles object inputs
   - Handles mixed input types

#### Test Scenarios

- ✅ Basic class name merging
- ✅ Conditional class inclusion
- ✅ Tailwind class conflict resolution
- ✅ Multiple input type handling

### Contact Groups Hook Tests

**File**: `hooks/__tests__/useContactGroups.test.tsx`

#### Tested Hooks

1. **`useContactGroups()`**
   - Fetches and returns contact groups
   - Handles API errors with fallback
   - Handles non-OK responses
   - Provides refetch function
   - Returns groupNames array
   - Manages loading state
   - Manages error state

2. **`useContactGroupNames()`**
   - Returns only group names array

#### Test Scenarios

- ✅ Successful data fetching
- ✅ Error handling with fallback
- ✅ Loading state management
- ✅ Refetch functionality
- ✅ Group names extraction

## Test Best Practices

### 1. Test Structure

Each test file follows this structure:

```typescript
describe('Module Name', () => {
  describe('Method Name', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 2. Test Naming

- Use descriptive test names: `should [expected behavior] when [condition]`
- Group related tests in `describe` blocks
- Use `beforeEach` and `afterEach` for setup/teardown

### 3. Mocking

- Mock external dependencies (database, HTTP requests, etc.)
- Reset mocks in `beforeEach`
- Use type-safe mocks with TypeScript

### 4. Assertions

- Use specific matchers (e.g., `toBe`, `toEqual`, `toContain`)
- Test both success and error cases
- Verify side effects (e.g., function calls, state changes)

### 5. Coverage

- Aim for 80%+ coverage on critical modules
- Test edge cases and error paths
- Don't sacrifice code quality for 100% coverage

### 6. Isolation

- Each test should be independent
- Don't rely on test execution order
- Clean up after each test

## Troubleshooting

### Common Issues

#### 1. Module Resolution Errors

**Problem**: Cannot find module '@/...'

**Solution**: Ensure `jest.config.js` has correct `moduleNameMapper`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

#### 2. TypeScript Errors in Tests

**Problem**: Type errors in test files

**Solution**: Ensure `tsconfig.json` includes test files and has proper paths configuration.

#### 3. Async Test Failures

**Problem**: Tests with async operations fail

**Solution**: Use `await` and `waitFor` appropriately:
```typescript
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
```

#### 4. Mock Not Working

**Problem**: Mocks not being applied

**Solution**: 
- Ensure mocks are defined before imports
- Use `jest.mock()` at the top of the file
- Clear mocks in `beforeEach`

#### 5. Environment Variables Not Loading

**Problem**: Environment variables undefined in tests

**Solution**: 
- Set environment variables in test files
- Use `beforeEach` to set test-specific env vars
- Consider using `.env.test` file

### Getting Help

1. Check Jest documentation: https://jestjs.io/docs/getting-started
2. Review test examples in existing test files
3. Run tests with `--verbose` flag for more details: `npm test -- --verbose`
4. Check test output for specific error messages

## Continuous Integration

Tests should be run automatically in CI/CD pipelines. Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Maintenance

### Adding New Tests

1. Create test file: `[module-name].test.ts` in `__tests__` directory
2. Follow existing test patterns
3. Ensure all methods are covered
4. Update this documentation

### Updating Tests

When updating source code:
1. Update corresponding tests
2. Ensure tests still pass
3. Add tests for new functionality
4. Update documentation

### Review Checklist

Before committing tests:
- [ ] All tests pass
- [ ] Coverage meets targets
- [ ] Tests follow naming conventions
- [ ] Documentation is updated
- [ ] Mocks are properly cleaned up
- [ ] Edge cases are covered

## Summary

This test suite provides comprehensive coverage for all critical methods in the application:

- **Database operations**: Connection management, queries, transactions
- **Authentication**: Token creation, verification, expiration
- **Email services**: Sending, bulk operations, connection testing
- **Queue processing**: Email queue management, opt-out handling
- **Utilities**: Class name utilities
- **React hooks**: Contact groups management

All tests are written with best practices in mind, ensuring reliability, maintainability, and comprehensive coverage of both success and error scenarios.

