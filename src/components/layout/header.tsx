'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

// Helper function to get role display name
function getRoleDisplayName(role: AuthUser['role']): string {
  switch (role) {
    case 'admin':
      return 'مشرف';
    case 'super_admin':
      return 'مدير';
    case 'operator':
      return 'مشغل';
    default:
      return 'مستخدم';
  }
}

// Helper function to get role badge variant
function getRoleBadgeVariant(role: AuthUser['role']): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (role) {
    case 'admin':
      return 'warning';
    case 'super_admin':
      return 'error';
    case 'operator':
      return 'primary';
    default:
      return 'default';
  }
}

interface HeaderProps {
  user: AuthUser;
  showBackButton?: boolean;
  backHref?: string;
}

export function Header({ user, showBackButton = false, backHref = '/dashboard' }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header
      className="sticky top-0 z-20 px-6 py-4
      bg-background-secondary/80 backdrop-blur-xl
      border-b border-card-border"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Right side in RTL (Logo and navigation) */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link href={backHref}>
              <Button variant="secondary" size="icon" className="w-10 h-10">
                {/* Arrow points left in RTL to indicate "back" */}
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/retaam-logo.png"
              alt="Retaam Solutions"
              width={180}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Left side in RTL (User info and actions) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-start">
              <p className="text-sm font-medium text-foreground">
                {user.username || user.email}
              </p>
              <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs mt-1">
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>

            <Avatar
              name={user.username || user.email}
              imageUrl={user.avatarUrl}
              size="md"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
