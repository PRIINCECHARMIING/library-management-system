import { db } from '../data/db.js';
import { BORROW_STATUS, LIBRARY_RULES } from '../config/constants.js';

export class BorrowingService {
  static borrow({ userId, bookId, days = LIBRARY_RULES.DEFAULT_LOAN_DAYS }) {
    // 1. Verify user exists and is active
    const user = db.findById('users', userId);
    if (!user || user.status !== 'active') {
      const err = new Error('Member account is invalid or inactive.');
      err.statusCode = 400;
      err.code = 'INVALID_MEMBER';
      throw err;
    }

    // 2. Check active loans limit
    const activeLoans = db.find('borrowings', b => b.userId === userId && b.status === BORROW_STATUS.ACTIVE);
    if (activeLoans.length >= LIBRARY_RULES.MAX_ACTIVE_LOANS_PER_MEMBER) {
      const err = new Error(`Maximum borrowing limit reached (${LIBRARY_RULES.MAX_ACTIVE_LOANS_PER_MEMBER} active books).`);
      err.statusCode = 400;
      err.code = 'LOAN_LIMIT_EXCEEDED';
      throw err;
    }

    // 3. Verify book exists and has available copies
    const book = db.findById('books', bookId);
    if (!book) {
      const err = new Error('Book not found.');
      err.statusCode = 404;
      err.code = 'BOOK_NOT_FOUND';
      throw err;
    }

    if (book.availableCopies <= 0) {
      const err = new Error('All copies of this book are currently on loan.');
      err.statusCode = 409;
      err.code = 'BOOK_NOT_AVAILABLE';
      throw err;
    }

    // 4. Calculate dates
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    // 5. Atomic decrement available copies
    db.update('books', bookId, {
      availableCopies: book.availableCopies - 1
    });

    // 6. Record borrowing
    const borrowing = db.insert('borrowings', {
      userId,
      userName: user.name,
      userEmail: user.email,
      bookId,
      bookTitle: book.title,
      borrowDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      returnDate: null,
      status: BORROW_STATUS.ACTIVE,
      fineAmount: 0
    });

    return borrowing;
  }

  static returnBook({ borrowingId, requestedByUserId, userRole }) {
    const borrowing = db.findById('borrowings', borrowingId);
    if (!borrowing) {
      const err = new Error(`Borrowing record '${borrowingId}' not found.`);
      err.statusCode = 404;
      err.code = 'BORROWING_NOT_FOUND';
      throw err;
    }

    if (borrowing.status === BORROW_STATUS.RETURNED) {
      const err = new Error('This book has already been marked as returned.');
      err.statusCode = 400;
      err.code = 'ALREADY_RETURNED';
      throw err;
    }

    // Members can only return their own borrowed books unless staff (librarian/admin)
    if (userRole === 'member' && borrowing.userId !== requestedByUserId) {
      const err = new Error('Forbidden: you can only return books you personally borrowed.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_NOT_OWNER';
      throw err;
    }

    const returnDate = new Date();
    const dueDate = new Date(borrowing.dueDate);
    let fineAmount = 0;

    // Check overdue and calculate fine
    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate - dueDate);
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = parseFloat((overdueDays * LIBRARY_RULES.DAILY_FINE_RATE).toFixed(2));
    }

    // Increment available copies for book
    const book = db.findById('books', borrowing.bookId);
    if (book) {
      db.update('books', book.id, {
        availableCopies: Math.min(book.totalCopies, book.availableCopies + 1)
      });
    }

    const updated = db.update('borrowings', borrowingId, {
      status: BORROW_STATUS.RETURNED,
      returnDate: returnDate.toISOString(),
      fineAmount
    });

    return updated;
  }

  static getMemberBorrowings(userId) {
    return db.find('borrowings', b => b.userId === userId);
  }

  static listAll({ status, userId }) {
    let list = db.find('borrowings');
    if (status) {
      list = list.filter(b => b.status === status);
    }
    if (userId) {
      list = list.filter(b => b.userId === userId);
    }
    return list;
  }
}
