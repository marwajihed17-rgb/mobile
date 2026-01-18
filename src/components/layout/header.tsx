'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, ArrowRight } from 'lucide-react';
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
        {/* Right side in RTL (Logo and navigation) */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link href={backHref}>
              <Button variant="secondary" size="icon" className="w-10 h-10">
                {/* Arrow points right in RTL to indicate "back" */}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {/* Logo icon - visible on all screens */}
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/logo-icon.svg"
                alt="Retaam Solutions"
                width={40}
                height={40}
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
            {/* Full logo - hidden on mobile, shown on larger screens */}
            <div className="relative hidden md:block h-8 w-32">
              <Image
                src="/logo.svg"
                alt="Retaam Solutions"
                width={128}
                height={32}
                className="w-full h-full object-contain object-right"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Left side in RTL (User info and actions) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Online indicator */}
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />

            <div className="hidden sm:block text-start">
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
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
