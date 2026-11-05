import { BorrowingService } from '../services/borrowing.service.js';
import { successResponse } from '../utils/response.js';

export class BorrowingController {
  static borrow(req, res, next) {
    try {
      const { bookId, memberId, days } = req.body;
      // If memberId is provided and caller is admin/librarian, use it. Otherwise use logged-in user's id.
      const targetUserId = (req.user.role === 'admin' || req.user.role === 'librarian') && memberId 
        ? memberId 
        : req.user.id;

      const borrowing = BorrowingService.borrow({
        userId: targetUserId,
        bookId,
        days: days ? parseInt(days, 10) : undefined
      });

      return successResponse(res, {
        statusCode: 201,
        message: 'Book borrowed successfully',
        data: borrowing
      });
    } catch (err) {
      next(err);
    }
  }

  static returnBook(req, res, next) {
    try {
      const { borrowingId } = req.body;
      const result = BorrowingService.returnBook({
        borrowingId,
        requestedByUserId: req.user.id,
        userRole: req.user.role
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Book returned successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static myBorrowings(req, res, next) {
    try {
      const list = BorrowingService.getMemberBorrowings(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'My borrowing history',
        data: list
      });
    } catch (err) {
      next(err);
    }
  }

  static listAll(req, res, next) {
    try {
      const { status, userId } = req.query;
      const list = BorrowingService.listAll({ status, userId });
      return successResponse(res, {
        statusCode: 200,
        message: 'All borrowings retrieved successfully',
        data: list
      });
    } catch (err) {
      next(err);
    }
  }
}
