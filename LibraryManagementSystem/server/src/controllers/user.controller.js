import { db } from '../data/db.js';
import { successResponse } from '../utils/response.js';

export class UserController {
  static list(req, res, next) {
    try {
      const { role, status, search } = req.query;
      let users = db.find('users');

      if (role) {
        users = users.filter(u => u.role === role);
      }

      if (status) {
        users = users.filter(u => u.status === status);
      }

      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }

      // Strip passwordHash
      const safeUsers = users.map(({ passwordHash, ...safe }) => safe);

      return successResponse(res, {
        statusCode: 200,
        message: 'Users retrieved successfully',
        data: safeUsers
      });
    } catch (err) {
      next(err);
    }
  }

  static getById(req, res, next) {
    try {
      const user = db.findById('users', req.params.id);
      if (!user) {
        const err = new Error(`User with id '${req.params.id}' not found.`);
        err.statusCode = 404;
        err.code = 'USER_NOT_FOUND';
        throw err;
      }

      const { passwordHash, ...safeUser } = user;
      return successResponse(res, {
        statusCode: 200,
        message: 'User retrieved successfully',
        data: safeUser
      });
    } catch (err) {
      next(err);
    }
  }

  static updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'librarian', 'member'].includes(role)) {
        const err = new Error('Invalid role specified.');
        err.statusCode = 400;
        err.code = 'INVALID_ROLE';
        throw err;
      }

      // Prevent demoting yourself if you are an admin
      if (req.user.id === id && role !== 'admin') {
        const err = new Error('Cannot demote your own admin account.');
        err.statusCode = 400;
        err.code = 'SELF_DEMOTION_DENIED';
        throw err;
      }

      const user = db.findById('users', id);
      if (!user) {
        const err = new Error(`User with id '${id}' not found.`);
        err.statusCode = 404;
        err.code = 'USER_NOT_FOUND';
        throw err;
      }

      const updated = db.update('users', id, { role });
      const { passwordHash, ...safeUser } = updated;

      return successResponse(res, {
        statusCode: 200,
        message: `User role updated to '${role}'`,
        data: safeUser
      });
    } catch (err) {
      next(err);
    }
  }

  static toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const user = db.findById('users', id);
      if (!user) {
        const err = new Error(`User with id '${id}' not found.`);
        err.statusCode = 404;
        err.code = 'USER_NOT_FOUND';
        throw err;
      }

      if (req.user.id === id) {
        const err = new Error('Cannot deactivate your own account.');
        err.statusCode = 400;
        err.code = 'SELF_DEACTIVATION_DENIED';
        throw err;
      }

      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      const updated = db.update('users', id, { status: newStatus });
      const { passwordHash, ...safeUser } = updated;

      return successResponse(res, {
        statusCode: 200,
        message: `User status updated to '${newStatus}'`,
        data: safeUser
      });
    } catch (err) {
      next(err);
    }
  }
}
