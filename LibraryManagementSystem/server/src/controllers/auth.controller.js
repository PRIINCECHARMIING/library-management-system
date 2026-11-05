import { AuthService } from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, role, phone } = req.body;
      const result = await AuthService.register({ name, email, password, role, phone });
      return successResponse(res, {
        statusCode: 201,
        message: 'User registered successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      return successResponse(res, {
        statusCode: 200,
        message: 'Authentication successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Current user profile fetched successfully',
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user.id, oldPassword, newPassword);
      return successResponse(res, {
        statusCode: 200,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}
