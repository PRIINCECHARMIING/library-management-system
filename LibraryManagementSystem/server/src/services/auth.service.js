import { db } from '../data/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

export class AuthService {
  static async register({ name, email, password, role = 'member', phone = '' }) {
    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err = new Error('A user with this email address already exists.');
      err.statusCode = 409;
      err.code = 'USER_ALREADY_EXISTS';
      throw err;
    }

    const passwordHash = await hashPassword(password);

    const newUser = db.insert('users', {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status: 'active',
      phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  static async login({ email, password }) {
    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (user.status !== 'active') {
      const err = new Error('This account has been suspended. Please contact the administrator.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_SUSPENDED';
      throw err;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static async getProfile(userId) {
    const user = db.findById('users', userId);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  static async changePassword(userId, oldPassword, newPassword) {
    const user = db.findById('users', userId);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Current password is incorrect.');
      err.statusCode = 400;
      err.code = 'INVALID_CURRENT_PASSWORD';
      throw err;
    }

    const newHash = await hashPassword(newPassword);
    db.update('users', userId, { passwordHash: newHash });

    return { message: 'Password updated successfully.' };
  }
}
