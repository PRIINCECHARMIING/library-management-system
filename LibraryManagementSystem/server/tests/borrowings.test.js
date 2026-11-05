import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, resetDatabase, MASTER_API_KEY, getAuthToken, db } from './helpers.js';

describe('Borrowing & Return Workflow & Inventory Control', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('should allow member to borrow an available book and decrement available copies', async () => {
    const memberToken = getAuthToken('member');
    const initialBook = db.findById('books', 'book-1');
    const initialCopies = initialBook.availableCopies;

    const res = await request(app)
      .post('/api/v1/borrowings/borrow')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        bookId: 'book-1',
        days: 14
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.bookTitle).toContain('Clean Code');
    expect(res.body.data.dueDate).toBeDefined();

    // Verify inventory decremented
    const updatedBook = db.findById('books', 'book-1');
    expect(updatedBook.availableCopies).toBe(initialCopies - 1);
  });

  it('should prevent borrowing when available copies is 0 (409 Conflict)', async () => {
    const memberToken = getAuthToken('member');

    // Force book available copies to 0
    db.update('books', 'book-4', { availableCopies: 0 });

    const res = await request(app)
      .post('/api/v1/borrowings/borrow')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        bookId: 'book-4'
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('BOOK_NOT_AVAILABLE');
  });

  it('should allow member to return their borrowed book and restore available copies', async () => {
    const memberToken = getAuthToken('member');

    // 1. Borrow book first
    const borrowRes = await request(app)
      .post('/api/v1/borrowings/borrow')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ bookId: 'book-2' });

    const borrowingId = borrowRes.body.data.id;
    const copiesAfterBorrow = db.findById('books', 'book-2').availableCopies;

    // 2. Return the book
    const returnRes = await request(app)
      .post('/api/v1/borrowings/return')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ borrowingId });

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.success).toBe(true);
    expect(returnRes.body.data.status).toBe('returned');
    expect(returnRes.body.data.returnDate).toBeDefined();

    // Verify inventory restored
    const copiesAfterReturn = db.findById('books', 'book-2').availableCopies;
    expect(copiesAfterReturn).toBe(copiesAfterBorrow + 1);
  });

  it('should reject returning a book that has already been returned', async () => {
    const memberToken = getAuthToken('member');

    const borrowRes = await request(app)
      .post('/api/v1/borrowings/borrow')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ bookId: 'book-2' });

    const borrowingId = borrowRes.body.data.id;

    // First return
    await request(app)
      .post('/api/v1/borrowings/return')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ borrowingId });

    // Second return attempt
    const secondReturnRes = await request(app)
      .post('/api/v1/borrowings/return')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ borrowingId });

    expect(secondReturnRes.status).toBe(400);
    expect(secondReturnRes.body.error.code).toBe('ALREADY_RETURNED');
  });

  it('should prevent member from returning a book borrowed by another user (403 Forbidden)', async () => {
    const member1Token = getAuthToken('member'); // user-member-1
    // Generate token for user-member-2
    const member2Token = request; // We will generate token for Jane Smith
    const { signToken } = await import('../src/utils/jwt.js');
    const janeToken = signToken({
      id: 'user-member-2',
      email: 'jane.smith@example.com',
      role: 'member',
      name: 'Jane Smith'
    });

    // John borrows
    const borrowRes = await request(app)
      .post('/api/v1/borrowings/borrow')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${member1Token}`)
      .send({ bookId: 'book-3' });

    const borrowingId = borrowRes.body.data.id;

    // Jane tries to return John's book
    const unauthorizedReturn = await request(app)
      .post('/api/v1/borrowings/return')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${janeToken}`)
      .send({ borrowingId });

    expect(unauthorizedReturn.status).toBe(403);
    expect(unauthorizedReturn.body.error.code).toBe('FORBIDDEN_NOT_OWNER');
  });

  it('should allow librarian to return books on behalf of any member', async () => {
    const memberToken = getAuthToken('member');
    const librarianToken = getAuthToken('librarian');

    const borrowRes = await request(app)
      .post('/api/v1/borrowings/borrow')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ bookId: 'book-3' });

    const borrowingId = borrowRes.body.data.id;

    // Librarian returns it
    const returnRes = await request(app)
      .post('/api/v1/borrowings/return')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ borrowingId });

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.data.status).toBe('returned');
  });

  it('should retrieve member personal borrowing history', async () => {
    const memberToken = getAuthToken('member');

    await request(app)
      .post('/api/v1/borrowings/borrow')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ bookId: 'book-1' });

    const historyRes = await request(app)
      .get('/api/v1/borrowings/my')
      .set('x-api-key', MASTER_API_KEY)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body.data)).toBe(true);
    expect(historyRes.body.data.length).toBeGreaterThan(0);
  });
});
