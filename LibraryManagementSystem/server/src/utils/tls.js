import fs from 'fs';
import path from 'path';
import selfsigned from 'selfsigned';
import { env } from '../config/environment.js';

/**
 * Ensures SSL/TLS certificates exist, generating them if missing.
 * @returns {{ key: Buffer, cert: Buffer }}
 */
export function getOrCreateCertificates() {
  const certDir = path.dirname(env.SSL_KEY_PATH);
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const keyExists = fs.existsSync(env.SSL_KEY_PATH);
  const certExists = fs.existsSync(env.SSL_CERT_PATH);

  if (keyExists && certExists) {
    return {
      key: fs.readFileSync(env.SSL_KEY_PATH),
      cert: fs.readFileSync(env.SSL_CERT_PATH)
    };
  }

  // Generate self-signed certificate for local HTTPS/TLS
  const pems = selfsigned.generate(
    [
      { name: 'commonName', value: 'localhost' },
      { name: 'organizationName', value: 'Library Management System' },
      { name: 'countryName', value: 'US' }
    ],
    {
      days: 365,
      keySize: 2048,
      algorithm: 'sha256',
      extensions: [
        {
          name: 'subjectAltName',
          altNames: [
            { type: 2, value: 'localhost' },
            { type: 7, ip: '127.0.0.1' }
          ]
        },
        {
          name: 'basicConstraints',
          cA: true
        }
      ]
    }
  );

  fs.writeFileSync(env.SSL_KEY_PATH, pems.private, { encoding: 'utf8', mode: 0o600 });
  fs.writeFileSync(env.SSL_CERT_PATH, pems.cert, { encoding: 'utf8', mode: 0o644 });

  return {
    key: Buffer.from(pems.private),
    cert: Buffer.from(pems.cert)
  };
}

/**
 * Returns HTTPS server options with TLS 1.2+ minimum and secure cipher configuration.
 */
export function getTlsOptions() {
  const { key, cert } = getOrCreateCertificates();
  return {
    key,
    cert,
    minVersion: 'TLSv1.2',
    ciphers: [
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305'
    ].join(':'),
    honorCipherOrder: true
  };
}
