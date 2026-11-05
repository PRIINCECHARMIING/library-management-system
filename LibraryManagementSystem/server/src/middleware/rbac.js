import { errorResponse } from '../utils/response.js';

/**
 * Middleware for Role-Based Access Control (RBAC).
 * Restricts access to authenticated users having one of the specified roles.
 * @param  {...string} allowedRoles 
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required before checking role permissions.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, {
        statusCode: 403,
        code: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
        message: `Forbidden: role '${req.user.role}' lacks permission. Required roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}
