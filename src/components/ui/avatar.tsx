'use client';

import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({
  name,
  imageUrl,
  size = 'md',
  className
}: AvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  if (imageUrl) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden bg-card',
          sizeStyles[size],
          className
        )}
      >
        <img
          src={imageUrl}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        `flex items-center justify-center rounded-full
        bg-gradient-to-br from-primary to-secondary
        text-white font-semibold uppercase`,
        sizeStyles[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
