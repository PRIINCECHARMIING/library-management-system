import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { request, app, resetDatabase, MASTER_API_KEY, db } from './helpers.js';
import { signToken } from '../src/utils/jwt.js';

describe('Authentication & JWT & Password Hashing', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('User Registration (POST /api/v1/auth/register)', () => {
    it('should register a new member and return a signed JWT token', async () => {
      const payload = {
        name: 'Alice Wonder',
        email: 'alice@example.com',
        password: 'Password@123',
        phone: '+1-555-4321'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('x-api-key', MASTER_API_KEY)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.role).toBe('member');
      expect(res.body.data.token).toBeDefined();

      // Verify plain text password is NEVER stored in database
      const storedUser = db.findOne('users', u => u.email === 'alice@example.com');
      expect(storedUser).toBeDefined();
      expect(storedUser.passwordHash).not.toBe('Password@123');
      expect(storedUser.passwordHash.startsWith('$2')).toBe(true); // Valid bcrypt hash
      expect(await bcrypt.compare('Password@123', storedUser.passwordHash)).toBe(true);
    });

    it('should reject registration if email is already in use (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('x-api-key', MASTER_API_KEY)
        .send({
          name: 'Duplicate Admin',
          email: 'admin@library.com', // Pre-existing email
          password: 'Password@123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should reject registration with a weak password (no uppercase or digits)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('x-api-key', MASTER_API_KEY)
        .send({
          name: 'Weak Pass',
          email: 'weak@example.com',
          password: 'password' // Missing uppercase and digit
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.some(d => d.field === 'password')).toBe(true);
    });

    it('should reject registration with an invalid email address', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('x-api-key', MASTER_API_KEY)
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'Password@123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.details.some(d => d.field === 'email')).toBe(true);
    });
  });

  describe('User Login (POST /api/v1/auth/login)', () => {
    it('should authenticate valid credentials and return JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-api-key', MASTER_API_KEY)
        .send({
          email: 'admin@library.com',
          password: 'Admin@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Sensitive data omitted
    });

    it('should reject incorrect password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-api-key', MASTER_API_KEY)
        .send({
          email: 'admin@library.com',
          password: 'WrongPassword@999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-api-key', MASTER_API_KEY)
        .send({
          email: 'nobody@nowhere.com',
          password: 'Password@123'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('JWT Verification & Profile Endpoint (GET /api/v1/auth/me)', () => {
    it('should return profile data for valid Bearer token', async () => {
      const token = signToken({
        id: 'user-member-1',
        email: 'john.doe@example.com',
        role: 'member',
        name: 'John Doe'
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('john.doe@example.com');
      expect(res.body.data.role).toBe('member');
    });

    it('should reject request missing Authorization header with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should reject malformed Authorization header with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', 'InvalidTokenFormatWithoutBearer');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_HEADER_MALFORMED');
    });

    it('should reject invalid or tampered JWT token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Password Change (POST /api/v1/auth/change-password)', () => {
    it('should allow user to change password after verifying old password', async () => {
      const token = signToken({
        id: 'user-member-1',
        email: 'john.doe@example.com',
        role: 'member',
        name: 'John Doe'
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: 'Member@123',
          newPassword: 'BrandNewPassword@2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login works with new password and fails with old password
      const oldLogin = await request(app)
        .post('/api/v1/auth/login')
        .set('x-api-key', MASTER_API_KEY)
        .send({ email: 'john.doe@example.com', password: 'Member@123' });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .set('x-api-key', MASTER_API_KEY)
        .send({ email: 'john.doe@example.com', password: 'BrandNewPassword@2026' });
      expect(newLogin.status).toBe(200);
    });
  });
});
