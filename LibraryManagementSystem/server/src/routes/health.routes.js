import { Router } from 'express';
import { db } from '../data/db.js';
import { env } from '../config/environment.js';
import { successResponse } from '../utils/response.js';

const router = Router();

router.get('/', (req, res) => {
  return successResponse(res, {
    statusCode: 200,
    message: 'Library Management System API is healthy and operational',
    data: {
      status: 'UP',
      uptime: `${Math.floor(process.uptime())} seconds`,
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      security: {
        httpsEnabled: env.HTTPS_ENABLED,
        tlsMinVersion: 'TLSv1.2',
        apiKeyValidationEnforced: env.ENFORCE_API_KEY,
        jwtExpiry: env.JWT_EXPIRES_IN,
        passwordHashing: 'bcrypt (10 rounds)',
        rateLimiterActive: true,
        helmetProtectionActive: true
      },
      counts: {
        books: db.count('books'),
        categories: db.count('categories'),
        users: db.count('users'),
        activeLoans: db.count('borrowings', b => b.status === 'active'),
        activeApiKeys: db.count('apiKeys', k => k.status === 'active')
      }
    }
  });
});

export default router;
