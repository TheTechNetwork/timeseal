import { describe, it, expect, beforeEach } from '@jest/globals';
import { SealDatabase } from '../../lib/database';

describe('DB-backed Security', () => {
  let mockDB: any;
  let db: SealDatabase;

  beforeEach(() => {
    const store = new Map<string, any>();
    
    mockDB = {
      prepare: (sql: string) => ({
        bind: (...args: any[]) => ({
          run: async () => {
            if (sql.includes('INSERT OR REPLACE INTO rate_limits')) {
              store.set(args[0], { count: 1, reset_at: args[1] });
              return { success: true };
            }
            if (sql.includes('UPDATE rate_limits')) {
              const existing = store.get(args[0]);
              if (existing) {
                // Create new object to avoid mutation affecting the returned snapshot
                store.set(args[0], { ...existing, count: existing.count + 1 });
              }
              return { success: true };
            }
            if (sql.includes('INSERT INTO nonces')) {
              if (store.has(`nonce:${args[0]}`)) throw new Error('Duplicate');
              store.set(`nonce:${args[0]}`, args[1]);
              return { success: true };
            }
            return { success: true };
          },
          first: async () => {
            if (sql.includes('SELECT count, reset_at FROM rate_limits')) {
              const data = store.get(args[0]);
              // Return a copy to simulate database snapshot behavior
              return data ? { ...data } : null;
            }
            return null;
          },
        }),
      }),
    };
    
    db = new SealDatabase(mockDB);
  });

  it('should enforce rate limits', async () => {
    const key = 'test-fingerprint';
    
    // First request: INSERT count=1, remaining = limit - 1 = 2 - 1 = 1
    const r1 = await db.checkRateLimit(key, 2, 60000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    
    // Second request: existing.count=1, UPDATE to 2, remaining = limit - existing.count - 1 = 2 - 1 - 1 = 0
    const r2 = await db.checkRateLimit(key, 2, 60000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);
    
    // Third request: existing.count=2, count >= limit (2 >= 2), blocked
    const r3 = await db.checkRateLimit(key, 2, 60000);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it('should reset rate limits after window', async () => {
    const key = 'test-fingerprint';
    const now = Date.now();
    
    mockDB.prepare = (sql: string) => ({
      bind: (...args: any[]) => ({
        run: async () => ({ success: true }),
        first: async () => {
          if (sql.includes('rate_limits')) {
            return { count: 2, reset_at: now - 1000 }; // Expired
          }
          return null;
        },
      }),
    });
    
    const result = await db.checkRateLimit(key, 2, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should reject replay attacks', async () => {
    const nonce = 'test-nonce-123';
    const expiresAt = Date.now() + 300000;
    
    const first = await db.storeNonce(nonce, expiresAt);
    expect(first).toBe(true);
    
    const replay = await db.storeNonce(nonce, expiresAt);
    expect(replay).toBe(false);
  });
});
