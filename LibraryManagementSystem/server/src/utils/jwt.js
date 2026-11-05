import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

/**
 * Generates a signed JWT token for an authenticated user.
 * @param {object} payload - { id, email, role, name }
 * @param {object} [options]
 * @returns {string}
 */
export function signToken(payload, options = {}) {
  const expiresIn = options.expiresIn || env.JWT_EXPIRES_IN;
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name
    },
    env.JWT_SECRET,
    {
      expiresIn,
      issuer: 'library-management-system',
      audience: 'library-api-clients'
    }
  );
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token 
 * @returns {object}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'library-management-system',
      audience: 'library-api-clients'
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const error = new Error('Token has expired');
      error.statusCode = 401;
      error.code = 'TOKEN_EXPIRED';
      throw error;
    }
    const error = new Error('Invalid authentication token');
    error.statusCode = 401;
    error.code = 'INVALID_TOKEN';
    throw error;
  }
}
