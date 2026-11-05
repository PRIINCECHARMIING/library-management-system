import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/data/db.js';
import { signToken } from '../src/utils/jwt.js';

export const MASTER_API_KEY = 'lms_master_key_live_9948271635882';
export const PARTNER_API_KEY = 'lms_partner_key_pub_8473920194857';
export const REVOKED_API_KEY = 'lms_revoked_key_old_1122334455667';

export function resetDatabase() {
  db.reset();
}

export function getAuthToken(role = 'member') {
  if (role === 'admin') {
    return signToken({
      id: 'user-admin-1',
      email: 'admin@library.com',
      role: 'admin',
      name: 'System Administrator'
    });
  }
  if (role === 'librarian') {
    return signToken({
      id: 'user-librarian-1',
      email: 'librarian@library.com',
      role: 'librarian',
      name: 'Sarah Connor'
    });
  }
  return signToken({
    id: 'user-member-1',
    email: 'john.doe@example.com',
    role: 'member',
    name: 'John Doe'
  });
}

export { request, app, db };
