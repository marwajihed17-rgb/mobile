'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'muted';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    error: 'bg-error/10 text-error',
    warning: 'bg-warning/10 text-warning',
    muted: 'bg-muted/10 text-muted',
  };

  return (
    <span
      className={cn(
        `inline-flex items-center gap-1 px-2 py-0.5
        text-xs font-medium rounded-full`,
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
