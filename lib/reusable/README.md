# Seed Phrase Recovery Library

Reusable BIP39 seed phrase library for deterministic key recovery. Extract and use in any project requiring human-readable key backup.

## 📦 Installation

```bash
npm install bip39 @scure/bip32
```

## 🚀 Quick Start

```typescript
import { generateSeedPhrase, recoverKey } from './lib/reusable/seedPhraseRecovery';

// Generate new seed phrase
const { mnemonic, key } = await generateSeedPhrase();
console.log(mnemonic); // "abandon ability able about above..."
console.log(key);      // "base64-encoded-key"

// Later: recover key from seed phrase
const recoveredKey = await recoverKey(mnemonic);
console.log(key === recoveredKey); // true
```

## 📚 API Reference

### `generateSeedPhrase(config?)`

Generate BIP39 seed phrase and derive deterministic key.

**Parameters:**
- `config.wordCount` - Number of words: 12, 15, 18, 21, or 24 (default: 12)
- `config.derivationPath` - BIP32 path (default: "m/44'/0'/0'/0/0")
- `config.keyFormat` - Output format: 'base64', 'hex', or 'buffer' (default: 'base64')

**Returns:** `{ mnemonic: string, key: string | Buffer, derivationPath: string }`

**Examples:**

```typescript
// 12-word phrase (default)
const result = await generateSeedPhrase();

// 24-word phrase with hex output
const result = await generateSeedPhrase({
  wordCount: 24,
  keyFormat: 'hex'
});

// Custom derivation path (Ethereum)
const result = await generateSeedPhrase({
  derivationPath: "m/44'/60'/0'/0/0"
});
```

### `recoverKey(mnemonic, config?)`

Recover key from BIP39 seed phrase.

**Parameters:**
- `mnemonic` - 12-24 word seed phrase
- `config.derivationPath` - Must match generation path
- `config.keyFormat` - Must match generation format

**Returns:** `string | Buffer`

**Examples:**

```typescript
// Recover with defaults
const key = await recoverKey("abandon ability able...");

// Recover with custom config
const key = await recoverKey("abandon ability able...", {
  derivationPath: "m/44'/60'/0'/0/0",
  keyFormat: 'hex'
});
```

### `validateSeedPhrase(mnemonic)`

Validate BIP39 seed phrase format and checksum.

**Returns:** `boolean`

```typescript
validateSeedPhrase("abandon ability able..."); // true
validateSeedPhrase("invalid words here");      // false
```

### `parseSeedPhrase(input)`

Parse user input into normalized word array.

```typescript
parseSeedPhrase("  abandon   ability\n  able  ");
// ["abandon", "ability", "able"]
```

### `formatSeedPhrase(words)`

Format word array into valid mnemonic string.

```typescript
formatSeedPhrase(["abandon", "ability", "able"]);
// "abandon ability able"
```

### `getWordList()`

Get BIP39 word list for autocomplete/validation.

**Returns:** `string[]` (2048 words)

```typescript
const wordlist = getWordList();
const suggestions = wordlist.filter(w => w.startsWith("aba"));
// ["abandon", "ability", "able", "about", "above"]
```

## 🎨 UI Components

### React Hooks

```typescript
import { useSeedPhraseInput, useSeedPhraseDisplay } from './lib/reusable/seedPhraseUI';

// Input hook
function RecoveryForm() {
  const { words, updateWord, getMnemonic } = useSeedPhraseInput(12);
  
  return (
    <div>
      {words.map((word, i) => (
        <input
          key={i}
          value={word}
          onChange={(e) => updateWord(i, e.target.value)}
        />
      ))}
      <button onClick={() => console.log(getMnemonic())}>
        Recover
      </button>
    </div>
  );
}

// Display hook
function SeedPhraseDisplay({ seedPhrase }) {
  const { words, isVisible, confirm } = useSeedPhraseDisplay(seedPhrase);
  
  if (!isVisible) return null;
  
  return (
    <div>
      {words.map((word, i) => (
        <div key={i}>{i + 1}. {word}</div>
      ))}
      <button onClick={confirm}>I've Written It Down</button>
    </div>
  );
}
```

## 🔒 Security Best Practices

### Storage
- ✅ Write on paper and store in safe
- ✅ Use password manager (encrypted)
- ✅ Split using Shamir Secret Sharing
- ❌ Never store in plain text files
- ❌ Never send via email/SMS unencrypted
- ❌ Never take screenshots

### Display
- ✅ Warn users before showing
- ✅ Require confirmation after viewing
- ✅ Clear from memory after use
- ❌ Don't log to console in production
- ❌ Don't send to analytics

### Recovery
- ✅ Validate checksum before use
- ✅ Rate limit recovery attempts
- ✅ Log recovery events (audit)
- ❌ Don't auto-fill from clipboard
- ❌ Don't suggest words without user input

## 🌍 Use Cases

### Crypto Wallets
```typescript
// Generate wallet with recovery phrase
const { mnemonic, key } = await generateSeedPhrase({
  derivationPath: "m/44'/60'/0'/0/0", // Ethereum
  keyFormat: 'hex'
});
```

### Time-Locked Vaults (TimeSeal)
```typescript
// Generate Key A with recovery option
const { mnemonic, key } = await generateSeedPhrase();
// User writes down: Seal ID + mnemonic
// Later: recover vault link from seed phrase
```

### Password Managers
```typescript
// Derive master key from seed phrase
const { mnemonic, key } = await generateSeedPhrase({
  wordCount: 24,
  derivationPath: "m/44'/0'/0'/0/0"
});
```

### Hardware Wallets
```typescript
// Import seed phrase from hardware wallet
const key = await recoverKey(hardwareWalletMnemonic, {
  derivationPath: "m/44'/0'/0'/0/0"
});
```

## 🧪 Testing

```typescript
import { generateSeedPhrase, recoverKey, validateSeedPhrase } from './seedPhraseRecovery';

describe('Seed Phrase Recovery', () => {
  it('generates valid 12-word phrase', async () => {
    const { mnemonic } = await generateSeedPhrase();
    expect(mnemonic.split(' ')).toHaveLength(12);
    expect(validateSeedPhrase(mnemonic)).toBe(true);
  });

  it('recovers same key from mnemonic', async () => {
    const { mnemonic, key } = await generateSeedPhrase();
    const recovered = await recoverKey(mnemonic);
    expect(recovered).toBe(key);
  });

  it('rejects invalid mnemonic', async () => {
    await expect(recoverKey('invalid words here')).rejects.toThrow();
  });
});
```

## 📄 License

MIT - Free to use in any project (commercial or non-commercial)

## 🔗 Related Standards

- [BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) - Mnemonic code for generating deterministic keys
- [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) - Hierarchical Deterministic Wallets
- [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) - Multi-Account Hierarchy for Deterministic Wallets
