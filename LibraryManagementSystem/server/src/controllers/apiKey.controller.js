import { ApiKeyService } from '../services/apiKey.service.js';
import { successResponse } from '../utils/response.js';

export class ApiKeyController {
  static create(req, res, next) {
    try {
      const { clientName, tier } = req.body;
      const keyDoc = ApiKeyService.createKey({
        clientName,
        tier,
        createdBy: req.user ? req.user.email : 'system'
      });

      return successResponse(res, {
        statusCode: 201,
        message: 'API Key generated successfully. Store it safely as full key will not be shown again.',
        data: keyDoc
      });
    } catch (err) {
      next(err);
    }
  }

  static list(req, res, next) {
    try {
      const keys = ApiKeyService.listKeys();
      return successResponse(res, {
        statusCode: 200,
        message: 'API keys retrieved successfully',
        data: keys
      });
    } catch (err) {
      next(err);
    }
  }

  static revoke(req, res, next) {
    try {
      const { id } = req.params;
      const updated = ApiKeyService.revokeKey(id);
      return successResponse(res, {
        statusCode: 200,
        message: `API key '${id}' has been revoked successfully`,
        data: {
          id: updated.id,
          status: updated.status,
          revokedAt: updated.revokedAt
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
