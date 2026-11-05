import { db } from '../data/db.js';

export class BookService {
  static list({ search, categoryId, author, availableOnly, page = 1, limit = 10 }) {
    let books = db.find('books');

    if (search) {
      const q = search.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q)
      );
    }

    if (categoryId) {
      books = books.filter(b => b.categoryId === categoryId);
    }

    if (author) {
      const a = author.toLowerCase();
      books = books.filter(b => b.author.toLowerCase().includes(a));
    }

    if (availableOnly) {
      books = books.filter(b => b.availableCopies > 0);
    }

    const total = books.length;
    const startIndex = (page - 1) * limit;
    const paginated = books.slice(startIndex, startIndex + limit);

    return {
      books: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  static getById(id) {
    const book = db.findById('books', id);
    if (!book) {
      const err = new Error(`Book with id '${id}' not found.`);
      err.statusCode = 404;
      err.code = 'BOOK_NOT_FOUND';
      throw err;
    }
    return book;
  }

  static create(bookData) {
    // Check if category exists
    const category = db.findById('categories', bookData.categoryId);
    const categoryName = category ? category.name : 'Uncategorized';

    // Check duplicate ISBN
    const existing = db.findOne('books', b => b.isbn === bookData.isbn);
    if (existing) {
      const err = new Error(`A book with ISBN '${bookData.isbn}' already exists.`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_ISBN';
      throw err;
    }

    const totalCopies = bookData.totalCopies || 1;
    return db.insert('books', {
      ...bookData,
      categoryName,
      totalCopies,
      availableCopies: totalCopies
    });
  }

  static update(id, updates) {
    const book = db.findById('books', id);
    if (!book) {
      const err = new Error(`Book with id '${id}' not found.`);
      err.statusCode = 404;
      err.code = 'BOOK_NOT_FOUND';
      throw err;
    }

    if (updates.isbn && updates.isbn !== book.isbn) {
      const existing = db.findOne('books', b => b.isbn === updates.isbn && b.id !== id);
      if (existing) {
        const err = new Error(`Another book with ISBN '${updates.isbn}' already exists.`);
        err.statusCode = 409;
        err.code = 'DUPLICATE_ISBN';
        throw err;
      }
    }

    if (updates.categoryId && updates.categoryId !== book.categoryId) {
      const category = db.findById('categories', updates.categoryId);
      if (category) {
        updates.categoryName = category.name;
      }
    }

    // Handle copy adjustment
    if (typeof updates.totalCopies === 'number') {
      const borrowedCount = book.totalCopies - book.availableCopies;
      if (updates.totalCopies < borrowedCount) {
        const err = new Error(`Cannot decrease total copies below currently borrowed count (${borrowedCount}).`);
        err.statusCode = 400;
        err.code = 'INVALID_TOTAL_COPIES';
        throw err;
      }
      updates.availableCopies = updates.totalCopies - borrowedCount;
    }

    return db.update('books', id, updates);
  }

  static delete(id) {
    const book = db.findById('books', id);
    if (!book) {
      const err = new Error(`Book with id '${id}' not found.`);
      err.statusCode = 404;
      err.code = 'BOOK_NOT_FOUND';
      throw err;
    }

    // Check if book has active borrowings
    const activeBorrowing = db.findOne('borrowings', b => b.bookId === id && b.status === 'active');
    if (activeBorrowing) {
      const err = new Error('Cannot delete a book that currently has active borrowed copies.');
      err.statusCode = 400;
      err.code = 'BOOK_HAS_ACTIVE_LOANS';
      throw err;
    }

    db.delete('books', id);
    return { message: 'Book deleted successfully.' };
  }

  static getStats() {
    const books = db.find('books');
    const totalTitles = books.length;
    const totalInventoryCopies = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
    const availableCopies = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
    const borrowedCopies = totalInventoryCopies - availableCopies;

    return {
      totalTitles,
      totalInventoryCopies,
      availableCopies,
      borrowedCopies
    };
  }
}
