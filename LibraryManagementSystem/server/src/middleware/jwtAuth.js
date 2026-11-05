import { verifyToken } from '../utils/jwt.js';
import { db } from '../data/db.js';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware to authenticate requests using JWT Bearer token.
 */
export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return errorResponse(res, {
      statusCode: 401,
      code: 'AUTH_TOKEN_MISSING',
      message: 'Authorization header is missing. Expected Bearer <token>.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return errorResponse(res, {
      statusCode: 401,
      code: 'AUTH_HEADER_MALFORMED',
      message: 'Invalid authorization format. Format should be: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);

    // Verify user exists and is still active in database
    const user = db.findById('users', decoded.sub);
    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        code: 'USER_NOT_FOUND',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (user.status !== 'active') {
      return errorResponse(res, {
        statusCode: 403,
        code: 'ACCOUNT_SUSPENDED',
        message: 'User account has been deactivated.'
      });
    }

    // Attach user profile (without sensitive passwordHash) to req
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 401,
      code: err.code || 'INVALID_TOKEN',
      message: err.message || 'Failed to authenticate token.'
    });
  }
}
