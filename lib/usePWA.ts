'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after 10 seconds
      const timeoutId = setTimeout(() => {
        try {
          if (localStorage.getItem('pwa-dismissed') !== 'true') {
            toast('Install TimeSeal for offline access', {
              action: {
                label: 'Install',
                onClick: () => {
                  (e as any).prompt();
                  (e as any).userChoice.then((choice: any) => {
                    if (choice.outcome === 'accepted') {
                      toast.success('TimeSeal installed!');
                    }
                    setDeferredPrompt(null);
                  }).catch(() => {
                    setDeferredPrompt(null);
                  });
                },
              },
              cancel: {
                label: 'Dismiss',
                onClick: () => {
                  try {
                    localStorage.setItem('pwa-dismissed', 'true');
                  } catch {}
                },
              },
            });
          }
        } catch {}
      }, 10000);

      return () => clearTimeout(timeoutId);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return { deferredPrompt };
}
