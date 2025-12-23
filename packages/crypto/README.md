# @timeseal/crypto

Split-key AES-GCM encryption utilities extracted from TimeSeal.

## Features

- **Split-Key Encryption**: Key A (client) + Key B (server) architecture
- **HKDF Key Derivation**: Deterministic key derivation with salt
- **Memory Protection**: XOR obfuscation for sensitive data in memory
- **Zero Dependencies**: Pure Web Crypto API

## Installation

```bash
npm install @timeseal/crypto
```

## Usage

### Basic Encryption

```typescript
import { encryptData, decryptData } from '@timeseal/crypto';

// Encrypt
const result = await encryptData('secret message');
// Returns: { encryptedBlob, keyA, keyB, iv }

// Decrypt
const decrypted = await decryptData(result.encryptedBlob, {
  keyA: result.keyA,
  keyB: result.keyB,
  iv: result.iv
});
```

### Key Encryption (for storage)

```typescript
import { encryptKeyB, decryptKeyB } from '@timeseal/crypto';

// Encrypt keyB before storing
const encrypted = await encryptKeyB(keyB, masterKey, sealId);

// Decrypt when needed
const decrypted = await decryptKeyB(encrypted, masterKey, sealId);
```

### Memory Protection

```typescript
import { SecureMemory } from '@timeseal/crypto';

const memory = new SecureMemory();
const protected = memory.protect('sensitive-data');
const retrieved = memory.retrieve(protected);
memory.destroy();
```

## API

See [API.md](./API.md) for full documentation.

## License

Business Source License 1.1 - See LICENSE
