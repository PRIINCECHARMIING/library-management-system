import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, resetDatabase, MASTER_API_KEY, getAuthToken } from './helpers.js';

describe('Categories REST API Endpoints', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('GET /api/v1/categories', () => {
    it('should return list of book categories', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should retrieve a category by ID', async () => {
      const res = await request(app)
        .get('/api/v1/categories/cat-1')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Computer Science');
    });

    it('should return 404 for non-existent category ID', async () => {
      const res = await request(app)
        .get('/api/v1/categories/cat-9999')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should allow librarian to create a new category', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .post('/api/v1/categories')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          name: 'Artificial Intelligence',
          description: 'Machine Learning, Deep Learning, and Neural Networks'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Artificial Intelligence');
    });

    it('should reject duplicate category name with 409 Conflict', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .post('/api/v1/categories')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          name: 'Computer Science', // Pre-existing
          description: 'Duplicate category test'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_CATEGORY');
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    it('should allow librarian to update an existing category', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .put('/api/v1/categories/cat-1')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          description: 'Updated modern description for Computer Science'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toContain('Updated modern description');
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should prevent deleting a category that currently has assigned books', async () => {
      const adminToken = getAuthToken('admin');

      const res = await request(app)
        .delete('/api/v1/categories/cat-1') // cat-1 has book-1, book-2, book-3
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CATEGORY_IN_USE');
    });

    it('should allow admin to delete an empty category', async () => {
      const adminToken = getAuthToken('admin');

      // 1. Create empty category
      const createRes = await request(app)
        .post('/api/v1/categories')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Temporary Category' });

      const catId = createRes.body.data.id;

      // 2. Delete empty category
      const delRes = await request(app)
        .delete(`/api/v1/categories/${catId}`)
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });
  });
});
