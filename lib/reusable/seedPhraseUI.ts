/**
 * @timeseal/seed-phrase-ui
 * 
 * Reusable React components for seed phrase display and recovery.
 * Framework-agnostic design patterns.
 */

import { useState } from 'react';

export interface SeedPhraseDisplayProps {
  /** 12-24 word mnemonic */
  seedPhrase: string;
  /** Optional identifier (seal ID, wallet address, etc) */
  identifier?: string;
  /** Callback when user confirms they've written it down */
  onConfirm?: () => void;
  /** Callback to copy to clipboard */
  onCopy?: (text: string) => void;
  /** Custom styling classes */
  className?: string;
}

export interface SeedPhraseInputProps {
  /** Number of words expected */
  wordCount?: 12 | 24;
  /** Callback when all words are entered */
  onChange?: (words: string[]) => void;
  /** Callback for validation */
  onValidate?: (isValid: boolean) => void;
  /** Custom styling classes */
  className?: string;
}

/**
 * Hook for managing seed phrase input state
 */
export function useSeedPhraseInput(wordCount: 12 | 24 = 12) {
  const [words, setWords] = useState<string[]>(Array(wordCount).fill(''));
  const [isValid, setIsValid] = useState(false);

  const updateWord = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    setWords(newWords);
    return newWords;
  };

  const reset = () => {
    setWords(Array(wordCount).fill(''));
    setIsValid(false);
  };

  const getMnemonic = () => words.filter(w => w).join(' ');

  return { words, updateWord, reset, getMnemonic, isValid, setIsValid };
}

/**
 * Hook for managing seed phrase display state
 */
export function useSeedPhraseDisplay(seedPhrase: string) {
  const [isVisible, setIsVisible] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const words = seedPhrase.split(' ');

  const confirm = () => {
    setIsConfirmed(true);
    setIsVisible(false);
  };

  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return { words, isVisible, isConfirmed, confirm, show, hide };
}

/**
 * Utility: Format seed phrase for display
 */
export function formatSeedPhraseDisplay(seedPhrase: string): Array<{ index: number; word: string }> {
  return seedPhrase.split(' ').map((word, index) => ({ index: index + 1, word }));
}

/**
 * Utility: Validate word against BIP39 wordlist
 */
export function isValidBIP39Word(word: string, wordlist: string[]): boolean {
  return wordlist.includes(word.toLowerCase());
}

/**
 * Utility: Get autocomplete suggestions
 */
export function getWordSuggestions(partial: string, wordlist: string[], limit = 5): string[] {
  if (!partial) return [];
  const lower = partial.toLowerCase();
  return wordlist.filter(w => w.startsWith(lower)).slice(0, limit);
}
