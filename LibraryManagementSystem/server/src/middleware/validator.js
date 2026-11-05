import { ZodError } from 'zod';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware factory for validating HTTP requests using Zod schemas.
 * @param {object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
export function validate(schemas = {}) {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          rule: issue.code
        }));

        return errorResponse(res, {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request input. Please check the reported fields.',
          details
        });
      }
      next(err);
    }
  };
}
