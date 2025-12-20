// Storage Abstraction Layer
import type { R2Bucket } from '@cloudflare/workers-types';
import type { D1Database } from '@cloudflare/workers-types';

const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;

export interface StorageProvider {
  uploadBlob(sealId: string, data: ArrayBuffer, unlockTime: number): Promise<void>;
  downloadBlob(sealId: string): Promise<ArrayBuffer>;
  deleteBlob(sealId: string): Promise<void>;
}

// D1 Database Storage (Free Alternative)
export class D1BlobStorage implements StorageProvider {
  constructor(private db: D1Database) {}

  async uploadBlob(sealId: string, data: ArrayBuffer, unlockTime: number): Promise<void> {
    if (data.byteLength > MAX_UPLOAD_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
    }

    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    
    await this.db.prepare(
      'UPDATE seals SET encrypted_blob = ? WHERE id = ?'
    ).bind(base64, sealId).run();
  }

  async downloadBlob(sealId: string): Promise<ArrayBuffer> {
    const result = await this.db.prepare(
      'SELECT encrypted_blob FROM seals WHERE id = ?'
    ).bind(sealId).first<{ encrypted_blob: string }>();
    
    if (!result?.encrypted_blob) throw new Error('Blob not found');
    
    const binary = atob(result.encrypted_blob);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async deleteBlob(sealId: string): Promise<void> {
    await this.db.prepare(
      'UPDATE seals SET encrypted_blob = NULL WHERE id = ?'
    ).bind(sealId).run();
  }
}

// Production R2 Storage
export class R2Storage implements StorageProvider {
  constructor(private bucket: R2Bucket) { }

  async uploadBlob(sealId: string, data: ArrayBuffer, unlockTime: number): Promise<void> {
    if (data.byteLength > MAX_UPLOAD_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
    }

    const retentionUntil = new Date(unlockTime);

    await this.bucket.put(sealId, data, {
      httpMetadata: {
        contentType: 'application/octet-stream',
        cacheControl: 'no-cache',
      },
      customMetadata: {
        unlockTime: unlockTime.toString(),
        retentionUntil: retentionUntil.toISOString(),
        sealId: sealId,
      },
      retention: {
        mode: 'COMPLIANCE',
        retainUntilDate: retentionUntil,
      },
    } as any);
  }

  async downloadBlob(sealId: string): Promise<ArrayBuffer> {
    const object = await this.bucket.get(sealId);
    if (!object) throw new Error('Blob not found');
    return await object.arrayBuffer();
  }

  async deleteBlob(sealId: string): Promise<void> {
    await this.bucket.delete(sealId);
  }
}

// Mock Storage for Development
export class MockStorage implements StorageProvider {
  private storage = new Map<string, ArrayBuffer>();

  async uploadBlob(sealId: string, data: ArrayBuffer, unlockTime: number): Promise<void> {
    if (data.byteLength > MAX_UPLOAD_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
    }
    this.storage.set(sealId, data);
  }

  async downloadBlob(sealId: string): Promise<ArrayBuffer> {
    const data = this.storage.get(sealId);
    if (!data) throw new Error('Blob not found');
    return data;
  }

  async deleteBlob(sealId: string): Promise<void> {
    this.storage.delete(sealId);
  }
}

// Factory function
export function createStorage(env?: { BUCKET?: R2Bucket; DB?: D1Database }): StorageProvider {
  if (env?.BUCKET) {
    return new R2Storage(env.BUCKET);
  }
  if (env?.DB) {
    return new D1BlobStorage(env.DB);
  }
  return new MockStorage();
}
