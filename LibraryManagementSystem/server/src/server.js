import http from 'http';
import https from 'https';
import app from './app.js';
import { env } from './config/environment.js';
import { getTlsOptions } from './utils/tls.js';

const HTTP_PORT = env.PORT;
const HTTPS_PORT = env.HTTPS_PORT;

// Create HTTP server
const httpServer = http.createServer(app);

httpServer.listen(HTTP_PORT, () => {
  console.log(`=======================================================`);
  console.log(`[HTTP Server]  Listening on: http://localhost:${HTTP_PORT}`);
  console.log(`[Environment]  ${env.NODE_ENV}`);
  console.log(`[API Docs]     http://localhost:${HTTP_PORT}/`);
  console.log(`[Health Check] http://localhost:${HTTP_PORT}/api/v1/health`);
  console.log(`=======================================================`);
});

// Create HTTPS server with TLS 1.2+ configuration
let httpsServer = null;
try {
  const tlsOptions = getTlsOptions();
  httpsServer = https.createServer(tlsOptions, app);

  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`[HTTPS Server] Secure TLS listening on: https://localhost:${HTTPS_PORT}`);
    console.log(`[TLS Security] Min Version: TLSv1.2 with Modern Cipher Suites`);
    console.log(`=======================================================`);
  });
} catch (err) {
  console.warn(`[HTTPS Warning] Could not start HTTPS listener: ${err.message}`);
}

// Graceful shutdown
const shutdown = () => {
  console.log('\nGracefully shutting down servers...');
  httpServer.close(() => console.log('HTTP server closed.'));
  if (httpsServer) {
    httpsServer.close(() => console.log('HTTPS server closed.'));
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
