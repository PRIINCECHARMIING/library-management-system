import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/environment.js';
import { securityHeaders, standardRateLimiter } from './middleware/security.js';
import { validateApiKey } from './middleware/apiKeyAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { errorResponse } from './utils/response.js';

// Import route modules
import authRoutes from './routes/auth.routes.js';
import bookRoutes from './routes/book.routes.js';
import categoryRoutes from './routes/category.routes.js';
import borrowingRoutes from './routes/borrowing.routes.js';
import userRoutes from './routes/user.routes.js';
import apiKeyRoutes from './routes/apiKey.routes.js';
import healthRoutes from './routes/health.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const portalViewPath = path.join(__dirname, 'views', 'index.html');

const app = express();

// Security HTTP headers
app.use(securityHeaders);

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Full Library Management System Web Portal (Serves interactive web app with no-cache headers)
app.get(['/', '/login', '/catalog', '/loans', '/about', '/profile', '/staff', '/security'], (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(portalViewPath);
});

// Apply rate limiting strictly to API endpoints in production / dev (disabled in test for fast suite runs)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', standardRateLimiter);
}

// Health check endpoint (Publicly accessible without API key)
app.use('/api/v1/health', healthRoutes);

// Apply API Key validation for all protected /api/v1 routes
// (Clients must supply x-api-key header)
app.use('/api/v1', validateApiKey({ required: true }));

// API v1 feature routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/borrowings', borrowingRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/keys', apiKeyRoutes);

// SPA fallback for any non-API GET request
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(portalViewPath);
  }
  next();
});

// 404 Route Handler
app.use((req, res) => {
  return errorResponse(res, {
    statusCode: 404,
    code: 'ROUTE_NOT_FOUND',
    message: `Resource '${req.method} ${req.originalUrl}' does not exist on this server.`
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
