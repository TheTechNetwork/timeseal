// Jest setup file
import { webcrypto } from 'crypto';

// Polyfill Web Crypto API
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}

// Polyfill TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// Set test environment variables
process.env.MASTER_ENCRYPTION_KEY = 'test-master-key-for-testing-only-32-bytes';
(process.env as any).NODE_ENV = 'test';
