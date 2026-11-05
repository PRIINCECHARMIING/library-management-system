import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, resetDatabase, MASTER_API_KEY, PARTNER_API_KEY, REVOKED_API_KEY, getAuthToken } from './helpers.js';

describe('API Key Validation Middleware & Management', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('API Key Enforcement on /api/v1 routes', () => {
    it('should reject requests missing the x-api-key header with 401', async () => {
      const res = await request(app).get('/api/v1/books');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('API_KEY_MISSING');
      expect(res.body.error.message).toContain('API key is required');
    });

    it('should reject requests with an invalid x-api-key header with 401', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .set('x-api-key', 'invalid_bogus_api_key_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('API_KEY_INVALID');
    });

    it('should reject requests with a revoked x-api-key header with 403', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .set('x-api-key', REVOKED_API_KEY);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('API_KEY_REVOKED');
      expect(res.body.error.message).toContain('revoked');
    });

    it('should allow requests with a valid partner x-api-key header', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .set('x-api-key', PARTNER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow requests with the master x-api-key header', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow public access to /api/v1/health without any API key', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
    });
  });

  describe('Admin API Key Management Endpoints', () => {
    it('should allow admin to generate a new API key', async () => {
      const adminToken = getAuthToken('admin');

      const res = await request(app)
        .post('/api/v1/keys')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'Third Party Integration Service',
          tier: 'premium'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.key).toMatch(/^lms_live_premium_/);
      expect(res.body.data.clientName).toBe('Third Party Integration Service');
      expect(res.body.data.status).toBe('active');
    });

    it('should allow admin to list API keys with masked values', async () => {
      const adminToken = getAuthToken('admin');

      const res = await request(app)
        .get('/api/v1/keys')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('maskedKey');
      expect(res.body.data[0].maskedKey).toContain('...');
    });

    it('should allow admin to revoke an active API key', async () => {
      const adminToken = getAuthToken('admin');

      const res = await request(app)
        .delete('/api/v1/keys/key-2')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('revoked');

      // Now verify that the key-2 key is rejected
      const attemptRes = await request(app)
        .get('/api/v1/books')
        .set('x-api-key', PARTNER_API_KEY);

      expect(attemptRes.status).toBe(403);
      expect(attemptRes.body.error.code).toBe('API_KEY_REVOKED');
    });
  });
});
