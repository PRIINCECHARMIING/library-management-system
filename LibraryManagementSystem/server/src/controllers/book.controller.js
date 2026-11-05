import { BookService } from '../services/book.service.js';
import { successResponse } from '../utils/response.js';

export class BookController {
  static list(req, res, next) {
    try {
      const result = BookService.list(req.query);
      return successResponse(res, {
        statusCode: 200,
        message: 'Books retrieved successfully',
        data: result.books,
        meta: result.meta
      });
    } catch (err) {
      next(err);
    }
  }

  static getById(req, res, next) {
    try {
      const book = BookService.getById(req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Book details retrieved successfully',
        data: book
      });
    } catch (err) {
      next(err);
    }
  }

  static create(req, res, next) {
    try {
      const book = BookService.create(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Book created successfully',
        data: book
      });
    } catch (err) {
      next(err);
    }
  }

  static update(req, res, next) {
    try {
      const book = BookService.update(req.params.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Book updated successfully',
        data: book
      });
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const result = BookService.delete(req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }

  static stats(req, res, next) {
    try {
      const stats = BookService.getStats();
      return successResponse(res, {
        statusCode: 200,
        message: 'Book inventory statistics',
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
}
