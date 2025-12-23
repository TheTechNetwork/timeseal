/**
 * @timeseal/seed-phrase-recovery
 *
 * Reusable BIP39 seed phrase library for deterministic key recovery.
 * Can be used in any project requiring human-readable key backup.
 *
 * @example
 * ```typescript
 * // Generate seed phrase for new key
 * const { mnemonic, key } = await generateSeedPhrase();
 * console.log(mnemonic); // "abandon ability able about..."
 *
 * // Later: recover key from seed phrase
 * const recoveredKey = await recoverKey(mnemonic);
 * console.log(key === recoveredKey); // true
 * ```
 *
 * @license MIT
 */

import * as bip39 from "bip39";
import { HDKey } from "@scure/bip32";

export interface SeedPhraseConfig {
  /** Number of words (12, 15, 18, 21, 24) */
  wordCount?: 12 | 15 | 18 | 21 | 24;
  /** BIP32 derivation path (default: m/44'/0'/0'/0/0) */
  derivationPath?: string;
  /** Output format for derived key */
  keyFormat?: "base64" | "hex" | "buffer";
}

export interface SeedPhraseResult {
  /** 12-24 word mnemonic phrase */
  mnemonic: string;
  /** Derived key in specified format */
  key: string | Buffer;
  /** Derivation path used */
  derivationPath: string;
}

const DEFAULT_CONFIG: Required<SeedPhraseConfig> = {
  wordCount: 12,
  derivationPath: "m/44'/0'/0'/0/0",
  keyFormat: "base64",
};

/**
 * Generate BIP39 seed phrase and derive deterministic key
 */
export async function generateSeedPhrase(
  config: SeedPhraseConfig = {},
): Promise<SeedPhraseResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const entropyBits = getEntropyBits(cfg.wordCount);
  const mnemonic = bip39.generateMnemonic(entropyBits);
  const key = await deriveKey(mnemonic, cfg.derivationPath, cfg.keyFormat);

  return { mnemonic, key, derivationPath: cfg.derivationPath };
}

/**
 * Recover key from BIP39 seed phrase
 */
export async function recoverKey(
  mnemonic: string,
  config: Omit<SeedPhraseConfig, "wordCount"> = {},
): Promise<string | Buffer> {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid seed phrase");
  }

  const cfg = { ...DEFAULT_CONFIG, ...config };
  return deriveKey(mnemonic, cfg.derivationPath, cfg.keyFormat);
}

export function validateSeedPhrase(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

export function parseSeedPhrase(input: string): string[] {
  return input.trim().toLowerCase().split(/\s+/);
}

export function formatSeedPhrase(words: string[]): string {
  return words.join(" ");
}

export function getWordList(): string[] {
  return bip39.wordlists.english;
}

function getEntropyBits(wordCount: 12 | 15 | 18 | 21 | 24): number {
  const map: Record<number, number> = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256,
  };
  return map[wordCount] || 128;
}

async function deriveKey(
  mnemonic: string,
  derivationPath: string,
  format: "base64" | "hex" | "buffer",
): Promise<string | Buffer> {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdkey = HDKey.fromMasterSeed(seed);
  const derived = hdkey.derive(derivationPath);

  if (!derived.privateKey) {
    throw new Error("Failed to derive key");
  }

  const keyBuffer = Buffer.from(derived.privateKey);

  switch (format) {
    case "hex":
      return keyBuffer.toString("hex");
    case "buffer":
      return keyBuffer;
    default:
      return keyBuffer.toString("base64");
  }
}
