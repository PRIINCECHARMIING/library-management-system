import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, resetDatabase, MASTER_API_KEY, getAuthToken } from './helpers.js';

describe('Role-Based Access Control (RBAC) Authorization', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('Member Role Restrictions', () => {
    it('should forbid member from creating a book (403 Forbidden)', async () => {
      const memberToken = getAuthToken('member');

      const res = await request(app)
        .post('/api/v1/books')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Unauthorized Book Creation',
          author: 'Member Hacker',
          isbn: '978-3161484100',
          categoryId: 'cat-1',
          publishedYear: 2024,
          totalCopies: 2
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_INSUFFICIENT_PERMISSIONS');
      expect(res.body.error.message).toContain('Forbidden');
    });

    it('should forbid member from accessing user management (403 Forbidden)', async () => {
      const memberToken = getAuthToken('member');

      const res = await request(app)
        .get('/api/v1/users')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_INSUFFICIENT_PERMISSIONS');
    });

    it('should forbid member from managing API keys (403 Forbidden)', async () => {
      const memberToken = getAuthToken('member');

      const res = await request(app)
        .get('/api/v1/keys')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Librarian Role Permissions & Limits', () => {
    it('should allow librarian to create a book (201 Created)', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .post('/api/v1/books')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Mastering System Design',
          author: 'Tech Architect',
          isbn: '978-0134494166',
          categoryId: 'cat-1',
          publishedYear: 2023,
          totalCopies: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Mastering System Design');
    });

    it('should allow librarian to view user list', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .get('/api/v1/users')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should forbid librarian from changing a user role (Admin only)', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .patch('/api/v1/users/user-member-1/role')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_INSUFFICIENT_PERMISSIONS');
    });

    it('should forbid librarian from generating API keys (Admin only)', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .post('/api/v1/keys')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ clientName: 'Unauthorized Key Attempt' });

      expect(res.status).toBe(403);
    });
  });

  describe('Admin Role Full Authority', () => {
    it('should allow admin to change a member role to librarian', async () => {
      const adminToken = getAuthToken('admin');

      const res = await request(app)
        .patch('/api/v1/users/user-member-2/role')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'librarian' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('librarian');
    });

    it('should prevent admin from demoting their own admin account', async () => {
      const adminToken = getAuthToken('admin');

      const res = await request(app)
        .patch('/api/v1/users/user-admin-1/role')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'member' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SELF_DEMOTION_DENIED');
    });
  });
});
