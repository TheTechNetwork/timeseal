'use client';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 bg-dark-bg/90 backdrop-blur-sm border-t border-neon-green/10 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neon-green/50 font-mono">
        <div>
          Built with 💚 and 🔒 | <a href="https://github.com/teycir/timeseal" target="_blank" rel="noopener noreferrer" className="hover:text-neon-green transition-colors underline">Open Source</a>
        </div>
        <div className="flex gap-4">
          <a href="https://twitter.com/intent/tweet?text=Check%20out%20TimeSeal%20-%20Cryptographic%20time-locked%20vault!&url=https://timeseal.dev" target="_blank" rel="noopener noreferrer" className="hover:text-neon-green transition-colors">
            Share on 𝕏
          </a>
          <a href="https://github.com/teycir/timeseal" target="_blank" rel="noopener noreferrer" className="hover:text-neon-green transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
