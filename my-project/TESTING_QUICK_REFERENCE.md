# Testing Quick Reference Guide

A quick reference for running and understanding the unit tests in this project.

## Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npm test -- db.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should create"
```

## Test Files Overview

| Module | Test File | Methods Tested |
|--------|-----------|----------------|
| **Database** | `app/lib/__tests__/db.test.ts` | `createConnection()`, `executeQuery()`, `executeTransaction()` |
| **Authentication** | `app/lib/__tests__/auth.test.ts` | `createToken()`, `verifyToken()`, `getTokenFromRequest()`, `isTokenExpired()` |
| **Email Service** | `app/lib/__tests__/email.test.ts` | `sendEmail()`, `sendBulkEmails()`, `testConnection()`, `sendTestEmail()`, `getConfiguration()`, `isReady()`, `getInitializationError()`, `getStatus()` |
| **Email Queue** | `app/lib/__tests__/emailQueue.test.ts` | `processQueue()`, `triggerProcessing()`, `getQueueStats()` |
| **Utils** | `app/lib/__tests__/utils.test.ts` | `cn()` |
| **Contact Groups** | `hooks/__tests__/useContactGroups.test.tsx` | `useContactGroups()`, `useContactGroupNames()` |

## Test Coverage Summary

### Database Module (`db.ts`)
- ✅ Connection creation with defaults
- ✅ Connection creation with env vars
- ✅ Query execution (SELECT and non-SELECT)
- ✅ Query retry mechanism
- ✅ Transaction success and rollback

### Authentication Module (`auth.ts`)
- ✅ JWT token creation
- ✅ Token verification
- ✅ Token extraction from requests
- ✅ Token expiration checking

### Email Service (`email.ts`)
- ✅ Single email sending
- ✅ Bulk email sending
- ✅ Connection testing
- ✅ Error handling
- ✅ Status checking

### Email Queue (`emailQueue.ts`)
- ✅ Queue processing
- ✅ Opt-out handling (opt1 for campaigns, opt2 for newsletters)
- ✅ Retry logic
- ✅ SMTP failure handling
- ✅ Queue statistics

### Utils (`utils.ts`)
- ✅ Class name merging
- ✅ Conditional classes
- ✅ Tailwind class conflict resolution

### Contact Groups Hook (`useContactGroups.ts`)
- ✅ Data fetching
- ✅ Error handling with fallback
- ✅ Loading states
- ✅ Refetch functionality

## Common Test Patterns

### Testing Async Functions

```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```

### Testing React Hooks

```typescript
const { result } = renderHook(() => useContactGroups());
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
```

### Mocking External Dependencies

```typescript
jest.mock('module-name');
const mockFunction = jest.fn();
```

### Testing Error Cases

```typescript
it('should handle errors', async () => {
  mockFunction.mockRejectedValue(new Error('Test error'));
  await expect(functionUnderTest()).rejects.toThrow('Test error');
});
```

## Test Structure Template

```typescript
describe('ModuleName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('MethodName', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = 'value';
      
      // Act
      const result = methodUnderTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

Check coverage with: `npm run test:coverage`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found | Check `jest.config.js` moduleNameMapper |
| Type errors | Verify `tsconfig.json` includes test files |
| Async test fails | Use `await` and `waitFor` |
| Mock not working | Ensure mocks are before imports |

## Next Steps

1. **Run tests**: `npm test`
2. **Check coverage**: `npm run test:coverage`
3. **Read full docs**: See `TESTING_DOCUMENTATION.md`
4. **Add new tests**: Follow existing patterns in test files

## Key Files

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global test setup
- `TESTING_DOCUMENTATION.md` - Comprehensive documentation
- `package.json` - Test scripts and dependencies

