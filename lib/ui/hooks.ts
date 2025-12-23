// React Hooks for Text Animations
import { useState, useEffect, useRef, useCallback } from 'react';
import { TextScrambler, createRevealAnimation, TextAnimationConfig } from './textAnimation';

export function useTextScramble(
  text: string,
  config: TextAnimationConfig & { animateOn?: 'view' | 'hover' } = {}
) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const scramblerRef = useRef<TextScrambler | null>(null);

  const scramble = useCallback(() => {
    if (!scramblerRef.current) {
      scramblerRef.current = new TextScrambler(config);
    }

    setIsScrambling(true);
    scramblerRef.current.scramble(
      text,
      setDisplayText,
      () => setIsScrambling(false)
    );
  }, [text, config]);

  useEffect(() => {
    if (config.animateOn === 'view') {
      scramble();
    }
    return () => scramblerRef.current?.stop();
  }, [config.animateOn, scramble]);

  return {
    displayText,
    isScrambling,
    scramble,
    stop: () => scramblerRef.current?.stop(),
  };
}

export function useRevealAnimation(text: string, duration: number = 1.5) {
  const [displayText, setDisplayText] = useState('');
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const animate = createRevealAnimation(text, duration);
    cleanupRef.current = animate(setDisplayText);

    return () => cleanupRef.current?.();
  }, [text, duration]);

  return displayText;
}
