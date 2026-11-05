import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, resetDatabase, MASTER_API_KEY, getAuthToken } from './helpers.js';

describe('Input Validation with Zod Schemas', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('should return 400 Bad Request with field errors when book creation lacks required fields', async () => {
    const librarianToken = getAuthToken('librarian');

    const res = await request(app)
      .post('/api/v1/books')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        // title, author, isbn missing
        totalCopies: 5
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);

    const errorFields = res.body.error.details.map(d => d.field);
    expect(errorFields).toContain('title');
    expect(errorFields).toContain('author');
    expect(errorFields).toContain('isbn');
    expect(errorFields).toContain('categoryId');
  });

  it('should reject invalid ISBN formats with 400', async () => {
    const librarianToken = getAuthToken('librarian');

    const res = await request(app)
      .post('/api/v1/books')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        title: 'Valid Title',
        author: 'Valid Author',
        isbn: 'not-an-isbn-code-1234',
        categoryId: 'cat-1',
        publishedYear: 2022,
        totalCopies: 3
      });

    expect(res.status).toBe(400);
    expect(res.body.error.details.some(d => d.field === 'isbn')).toBe(true);
  });

  it('should reject negative total copies or invalid year', async () => {
    const librarianToken = getAuthToken('librarian');

    const res = await request(app)
      .post('/api/v1/books')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        title: 'Valid Title',
        author: 'Valid Author',
        isbn: '978-0132350884',
        categoryId: 'cat-1',
        publishedYear: 800, // < 1000
        totalCopies: -2 // negative
      });

    expect(res.status).toBe(400);
    const errorFields = res.body.error.details.map(d => d.field);
    expect(errorFields).toContain('publishedYear');
    expect(errorFields).toContain('totalCopies');
  });

  it('should return 400 when malformed JSON is provided in request body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('x-api-key', MASTER_API_KEY)
      .set('Content-Type', 'application/json')
      .send('{ "email": "test@test.com", invalid_json }');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});
