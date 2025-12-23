/**
 * Tests for Reusable Libraries
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TextScrambler, createRevealAnimation } from '@/lib/ui/textAnimation';
import { 
  arrayBufferToBase64, 
  base64ToArrayBuffer, 
  sha256,
  hmacSign,
  hmacVerify,
  generateRandomString
} from '@/lib/cryptoUtils';
import { 
  jsonResponse, 
  errorResponse, 
  successResponse,
  getClientIP,
  corsHeaders 
} from '@/lib/http';
import { compose, createMiddleware, type Context, type Handler } from '@/lib/middleware';

describe('Text Animation Library', () => {
  describe('TextScrambler', () => {
    it('should scramble text and resolve to original', (done) => {
      const scrambler = new TextScrambler({ speed: 10, maxIterations: 5 });
      const text = 'TEST';
      let finalText = '';

      scrambler.scramble(
        text,
        (displayText) => { finalText = displayText; },
        () => {
          expect(finalText).toBe(text);
          done();
        }
      );
    });

    it('should stop scrambling when stop is called', () => {
      const scrambler = new TextScrambler();
      let updateCount = 0;

      scrambler.scramble('TEST', () => { updateCount++; });
      scrambler.stop();

      const initialCount = updateCount;
      setTimeout(() => {
        expect(updateCount).toBe(initialCount);
      }, 100);
    });
  });

  describe('createRevealAnimation', () => {
    it('should create reveal animation function', () => {
      const animate = createRevealAnimation('TEST', 0.1);
      expect(typeof animate).toBe('function');
    });
  });
});

describe('Crypto Utilities', () => {
  describe('Base64 conversion', () => {
    it('should convert ArrayBuffer to base64 and back', () => {
      const original = new TextEncoder().encode('Hello World');
      const base64 = arrayBufferToBase64(original.buffer);
      const decoded = base64ToArrayBuffer(base64);
      const result = new TextDecoder().decode(decoded);
      
      expect(result).toBe('Hello World');
    });
  });

  describe('SHA-256', () => {
    it('should generate consistent hash', async () => {
      const hash1 = await sha256('test');
      const hash2 = await sha256('test');
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await sha256('test1');
      const hash2 = await sha256('test2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('HMAC', () => {
    it('should sign and verify data', async () => {
      const data = 'test message';
      const secret = 'secret-key';
      
      const signature = await hmacSign(data, secret);
      const valid = await hmacVerify(data, signature, secret);
      
      expect(valid).toBe(true);
    });

    it('should fail verification with wrong secret', async () => {
      const data = 'test message';
      const signature = await hmacSign(data, 'secret1');
      const valid = await hmacVerify(data, signature, 'secret2');
      
      expect(valid).toBe(false);
    });
  });

  describe('Random generation', () => {
    it('should generate random strings', () => {
      const str1 = generateRandomString(16);
      const str2 = generateRandomString(16);
      
      expect(str1).not.toBe(str2);
      expect(str1.length).toBe(16);
    });
  });
});

describe('HTTP Utilities', () => {
  describe('jsonResponse', () => {
    it('should create JSON response with default status', () => {
      const response = jsonResponse({ success: true });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should create JSON response with custom status', () => {
      const response = jsonResponse({ error: 'Not found' }, { status: 404 });
      
      expect(response.status).toBe(404);
    });
  });

  describe('errorResponse', () => {
    it('should create error response', () => {
      const response = errorResponse('Bad request', 400);
      
      expect(response.status).toBe(400);
    });
  });

  describe('successResponse', () => {
    it('should create success response', () => {
      const response = successResponse({ data: 'test' });
      
      expect(response.status).toBe(200);
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from CF-Connecting-IP header', () => {
      const request = new Request('https://example.com', {
        headers: { 'CF-Connecting-IP': '1.2.3.4' }
      });
      
      expect(getClientIP(request)).toBe('1.2.3.4');
    });

    it('should return unknown if no IP header', () => {
      const request = new Request('https://example.com');
      
      expect(getClientIP(request)).toBe('unknown');
    });
  });

  describe('corsHeaders', () => {
    it('should generate CORS headers', () => {
      const headers = corsHeaders();
      
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Methods']).toBeDefined();
    });
  });
});

describe('Middleware', () => {
  describe('compose', () => {
    it('should compose multiple middlewares', async () => {
      const calls: string[] = [];
      
      const mw1 = createMiddleware(async (ctx, next) => {
        calls.push('mw1-before');
        const response = await next(ctx);
        calls.push('mw1-after');
        return response;
      });
      
      const mw2 = createMiddleware(async (ctx, next) => {
        calls.push('mw2-before');
        const response = await next(ctx);
        calls.push('mw2-after');
        return response;
      });
      
      const handler: Handler = async () => {
        calls.push('handler');
        return new Response('OK');
      };
      
      const composed = compose(mw1, mw2);
      const ctx: Context = { 
        request: new Request('https://example.com'),
        ip: '1.2.3.4'
      };
      
      await composed(ctx, handler);
      
      expect(calls).toEqual([
        'mw1-before',
        'mw2-before',
        'handler',
        'mw2-after',
        'mw1-after'
      ]);
    });
  });

  describe('createMiddleware', () => {
    it('should create middleware from function', async () => {
      const mw = createMiddleware(async (ctx, next) => {
        return new Response('Intercepted');
      });
      
      const ctx: Context = {
        request: new Request('https://example.com'),
        ip: '1.2.3.4'
      };
      
      const response = await mw(ctx, async () => new Response('Original'));
      const text = await response.text();
      
      expect(text).toBe('Intercepted');
    });
  });
});
