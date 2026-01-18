'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  className,
  label
}: ToggleProps) {
  return (
    <label
      className={cn(
        'relative inline-flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative w-11 h-6">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          aria-label={label}
        />
        <span
          className={cn(
            `absolute inset-0 rounded-full transition-colors duration-200
            bg-card-border peer-checked:bg-primary
            peer-focus:ring-2 peer-focus:ring-primary/20`
          )}
        />
        {/* RTL-aware thumb positioning using CSS logical properties */}
        <span
          className={cn(
            `absolute top-0.5 w-5 h-5 rounded-full
            bg-white transition-all duration-200
            start-0.5 peer-checked:start-[1.375rem]`
          )}
          style={{
            // Fallback for browsers that don't fully support start
            insetInlineStart: checked ? '1.375rem' : '0.125rem'
          }}
        />
      </div>
      {label && (
        <span className="text-sm text-foreground-secondary">{label}</span>
      )}
    </label>
  );
}
