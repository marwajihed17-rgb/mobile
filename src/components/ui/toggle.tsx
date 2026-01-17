'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  className
}: ToggleProps) {
  return (
    <label className={cn('relative inline-block w-11 h-6 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <span
        className={cn(
          `absolute inset-0 rounded-full transition-colors duration-200
          bg-card-border peer-checked:bg-primary
          peer-focus:ring-2 peer-focus:ring-primary/20`
        )}
      />
      <span
        className={cn(
          `absolute top-0.5 left-0.5 w-5 h-5 rounded-full
          bg-white transition-transform duration-200
          peer-checked:translate-x-5`
        )}
      />
    </label>
  );
}
