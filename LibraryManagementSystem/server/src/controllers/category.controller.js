import { db } from '../data/db.js';
import { successResponse } from '../utils/response.js';

export class CategoryController {
  static list(req, res, next) {
    try {
      const categories = db.find('categories');
      return successResponse(res, {
        statusCode: 200,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (err) {
      next(err);
    }
  }

  static getById(req, res, next) {
    try {
      const category = db.findById('categories', req.params.id);
      if (!category) {
        const err = new Error(`Category '${req.params.id}' not found.`);
        err.statusCode = 404;
        err.code = 'CATEGORY_NOT_FOUND';
        throw err;
      }
      return successResponse(res, {
        statusCode: 200,
        message: 'Category retrieved successfully',
        data: category
      });
    } catch (err) {
      next(err);
    }
  }

  static create(req, res, next) {
    try {
      const { name, description } = req.body;
      if (!name || name.trim().length === 0) {
        const err = new Error('Category name is required.');
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
      }

      const existing = db.findOne('categories', c => c.name.toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        const err = new Error(`Category '${name}' already exists.`);
        err.statusCode = 409;
        err.code = 'DUPLICATE_CATEGORY';
        throw err;
      }

      const newCategory = db.insert('categories', {
        name: name.trim(),
        description: description?.trim() || ''
      });

      return successResponse(res, {
        statusCode: 201,
        message: 'Category created successfully',
        data: newCategory
      });
    } catch (err) {
      next(err);
    }
  }

  static update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const category = db.findById('categories', id);
      if (!category) {
        const err = new Error(`Category '${id}' not found.`);
        err.statusCode = 404;
        err.code = 'CATEGORY_NOT_FOUND';
        throw err;
      }

      if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
        const duplicate = db.findOne('categories', c => c.name.toLowerCase() === name.trim().toLowerCase() && c.id !== id);
        if (duplicate) {
          const err = new Error(`Category name '${name}' is already taken.`);
          err.statusCode = 409;
          err.code = 'DUPLICATE_CATEGORY';
          throw err;
        }
      }

      const updated = db.update('categories', id, {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {})
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Category updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const { id } = req.params;
      const category = db.findById('categories', id);
      if (!category) {
        const err = new Error(`Category '${id}' not found.`);
        err.statusCode = 404;
        err.code = 'CATEGORY_NOT_FOUND';
        throw err;
      }

      // Check if any books belong to this category
      const booksInCat = db.findOne('books', b => b.categoryId === id);
      if (booksInCat) {
        const err = new Error('Cannot delete category that contains books. Please reassign or delete the books first.');
        err.statusCode = 400;
        err.code = 'CATEGORY_IN_USE';
        throw err;
      }

      db.delete('categories', id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Category deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
