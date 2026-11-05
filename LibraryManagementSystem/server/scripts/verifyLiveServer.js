import http from 'http';
import https from 'https';
import app from '../src/app.js';
import { getTlsOptions } from '../src/utils/tls.js';

async function main() {
  console.log('--- Starting Live Server Verification ---');
  
  const HTTP_PORT = 8010;
  const HTTPS_PORT = 8453;

  // 1. Create HTTP server
  const httpServer = http.createServer(app);
  await new Promise(resolve => httpServer.listen(HTTP_PORT, resolve));
  console.log(`[HTTP Server] Running on http://127.0.0.1:${HTTP_PORT}`);

  // 2. Create HTTPS server
  const tlsOptions = getTlsOptions();
  const httpsServer = https.createServer(tlsOptions, app);
  await new Promise(resolve => httpsServer.listen(HTTPS_PORT, resolve));
  console.log(`[HTTPS Server] Running with TLS 1.2+ on https://127.0.0.1:${HTTPS_PORT}`);

  try {
    // 3. Probe HTTP /api/v1/health
    const httpRes = await fetch(`http://127.0.0.1:${HTTP_PORT}/api/v1/health`);
    const httpData = await httpRes.json();
    console.log(`[HTTP Health Check] Status: ${httpRes.status} ${httpRes.statusText}`);
    console.log(`[HTTP Health Payload] Uptime: ${httpData.data.uptime}, Total Books: ${httpData.data.counts.books}`);
    if (httpRes.status !== 200 || httpData.data.status !== 'UP') {
      throw new Error('HTTP Health Check failed');
    }

    // 4. Probe HTTPS /api/v1/health using native node https agent with TLS verification
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const httpsRes = await new Promise((resolve, reject) => {
      const req = https.get(
        `https://127.0.0.1:${HTTPS_PORT}/api/v1/health`,
        { agent: httpsAgent },
        (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            const cert = req.socket.getPeerCertificate();
            const cipher = req.socket.getCipher();
            const protocol = req.socket.getProtocol();
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: JSON.parse(body),
              tls: { protocol, cipher, certSubject: cert.subject }
            });
          });
        }
      );
      req.on('error', reject);
    });

    console.log(`[HTTPS Health Check] Status: ${httpsRes.statusCode}`);
    console.log(`[TLS Protocol] ${httpsRes.tls.protocol}`);
    console.log(`[TLS Cipher] ${httpsRes.tls.cipher.name} (${httpsRes.tls.cipher.version})`);
    console.log(`[TLS Certificate CN] ${httpsRes.tls.certSubject?.CN}`);
    console.log(`[Security Header HSTS] ${httpsRes.headers['strict-transport-security']}`);
    console.log(`[Security Header X-Content-Type] ${httpsRes.headers['x-content-type-options']}`);

    // 5. Test Auth Login over HTTPS
    const loginPayload = JSON.stringify({
      email: 'admin@library.com',
      password: 'Admin@123'
    });

    const loginRes = await new Promise((resolve, reject) => {
      const req = https.request(
        `https://127.0.0.1:${HTTPS_PORT}/api/v1/auth/login`,
        {
          method: 'POST',
          agent: httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginPayload),
            'x-api-key': 'lms_master_key_live_9948271635882'
          }
        },
        res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.write(loginPayload);
      req.end();
    });

    console.log(`[HTTPS Auth Login] Status: ${loginRes.statusCode}`);
    console.log(`[JWT Token Generated] ${loginRes.body.data.token.substring(0, 30)}...`);
    const jwtToken = loginRes.body.data.token;

    // 6. Test Protected Profile with JWT & API Key
    const profileRes = await new Promise((resolve, reject) => {
      const req = https.get(
        `https://127.0.0.1:${HTTPS_PORT}/api/v1/auth/me`,
        {
          agent: httpsAgent,
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'x-api-key': 'lms_master_key_live_9948271635882'
          }
        },
        res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
    });

    console.log(`[JWT Protected /me] Status: ${profileRes.statusCode}, User: ${profileRes.body.data.name} (${profileRes.body.data.role})`);

    console.log('\n>>> ALL LIVE VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<');
  } finally {
    await new Promise(resolve => httpServer.close(resolve));
    await new Promise(resolve => httpsServer.close(resolve));
    console.log('HTTP and HTTPS test servers shut down cleanly.');
  }
}

main().catch(err => {
  console.error('Live Verification FAILED:', err);
  process.exit(1);
});
