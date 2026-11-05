import { errorResponse } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle JSON parse error (e.g. malformed JSON in body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, {
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'Malformed JSON payload in request body.'
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected internal server error occurred.';

  // In production, do not leak internal stack traces
  const details = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  return errorResponse(res, {
    statusCode,
    code,
    message,
    details
  });
}
