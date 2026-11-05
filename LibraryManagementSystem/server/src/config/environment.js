import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8000', 10),
  HTTPS_PORT: parseInt(process.env.HTTPS_PORT || '8443', 10),
  HTTPS_ENABLED: process.env.HTTPS_ENABLED === 'true',
  
  JWT_SECRET: process.env.JWT_SECRET || 'lms-secure-jwt-secret-key-32372327-2026-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  MASTER_API_KEY: process.env.MASTER_API_KEY || 'lms_master_key_live_9948271635882',
  ENFORCE_API_KEY: process.env.ENFORCE_API_KEY !== 'false', // default true
  
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || path.join(rootDir, 'certs', 'server.key'),
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || path.join(rootDir, 'certs', 'server.crt'),
  
  DATA_FILE_PATH: process.env.DATA_FILE_PATH || path.join(rootDir, 'src', 'data', 'library_store.json'),
  
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 mins
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
};
