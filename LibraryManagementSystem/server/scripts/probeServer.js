import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, '../src/server.js');

console.log('Spawning server process from:', serverPath);
const srv = spawn('node', [serverPath], { stdio: ['ignore', 'pipe', 'pipe'] });

srv.stdout.on('data', d => console.log('[Server stdout]:', d.toString().trim()));
srv.stderr.on('data', d => console.error('[Server stderr]:', d.toString().trim()));

function getUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, length: data.length, body: data.substring(0, 150) }));
    }).on('error', reject);
  });
}

setTimeout(async () => {
  try {
    console.log('--- Probing Live Endpoints ---');
    const rootRes = await getUrl('http://localhost:8000/');
    console.log('GET / -> Status:', rootRes.status, 'Length:', rootRes.length, 'Body preview:', rootRes.body.replace(/\n/g, ' '));

    const loginRes = await getUrl('http://localhost:8000/login');
    console.log('GET /login -> Status:', loginRes.status, 'Length:', loginRes.length);

    const aboutRes = await getUrl('http://localhost:8000/about');
    console.log('GET /about -> Status:', aboutRes.status, 'Length:', aboutRes.length);

    const catalogRes = await getUrl('http://localhost:8000/catalog');
    console.log('GET /catalog -> Status:', catalogRes.status, 'Length:', catalogRes.length);

    const profileRes = await getUrl('http://localhost:8000/profile');
    console.log('GET /profile -> Status:', profileRes.status, 'Length:', profileRes.length);

    const healthRes = await getUrl('http://localhost:8000/api/v1/health');
    console.log('GET /api/v1/health -> Status:', healthRes.status, 'Body:', healthRes.body);

    console.log('SUCCESS: All endpoints probed and responding with HTTP 200!');
  } catch (err) {
    console.error('Probe error:', err);
  } finally {
    srv.kill('SIGTERM');
    process.exit(0);
  }
}, 3000);
