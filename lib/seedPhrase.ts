// BIP39 Seed Phrase Recovery for Key A
// Wrapper around reusable library for TimeSeal-specific usage
import {
  generateSeedPhrase as generateSeedPhraseLib,
  recoverKey as recoverKeyLib,
  validateSeedPhrase as validateSeedPhraseLib,
  parseSeedPhrase as parseSeedPhraseLib,
  formatSeedPhrase as formatSeedPhraseLib,
} from "./reusable/seedPhraseRecovery";

export interface SeedPhraseResult {
  mnemonic: string;
  keyA: string;
}

// Generate 12-word BIP39 seed phrase and derive Key A
export async function generateSeedPhrase(): Promise<SeedPhraseResult> {
  const result = await generateSeedPhraseLib({
    wordCount: 12,
    keyFormat: "base64",
  });
  return { mnemonic: result.mnemonic, keyA: result.key as string };
}

// Recover Key A from 12-word seed phrase
export async function recoverKeyA(mnemonic: string): Promise<string> {
  return (await recoverKeyLib(mnemonic, { keyFormat: "base64" })) as string;
}

// Re-export utilities
export { validateSeedPhraseLib as validateSeedPhrase };
export { parseSeedPhraseLib as parseSeedPhrase };
export { formatSeedPhraseLib as formatSeedPhrase };
