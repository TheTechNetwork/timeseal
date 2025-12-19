'use client';

import { useState, useEffect } from 'react';

export default async function PulsePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PulsePageClient token={token} />;
}

function PulsePageClient({ token }: { token: string }) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [pulseDuration, setPulseDuration] = useState<number>(0);
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);
  const [isBurning, setIsBurning] = useState(false);

  useEffect(() => {
    fetchPulseStatus();
    const interval = setInterval(fetchPulseStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  const fetchPulseStatus = async () => {
    try {
      const response = await fetch(`/api/pulse/${token}`);
      const data = await response.json();
      if (response.ok) {
        setTimeRemaining(data.timeRemaining);
        setPulseDuration(data.pulseDuration);
      }
    } catch (err) {
      console.error('Failed to fetch pulse status:', err);
    }
  };

  const handlePulse = async () => {
    setIsPulsing(true);
    setError(null);
    try {
      const response = await fetch(`/api/pulse/${token}`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        fetchPulseStatus();
      } else {
        setError(data.error || 'Failed to pulse');
      }
    } catch (err) {
      setError('Failed to pulse');
    } finally {
      setIsPulsing(false);
    }
  };

  const handleBurn = async () => {
    setIsBurning(true);
    setError(null);
    try {
      const response = await fetch('/api/burn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pulseToken: token }),
      });
      const data = await response.json();
      
      if (data.success) {
        window.location.href = '/?burned=true';
      } else {
        setError(data.error || 'Failed to burn seal');
      }
    } catch (err) {
      setError('Failed to burn seal');
    } finally {
      setIsBurning(false);
    }
  };

  const formatTime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isUrgent = timeRemaining < pulseDuration * 0.2;

  if (showBurnConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔥</div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">BURN SEAL?</h1>
          <p className="text-neon-green/70 mb-8">
            This will permanently destroy the seal. The encrypted content will be unrecoverable.
            This action cannot be undone.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleBurn}
              disabled={isBurning}
              className="cyber-button w-full bg-red-500/20 border-red-500 hover:bg-red-500/30 disabled:opacity-50"
            >
              {isBurning ? 'BURNING...' : '🔥 YES, BURN IT'}
            </button>
            <button
              onClick={() => setShowBurnConfirm(false)}
              className="cyber-button w-full"
            >
              CANCEL
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold glow-text mb-4">PULSE CONFIRMED</h1>
          <p className="text-neon-green/70 mb-8">
            Your seal remains locked. Next pulse needed in {formatTime(pulseDuration)}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className={`text-6xl mb-4 ${isUrgent ? 'animate-pulse' : ''}`}>💓</div>
        <h1 className="text-3xl font-bold glow-text mb-4">DEAD MAN'S SWITCH</h1>
        
        {timeRemaining > 0 && (
          <div className="cyber-border p-6 mb-6">
            <p className="text-sm text-neon-green/70 mb-2">TIME UNTIL AUTO-UNLOCK</p>
            <div className={`text-4xl font-mono ${isUrgent ? 'text-red-500 pulse-glow' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
            {isUrgent && (
              <p className="text-red-500 text-sm mt-2">⚠️ URGENT: Pulse soon or seal will unlock!</p>
            )}
          </div>
        )}
        
        <p className="text-neon-green/70 mb-8">
          Click to confirm you're still active and reset the countdown.
        </p>
        
        <button
          onClick={handlePulse}
          disabled={isPulsing}
          className="cyber-button w-full text-xl py-6 disabled:opacity-50"
        >
          {isPulsing ? 'PULSING...' : '💓 SEND PULSE'}
        </button>
        
        <button
          onClick={() => setShowBurnConfirm(true)}
          className="cyber-button w-full mt-4 text-sm border-red-500/30 text-red-500/70 hover:border-red-500 hover:text-red-500"
        >
          🔥 BURN SEAL (PERMANENT)
        </button>
        
        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
