// Storage Abstraction Layer
import type { D1Database } from '@cloudflare/workers-types';

// D1 has 1MB column limit for TEXT, base64 encoding adds ~33% overhead
// Safe limit: 750KB binary = ~1MB base64
const MAX_UPLOAD_SIZE = 750 * 1024; // 750KB

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

    // Chunked base64 encoding to avoid stack overflow
    const bytes = new Uint8Array(data);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    
    await this.db.prepare(
      'UPDATE seals SET encrypted_blob = ? WHERE id = ?'
    ).bind(base64, sealId).run();
  }

  async downloadBlob(sealId: string): Promise<ArrayBuffer> {
    const result = await this.db.prepare(
      'SELECT encrypted_blob FROM seals WHERE id = ?'
    ).bind(sealId).first<{ encrypted_blob: string }>();
    
    if (!result?.encrypted_blob) throw new Error('Blob not found');
    
    // Chunked decoding to avoid stack overflow
    const binary = atob(result.encrypted_blob);
    const bytes = new Uint8Array(binary.length);
    const chunkSize = 8192;
    for (let i = 0; i < binary.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, binary.length);
      for (let j = i; j < end; j++) {
        bytes[j] = binary.charCodeAt(j);
      }
    }
    return bytes.buffer;
  }

  async deleteBlob(sealId: string): Promise<void> {
    await this.db.prepare(
      'UPDATE seals SET encrypted_blob = NULL WHERE id = ?'
    ).bind(sealId).run();
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
export function createStorage(env?: { DB?: D1Database }): StorageProvider {
  if (env?.DB) {
    return new D1BlobStorage(env.DB);
  }
  return new MockStorage();
}
