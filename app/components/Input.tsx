'use client';

interface InputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  testId?: string;
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  testId,
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-neon-green font-mono text-sm">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="bg-dark-surface border border-border text-white px-4 py-3 rounded font-mono focus:border-neon-green focus:outline-none"
      />
      {error && (
        <span className="text-red-500 text-sm font-mono">{error}</span>
      )}
    </div>
  );
}
