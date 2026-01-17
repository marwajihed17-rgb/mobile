'use client';

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-foreground-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              `w-full px-4 py-3 text-base
              bg-card-hover border border-card-border rounded-xl
              text-foreground placeholder:text-muted
              transition-all duration-200
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
              disabled:opacity-50 disabled:cursor-not-allowed`,
              icon && 'pl-10',
              isPassword && 'pr-10',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <span className="text-xs text-error">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
