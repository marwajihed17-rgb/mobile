'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  className?: string;
}

const icons = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantStyles = {
  error: 'bg-error/10 border-error/30 text-error',
  success: 'bg-success/10 border-success/30 text-success',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-info/10 border-info/30 text-info',
};

export function Alert({
  children,
  variant = 'info',
  title,
  className
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border',
        variantStyles[variant],
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
