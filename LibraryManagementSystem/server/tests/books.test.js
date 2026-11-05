import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, resetDatabase, MASTER_API_KEY, getAuthToken } from './helpers.js';

describe('Books REST API Endpoints', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('GET /api/v1/books', () => {
    it('should return a paginated list of books with metadata', async () => {
      const res = await request(app)
        .get('/api/v1/books?page=1&limit=3')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.meta).toEqual({
        total: 6,
        page: 1,
        limit: 3,
        totalPages: 2
      });
    });

    it('should filter books by search query across title, author, and isbn', async () => {
      const res = await request(app)
        .get('/api/v1/books?search=Martin')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some(b => b.author.includes('Martin'))).toBe(true);
    });

    it('should filter books by categoryId', async () => {
      const res = await request(app)
        .get('/api/v1/books?categoryId=cat-1')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data.every(b => b.categoryId === 'cat-1')).toBe(true);
    });
  });

  describe('GET /api/v1/books/:id', () => {
    it('should return book details when valid id is supplied', async () => {
      const res = await request(app)
        .get('/api/v1/books/book-1')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('book-1');
      expect(res.body.data.title).toContain('Clean Code');
    });

    it('should return 404 Not Found for non-existent book id', async () => {
      const res = await request(app)
        .get('/api/v1/books/non-existent-id-999')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('BOOK_NOT_FOUND');
    });
  });

  describe('POST /api/v1/books', () => {
    it('should create a new book with correct initial inventory', async () => {
      const librarianToken = getAuthToken('librarian');

      const newBook = {
        title: 'Refactoring: Improving the Design of Existing Code',
        author: 'Martin Fowler',
        isbn: '978-0134757599',
        categoryId: 'cat-1',
        publishedYear: 2018,
        totalCopies: 4,
        location: 'Shelf CS-04',
        description: 'Guide to principles and practical techniques of refactoring.'
      };

      const res = await request(app)
        .post('/api/v1/books')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send(newBook);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(newBook.title);
      expect(res.body.data.totalCopies).toBe(4);
      expect(res.body.data.availableCopies).toBe(4);
      expect(res.body.data.categoryName).toBe('Computer Science');
    });

    it('should reject duplicate ISBN with 409 Conflict', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .post('/api/v1/books')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Duplicate Clean Code Copy',
          author: 'Robert Martin',
          isbn: '978-0132350884', // Same as book-1
          categoryId: 'cat-1',
          publishedYear: 2008,
          totalCopies: 2
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_ISBN');
    });
  });

  describe('PUT /api/v1/books/:id', () => {
    it('should update book information successfully', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .put('/api/v1/books/book-1')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          location: 'Premium Archive Section'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.location).toBe('Premium Archive Section');
    });
  });

  describe('DELETE /api/v1/books/:id', () => {
    it('should delete a book when it has no active loans', async () => {
      const librarianToken = getAuthToken('librarian');

      const res = await request(app)
        .delete('/api/v1/books/book-6')
        .set('x-api-key', MASTER_API_KEY)
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');

      // Verify it's gone
      const verifyRes = await request(app)
        .get('/api/v1/books/book-6')
        .set('x-api-key', MASTER_API_KEY);
      expect(verifyRes.status).toBe(404);
    });
  });

  describe('GET /api/v1/books/stats', () => {
    it('should return correct library inventory metrics', async () => {
      const res = await request(app)
        .get('/api/v1/books/stats')
        .set('x-api-key', MASTER_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalTitles');
      expect(res.body.data).toHaveProperty('totalInventoryCopies');
      expect(res.body.data).toHaveProperty('availableCopies');
    });
  });
});
