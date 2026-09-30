import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * Hash a plaintext password
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a plaintext password against a hash
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT for a user session
 * @param {object} payload - { userId, organizationId, role }
 * @returns {string}
 */
export function generateToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

/**
 * Verify a JWT
 * @param {string} token 
 * @returns {object} payload
 * @throws {Error} if invalid
 */
export function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

/**
 * Set the authentication cookie on the response object
 * @param {object} res - Express response object
 * @param {string} token - JWT
 */
export function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: config.JWT_EXPIRES_IN * 1000,
  });
}

/**
 * Clear the authentication cookie on the response object
 * @param {object} res - Express response object
 */
export function clearAuthCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}
