import { describe, it, expect } from 'vitest';
import { request, app, MASTER_API_KEY, getAuthToken } from './helpers.js';
import { getTlsOptions, getOrCreateCertificates } from '../src/utils/tls.js';

describe('Security Headers, Password Protection & HTTPS/TLS Configuration', () => {
  describe('HTTPS / TLS Security Configuration', () => {
    it('should generate or load valid X.509 certificates and RSA private key', () => {
      const certs = getOrCreateCertificates();
      expect(certs).toBeDefined();
      expect(certs.key).toBeDefined();
      expect(certs.cert).toBeDefined();
      expect(certs.key.toString('utf8')).toContain('BEGIN RSA PRIVATE KEY');
      expect(certs.cert.toString('utf8')).toContain('BEGIN CERTIFICATE');
    });

    it('should configure TLS with minimum version 1.2 and modern cipher suites', () => {
      const tlsOptions = getTlsOptions();
      expect(tlsOptions.minVersion).toBe('TLSv1.2');
      expect(tlsOptions.honorCipherOrder).toBe(true);
      expect(tlsOptions.ciphers).toContain('ECDHE-RSA-AES128-GCM-SHA256');
      expect(tlsOptions.ciphers).toContain('ECDHE-RSA-AES256-GCM-SHA384');
    });
  });

  describe('HTTP Security Headers (Helmet)', () => {
    it('should include X-Content-Type-Options: nosniff header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include Content-Security-Policy header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['content-security-policy']).toBeDefined();
    });

    it('should include Strict-Transport-Security (HSTS) header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
    });
  });

  describe('Data Protection & Sanitization', () => {
    it('should never expose passwordHash when fetching users or profiles', async () => {
      const adminToken = getAuthToken('admin');

      const res = await request(app)
        .get('/api/v1/users')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(user => {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should mask API keys in list endpoints to prevent secret leakage', async () => {
      const adminToken = getAuthToken('admin');

      const res = await request(app)
        .get('/api/v1/keys')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(keyItem => {
        expect(keyItem).not.toHaveProperty('key'); // raw key stripped
        expect(keyItem).toHaveProperty('maskedKey');
        expect(keyItem.maskedKey).toContain('...');
      });
    });
  });
});
