import { describe, it, expect } from '@jest/globals';
import { encryptData, decryptData } from '../../lib/crypto';

describe('Crypto - Encryption/Decryption', () => {
  it('should encrypt and decrypt text successfully', async () => {
    const originalText = 'This is a secret message';
    
    const encrypted = await encryptData(originalText);
    expect(encrypted.keyA).toBeTruthy();
    expect(encrypted.keyB).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.encryptedBlob).toBeTruthy();
    
    const decrypted = await decryptData(encrypted.encryptedBlob, {
      keyA: encrypted.keyA,
      keyB: encrypted.keyB,
      iv: encrypted.iv,
    });
    
    const decryptedText = new TextDecoder().decode(decrypted);
    expect(decryptedText).toBe(originalText);
  });

  it('should fail with wrong keys', async () => {
    const originalText = 'Secret';
    const encrypted = await encryptData(originalText);
    
    const wrongEncrypted = await encryptData('Different');
    
    await expect(
      decryptData(encrypted.encryptedBlob, {
        keyA: wrongEncrypted.keyA,
        keyB: encrypted.keyB,
        iv: encrypted.iv,
      })
    ).rejects.toThrow();
  });
});
