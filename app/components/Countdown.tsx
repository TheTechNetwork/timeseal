'use client';

import { useEffect, useState } from 'react';

interface CountdownProps {
  unlockTime: number;
  onUnlock?: () => void;
}

export function Countdown({ unlockTime, onUnlock }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(unlockTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = unlockTime - Date.now();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onUnlock?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockTime, onUnlock]);

  if (timeLeft <= 0) {
    return <div className="text-neon-green font-mono text-2xl">UNLOCKED</div>;
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="flex gap-4 font-mono text-neon-green" data-testid="countdown">
      {days > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold">{days}</span>
          <span className="text-sm">DAYS</span>
        </div>
      )}
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold">{hours.toString().padStart(2, '0')}</span>
        <span className="text-sm">HOURS</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold">{minutes.toString().padStart(2, '0')}</span>
        <span className="text-sm">MINUTES</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold">{seconds.toString().padStart(2, '0')}</span>
        <span className="text-sm">SECONDS</span>
      </div>
    </div>
  );
}
