'use client';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseStyles = 'px-6 py-3 font-mono font-bold rounded transition-all';
  const variants = {
    primary: 'bg-neon-green text-dark-bg hover:bg-neon-green/80',
    secondary: 'bg-dark-surface text-neon-green border border-neon-green hover:bg-neon-green/10',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
