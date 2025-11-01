/**
 * Unit Tests for Authentication Module (auth.ts)
 * 
 * This file contains comprehensive unit tests for all authentication-related methods:
 * - createToken()
 * - verifyToken()
 * - getTokenFromRequest()
 * - isTokenExpired()
 */

import { createToken, verifyToken, getTokenFromRequest, isTokenExpired, AuthPayload } from '../auth';

// Mock jose - use jest.fn() to create mock functions
const mockSignJWT = jest.fn().mockImplementation(() => ({
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuedAt: jest.fn().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
  sign: jest.fn().mockResolvedValue('mock-jwt-token'),
}));

const mockJwtVerify = jest.fn();

jest.mock('jose', () => ({
  SignJWT: mockSignJWT,
  jwtVerify: mockJwtVerify,
}));

import { SignJWT, jwtVerify } from 'jose';

describe('Authentication Module', () => {
  const mockPayload: AuthPayload = {
    userId: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create a JWT token with correct payload', async () => {
      const token = await createToken(mockPayload);

      expect(mockSignJWT).toHaveBeenCalledWith(mockPayload as Record<string, unknown>);
      const signJWTInstance = mockSignJWT.mock.results[0].value;
      expect(signJWTInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
      expect(signJWTInstance.setIssuedAt).toHaveBeenCalled();
      expect(signJWTInstance.setExpirationTime).toHaveBeenCalledWith('24h');
      expect(signJWTInstance.sign).toHaveBeenCalled();
      expect(token).toBe('mock-jwt-token');
    });

    it('should create token with different payloads', async () => {
      const adminPayload: AuthPayload = {
        userId: 2,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      };

      await createToken(adminPayload);

      expect(mockSignJWT).toHaveBeenCalledWith(adminPayload as Record<string, unknown>);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token and return payload', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: mockPayload,
      });

      const result = await verifyToken('valid-token');

      expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', expect.any(Uint8Array));
      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token structure', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: {
          userId: 'not-a-number', // Invalid type
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        },
      });

      const result = await verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null when token is missing required fields', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: {
          userId: 1,
          email: 'test@example.com',
          // Missing firstName, lastName, role
        },
      });

      const result = await verifyToken('incomplete-token');

      expect(result).toBeNull();
    });

    it('should return null when verification throws error', async () => {
      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

      const result = await verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should handle non-Error exceptions', async () => {
      mockJwtVerify.mockRejectedValue('String error');

      const result = await verifyToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('getTokenFromRequest', () => {
    it('should extract token from Bearer authorization header', () => {
      const request = new Request('http://example.com', {
        headers: {
          Authorization: 'Bearer my-token-123',
        },
      });

      const token = getTokenFromRequest(request);

      expect(token).toBe('my-token-123');
    });

    it('should return null when authorization header is missing', () => {
      const request = new Request('http://example.com');

      const token = getTokenFromRequest(request);

      expect(token).toBeNull();
    });

    it('should return null when authorization header does not start with Bearer', () => {
      const request = new Request('http://example.com', {
        headers: {
          Authorization: 'Basic dXNlcjpwYXNz',
        },
      });

      const token = getTokenFromRequest(request);

      expect(token).toBeNull();
    });

    it('should handle token with spaces', () => {
      const request = new Request('http://example.com', {
        headers: {
          Authorization: 'Bearer token with spaces',
        },
      });

      const token = getTokenFromRequest(request);

      expect(token).toBe('token with spaces');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureExp };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = isTokenExpired(token);

      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastExp };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = isTokenExpired(token);

      expect(result).toBe(true);
    });

    it('should return true for token without exp field', () => {
      const payload = { userId: 1 };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = isTokenExpired(token);

      expect(result).toBe(true);
    });

    it('should return true for invalid token format', () => {
      const result = isTokenExpired('invalid-token-format');

      expect(result).toBe(true);
    });

    it('should return true for token with non-number exp', () => {
      const payload = { exp: 'not-a-number' };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = isTokenExpired(token);

      expect(result).toBe(true);
    });

    it('should return true for malformed base64', () => {
      const result = isTokenExpired('header.invalid-base64!!!.signature');

      expect(result).toBe(true);
    });
  });
});

