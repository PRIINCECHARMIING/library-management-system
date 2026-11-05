import { getOrCreateCertificates } from '../src/utils/tls.js';

console.log('Generating SSL/TLS certificates for HTTPS server...');
const { key, cert } = getOrCreateCertificates();
console.log(`Success! SSL Private Key (${key.length} bytes) and Certificate (${cert.length} bytes) ready.`);
