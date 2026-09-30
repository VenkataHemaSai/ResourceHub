import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
} from '../src/utils/auth.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config.js';

describe('Auth Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash and verify a password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword('wrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    const payload = { userId: '123', organizationId: '456', role: 'MEMBER' };

    it('should generate and verify a token', () => {
      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.organizationId).toBe(payload.organizationId);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw when verifying a tampered token', () => {
      const token = generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      
      expect(() => verifyToken(tamperedToken)).toThrow();
    });

    it('should throw when verifying an expired token', () => {
      // Manually create an expired token
      const expiredToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '-1s' });
      expect(() => verifyToken(expiredToken)).toThrow(/expired/i);
    });
  });
});
