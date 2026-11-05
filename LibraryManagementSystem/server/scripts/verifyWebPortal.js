import request from 'supertest';
import app from '../src/app.js';

async function testWebPortal() {
  console.log('Testing Web Portal routes...');

  // 1. Test root route
  const resRoot = await request(app).get('/');
  console.log('GET / status:', resRoot.status, 'Content-Type:', resRoot.headers['content-type']);
  if (resRoot.status !== 200 || !resRoot.text.includes('LibraryOS')) {
    throw new Error('Failed GET /');
  }

  // 2. Test /login route
  const resLogin = await request(app).get('/login');
  console.log('GET /login status:', resLogin.status);
  if (resLogin.status !== 200 || !resLogin.text.includes('Sign In')) {
    throw new Error('Failed GET /login');
  }

  // 3. Test /about route
  const resAbout = await request(app).get('/about');
  console.log('GET /about status:', resAbout.status);
  if (resAbout.status !== 200 || !resAbout.text.includes('Operating Schedule')) {
    throw new Error('Failed GET /about');
  }

  // 4. Test /catalog route
  const resCatalog = await request(app).get('/catalog');
  console.log('GET /catalog status:', resCatalog.status);
  if (resCatalog.status !== 200 || !resCatalog.text.includes('Book Catalog')) {
    throw new Error('Failed GET /catalog');
  }

  // 5. Test /profile route
  const resProfile = await request(app).get('/profile');
  console.log('GET /profile status:', resProfile.status);
  if (resProfile.status !== 200 || !resProfile.text.includes('Patron Digital ID')) {
    throw new Error('Failed GET /profile');
  }

  // 6. Test multiple consecutive requests to ensure rate limiter NEVER blocks page views
  console.log('Testing 30 rapid page requests...');
  for (let i = 0; i < 30; i++) {
    const r = await request(app).get('/');
    if (r.status !== 200) {
      throw new Error(`Page request ${i} was blocked with status ${r.status}`);
    }
  }

  // 7. Test health API
  const resHealth = await request(app).get('/api/v1/health');
  console.log('GET /api/v1/health status:', resHealth.status, 'data:', resHealth.body.data.status);
  if (resHealth.status !== 200 || resHealth.body.data.status !== 'UP') {
    throw new Error('Failed GET /api/v1/health');
  }

  console.log('✅ ALL WEB PORTAL AND ROUTE TESTS PASSED SUCCESSFULLY!');
}

testWebPortal().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
