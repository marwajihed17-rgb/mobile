'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

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
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link href={backHref}>
              <Button variant="secondary" size="icon" className="w-10 h-10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">
              PAA Solutions
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Online indicator */}
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />

            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">
                {user.fullName || user.email}
              </p>
              <p className="text-xs text-muted capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>

            <Avatar
              name={user.fullName || user.email}
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
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
