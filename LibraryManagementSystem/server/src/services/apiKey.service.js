import crypto from 'crypto';
import { db } from '../data/db.js';
import { API_KEY_STATUS } from '../config/constants.js';

export class ApiKeyService {
  static createKey({ clientName, tier = 'standard', createdBy = 'admin' }) {
    const rawBytes = crypto.randomBytes(24).toString('hex');
    const key = `lms_live_${tier}_${rawBytes}`;

    const newKey = db.insert('apiKeys', {
      key,
      clientName,
      tier,
      status: API_KEY_STATUS.ACTIVE,
      createdBy,
      createdAt: new Date().toISOString()
    });

    return newKey;
  }

  static listKeys() {
    // Mask key characters for security when listing (show prefix and last 4 chars)
    const keys = db.find('apiKeys');
    return keys.map(k => ({
      id: k.id,
      clientName: k.clientName,
      tier: k.tier,
      status: k.status,
      maskedKey: `${k.key.substring(0, 12)}...${k.key.slice(-4)}`,
      createdBy: k.createdBy,
      createdAt: k.createdAt
    }));
  }

  static revokeKey(id) {
    const key = db.findById('apiKeys', id);
    if (!key) {
      const err = new Error(`API key '${id}' not found.`);
      err.statusCode = 404;
      err.code = 'API_KEY_NOT_FOUND';
      throw err;
    }

    if (key.status === API_KEY_STATUS.REVOKED) {
      const err = new Error('API key has already been revoked.');
      err.statusCode = 400;
      err.code = 'ALREADY_REVOKED';
      throw err;
    }

    return db.update('apiKeys', id, {
      status: API_KEY_STATUS.REVOKED,
      revokedAt: new Date().toISOString()
    });
  }
}
