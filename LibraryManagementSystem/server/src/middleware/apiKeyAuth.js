import { db } from '../data/db.js';
import { env } from '../config/environment.js';
import { API_KEY_STATUS } from '../config/constants.js';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware to enforce and validate API key from request headers or query params.
 * Header: `x-api-key`
 */
export function validateApiKey(options = { required: true }) {
  return (req, res, next) => {
    // Check if API key enforcement is globally disabled
    if (!env.ENFORCE_API_KEY && !options.required) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      if (!options.required) {
        return next();
      }
      return errorResponse(res, {
        statusCode: 401,
        code: 'API_KEY_MISSING',
        message: 'API key is required. Please provide a valid key in the x-api-key header.'
      });
    }

    // Check master key
    if (apiKey === env.MASTER_API_KEY) {
      req.apiKey = {
        key: apiKey,
        clientName: 'Master Admin Client',
        tier: 'admin',
        status: API_KEY_STATUS.ACTIVE
      };
      return next();
    }

    // Lookup in database
    const keyDoc = db.findOne('apiKeys', k => k.key === apiKey);

    if (!keyDoc) {
      return errorResponse(res, {
        statusCode: 401,
        code: 'API_KEY_INVALID',
        message: 'Invalid API key provided.'
      });
    }

    if (keyDoc.status === API_KEY_STATUS.REVOKED) {
      return errorResponse(res, {
        statusCode: 403,
        code: 'API_KEY_REVOKED',
        message: 'This API key has been revoked and can no longer be used.'
      });
    }

    req.apiKey = keyDoc;
    next();
  };
}
