'use client';

import { useState } from 'react';
import { recoverKeyA, validateSeedPhrase, formatSeedPhrase } from '@/lib/seedPhrase';
import { Card } from '@/app/components/Card';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import { BackgroundBeams } from '@/app/components/ui/background-beams';
import { FloatingIcons } from '@/app/components/FloatingIcons';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function RecoverPage() {
  const [sealId, setSealId] = useState('');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [vaultLink, setVaultLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    setWords(newWords);
    setError('');
  };

  const handleRecover = async () => {
    setError('');
    setLoading(true);

    try {
      if (!sealId.trim()) {
        throw new Error('Seal ID is required');
      }

      const mnemonic = formatSeedPhrase(words.filter(w => w));
      
      if (!validateSeedPhrase(mnemonic)) {
        throw new Error('Invalid seed phrase. Check your words and try again.');
      }

      const keyA = await recoverKeyA(mnemonic);
      const link = `${window.location.origin}/vault/${sealId}#${keyA}`;
      setVaultLink(link);
      toast.success('Vault link recovered successfully!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recovery failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(vaultLink);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 p-4 relative w-full overflow-x-hidden">
      <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />
      <FloatingIcons />

      <motion.a
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-dark-bg/80 backdrop-blur-sm border-2 border-neon-green/30 rounded-xl hover:border-neon-green transition-all group"
        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)' }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xs text-neon-green/70 font-mono group-hover:text-neon-green transition-colors">← HOME</span>
      </motion.a>

      <div className="max-w-2xl w-full relative z-10 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold glow-text pulse-glow mb-4">🔓 RECOVER VAULT</h1>
          <p className="text-neon-green/70 text-sm">Rebuild your vault link from seed phrase</p>
        </motion.div>

        {!vaultLink ? (
          <Card className="space-y-6">
            <div>
              <Input
                label="SEAL ID"
                value={sealId}
                onChange={setSealId}
                placeholder="a1b2c3d4e5f6..."
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-neon-green/70 font-mono">SEED PHRASE (12 WORDS)</label>
              <div className="grid grid-cols-3 gap-3">
                {words.map((word, i) => (
                  <div key={i} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green/40 text-xs font-mono">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => handleWordChange(i, e.target.value)}
                      className="w-full pl-8 px-4 py-3 bg-black/50 border-2 border-neon-green/30 rounded-xl text-neon-green font-mono focus:border-neon-green outline-none transition-colors text-sm"
                      placeholder="word"
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <p className="text-red-400/70 font-mono text-xs">⚠️ {error}</p>
              </motion.div>
            )}

            <button
              onClick={handleRecover}
              disabled={loading || !sealId.trim() || words.filter(w => w).length < 12}
              className="w-full cyber-button py-3"
            >
              {loading ? 'RECOVERING...' : 'RECOVER VAULT LINK'}
            </button>
          </Card>
        ) : (
          <Card className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-neon-green/10 border border-neon-green/30 rounded-xl"
            >
              <p className="font-mono mb-4 text-neon-green/70 text-sm">✅ Success! Your vault link:</p>
              <div className="bg-black/50 p-4 break-all font-mono text-xs text-neon-green/70 border border-neon-green/20 rounded-xl">
                {vaultLink}
              </div>
            </motion.div>

            <div className="flex gap-4">
              <button
                onClick={handleCopy}
                className="flex-1 cyber-button py-3"
              >
                COPY LINK
              </button>
              <button
                onClick={() => window.location.href = vaultLink}
                className="flex-1 cyber-button py-3"
              >
                OPEN VAULT
              </button>
            </div>

            <button
              onClick={() => {
                setVaultLink('');
                setSealId('');
                setWords(Array(12).fill(''));
              }}
              className="w-full cyber-button py-3 bg-neon-green/10"
            >
              RECOVER ANOTHER
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
