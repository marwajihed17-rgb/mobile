import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '--';

  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '--';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const MODULE_INFO = {
  invoice: {
    name: 'Invoice Processing',
    description: 'Dedicated general invoice Chat for processing and managing your invoices efficiently',
    emoji: '🧾',
    gradient: 'from-green-500 to-emerald-600',
  },
  kdr: {
    name: 'KDR Report Generator',
    description: 'KDR Report Creation and Analysis with advanced data processing capabilities',
    emoji: '📈',
    gradient: 'from-blue-500 to-cyan-500',
  },
  ga: {
    name: 'GA Processing',
    description: 'Analytics and reporting automation for comprehensive data insights',
    emoji: '📊',
    gradient: 'from-orange-500 to-amber-500',
  },
  kdr_inv: {
    name: 'KDRs Invoice Processing',
    description: 'Dedicated KDR invoice chat for specialized invoice handling',
    emoji: '📋',
    gradient: 'from-purple-500 to-violet-500',
  },
  kdr_sellout: {
    name: 'KDRs Sellout Processing',
    description: 'Dedicated KDR sellout chat for sales data processing',
    emoji: '💰',
    gradient: 'from-pink-500 to-rose-500',
  },
} as const;

export type ModuleKey = keyof typeof MODULE_INFO;
