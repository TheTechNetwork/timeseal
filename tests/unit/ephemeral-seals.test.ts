import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  validateEphemeralConfig,
  isEphemeralExhausted,
  getRemainingViews,
  getEphemeralStatus,
} from '../lib/ephemeral';
import { MockDatabase } from '../lib/database';
import { SealService } from '../lib/sealService';
import { MockStorage } from '../lib/storage';

describe('Ephemeral Seals', () => {
  let db: MockDatabase;
  let storage: MockStorage;
  let sealService: SealService;
  const masterKey = 'test-master-key-32-bytes-long!!';

  beforeEach(() => {
    db = new MockDatabase();
    storage = new MockStorage();
    sealService = new SealService(storage, db, masterKey);
  });

  describe('validateEphemeralConfig', () => {
    test('validates non-ephemeral config', () => {
      const result = validateEphemeralConfig({
        isEphemeral: false,
        maxViews: null,
      });
      expect(result.valid).toBe(true);
    });

    test('validates ephemeral with null maxViews', () => {
      const result = validateEphemeralConfig({
        isEphemeral: true,
        maxViews: null,
      });
      expect(result.valid).toBe(true);
    });

    test('validates ephemeral with valid maxViews', () => {
      const result = validateEphemeralConfig({
        isEphemeral: true,
        maxViews: 5,
      });
      expect(result.valid).toBe(true);
    });

    test('rejects maxViews < 1', () => {
      const result = validateEphemeralConfig({
        isEphemeral: true,
        maxViews: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('positive integer');
    });

    test('rejects maxViews > 100', () => {
      const result = validateEphemeralConfig({
        isEphemeral: true,
        maxViews: 101,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot exceed 100');
    });

    test('rejects non-integer maxViews', () => {
      const result = validateEphemeralConfig({
        isEphemeral: true,
        maxViews: 3.5,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('isEphemeralExhausted', () => {
    test('returns false for non-ephemeral seals', () => {
      expect(isEphemeralExhausted(false, 5, 3)).toBe(false);
    });

    test('returns false for ephemeral with null maxViews', () => {
      expect(isEphemeralExhausted(true, 100, null)).toBe(false);
    });

    test('returns false when views < maxViews', () => {
      expect(isEphemeralExhausted(true, 2, 5)).toBe(false);
    });

    test('returns true when views >= maxViews', () => {
      expect(isEphemeralExhausted(true, 5, 5)).toBe(true);
      expect(isEphemeralExhausted(true, 6, 5)).toBe(true);
    });
  });

  describe('getRemainingViews', () => {
    test('returns null for non-ephemeral seals', () => {
      expect(getRemainingViews(false, 3, 5)).toBeNull();
    });

    test('returns null for ephemeral with null maxViews', () => {
      expect(getRemainingViews(true, 3, null)).toBeNull();
    });

    test('calculates remaining views correctly', () => {
      expect(getRemainingViews(true, 2, 5)).toBe(3);
      expect(getRemainingViews(true, 5, 5)).toBe(0);
    });

    test('returns 0 when exhausted', () => {
      expect(getRemainingViews(true, 6, 5)).toBe(0);
    });
  });

  describe('getEphemeralStatus', () => {
    test('returns correct status for non-exhausted seal', () => {
      const status = getEphemeralStatus(true, 2, 5, 1234567890);
      expect(status.isExhausted).toBe(false);
      expect(status.viewCount).toBe(2);
      expect(status.maxViews).toBe(5);
      expect(status.remainingViews).toBe(3);
      expect(status.firstViewedAt).toBe(1234567890);
    });

    test('returns correct status for exhausted seal', () => {
      const status = getEphemeralStatus(true, 5, 5, 1234567890);
      expect(status.isExhausted).toBe(true);
      expect(status.remainingViews).toBe(0);
    });
  });

  describe('SealService integration', () => {
    test('creates ephemeral seal with maxViews', async () => {
      const unlockTime = Date.now() + 1000;
      const blob = new TextEncoder().encode('test content');

      const result = await sealService.createSeal(
        {
          encryptedBlob: blob.buffer,
          keyB: 'test-key-b',
          iv: 'test-iv',
          unlockTime,
          isEphemeral: true,
          maxViews: 1,
        },
        '127.0.0.1'
      );

      expect(result.sealId).toBeDefined();

      const seal = await db.getSeal(result.sealId);
      expect(seal?.isEphemeral).toBe(true);
      expect(seal?.maxViews).toBe(1);
      expect(seal?.viewCount).toBe(0);
    });

    test('allows first view, blocks second view', async () => {
      const unlockTime = Date.now() - 1000; // Already unlocked
      const blob = new TextEncoder().encode('test content');

      const result = await sealService.createSeal(
        {
          encryptedBlob: blob.buffer,
          keyB: 'test-key-b',
          iv: 'test-iv',
          unlockTime,
          isEphemeral: true,
          maxViews: 1,
        },
        '127.0.0.1'
      );

      // First view - should succeed
      const metadata1 = await sealService.getSeal(result.sealId, '127.0.0.1', 'fingerprint1');
      expect(metadata1.status).toBe('unlocked');
      expect(metadata1.viewCount).toBe(1);

      // Second view - should be exhausted
      const metadata2 = await sealService.getSeal(result.sealId, '127.0.0.1', 'fingerprint2');
      expect(metadata2.status).toBe('exhausted');
    });

    test('deletes seal after max views reached', async () => {
      const unlockTime = Date.now() - 1000;
      const blob = new TextEncoder().encode('test content');

      const result = await sealService.createSeal(
        {
          encryptedBlob: blob.buffer,
          keyB: 'test-key-b',
          iv: 'test-iv',
          unlockTime,
          isEphemeral: true,
          maxViews: 1,
        },
        '127.0.0.1'
      );

      // View once
      await sealService.getSeal(result.sealId, '127.0.0.1', 'fingerprint1');

      // Seal should be deleted
      const seal = await db.getSeal(result.sealId);
      expect(seal).toBeNull();
    });

    test('tracks first viewer fingerprint', async () => {
      const unlockTime = Date.now() - 1000;
      const blob = new TextEncoder().encode('test content');

      const result = await sealService.createSeal(
        {
          encryptedBlob: blob.buffer,
          keyB: 'test-key-b',
          iv: 'test-iv',
          unlockTime,
          isEphemeral: true,
          maxViews: 2,
        },
        '127.0.0.1'
      );

      await sealService.getSeal(result.sealId, '127.0.0.1', 'alice-fingerprint');

      const seal = await db.getSeal(result.sealId);
      expect(seal?.firstViewerFingerprint).toBe('alice-fingerprint');
      expect(seal?.firstViewedAt).toBeGreaterThan(0);
    });

    test('allows multiple views up to maxViews', async () => {
      const unlockTime = Date.now() - 1000;
      const blob = new TextEncoder().encode('test content');

      const result = await sealService.createSeal(
        {
          encryptedBlob: blob.buffer,
          keyB: 'test-key-b',
          iv: 'test-iv',
          unlockTime,
          isEphemeral: true,
          maxViews: 3,
        },
        '127.0.0.1'
      );

      // View 1
      const m1 = await sealService.getSeal(result.sealId, '127.0.0.1', 'fp1');
      expect(m1.status).toBe('unlocked');
      expect(m1.remainingViews).toBe(2);

      // View 2
      const m2 = await sealService.getSeal(result.sealId, '127.0.0.1', 'fp2');
      expect(m2.status).toBe('unlocked');
      expect(m2.remainingViews).toBe(1);

      // View 3 (last)
      const m3 = await sealService.getSeal(result.sealId, '127.0.0.1', 'fp3');
      expect(m3.status).toBe('unlocked');
      expect(m3.remainingViews).toBe(0);

      // View 4 (exhausted)
      const m4 = await sealService.getSeal(result.sealId, '127.0.0.1', 'fp4');
      expect(m4.status).toBe('exhausted');
    });

    test('non-ephemeral seals work normally', async () => {
      const unlockTime = Date.now() - 1000;
      const blob = new TextEncoder().encode('test content');

      const result = await sealService.createSeal(
        {
          encryptedBlob: blob.buffer,
          keyB: 'test-key-b',
          iv: 'test-iv',
          unlockTime,
          isEphemeral: false,
        },
        '127.0.0.1'
      );

      // View multiple times - should always work
      for (let i = 0; i < 10; i++) {
        const metadata = await sealService.getSeal(result.sealId, '127.0.0.1', `fp${i}`);
        expect(metadata.status).toBe('unlocked');
      }

      // Seal should still exist
      const seal = await db.getSeal(result.sealId);
      expect(seal).not.toBeNull();
    });
  });
});
