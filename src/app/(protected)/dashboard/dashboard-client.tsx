'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Shield } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MODULE_INFO, type ModuleKey } from '@/lib/utils';
import type { Profile, ModuleAccess } from '@/types/database';

interface DashboardClientProps {
  profile: Profile;
  modules: ModuleAccess[];
}

export function DashboardClient({ profile, modules }: DashboardClientProps) {
  const router = useRouter();

  const authUser = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
    isSuperAdmin: profile.role === 'super_admin',
  };

  // Get accessible modules
  const accessibleModules = modules.filter(m => m.has_access);
  const moduleTypes = accessibleModules.map(m => m.module_type);

  const handleModuleClick = (moduleType: string) => {
    if (moduleTypes.includes(moduleType as ModuleAccess['module_type'])) {
      router.push(`/chat/${moduleType}`);
    }
  };

  const handleLockedClick = () => {
    alert('This module is locked. Please contact your administrator to gain access.');
  };

  const firstName = profile.full_name?.split(' ')[0] || profile.email.split('@')[0];

  return (
    <div className="min-h-screen pb-16">
      <Header user={authUser} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-in-up">
          <p className="text-sm text-muted mb-2">Welcome back, {firstName}!</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Select a Module</h1>
          <p className="text-muted">Choose a module to start your conversation</p>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {/* Active Modules */}
          {Object.entries(MODULE_INFO).map(([key, info]) => {
            const hasAccess = moduleTypes.includes(key as ModuleAccess['module_type']);

            return (
              <ModuleCard
                key={key}
                moduleKey={key as ModuleKey}
                name={info.name}
                description={info.description}
                emoji={info.emoji}
                gradient={info.gradient}
                hasAccess={hasAccess}
                onClick={() => hasAccess ? handleModuleClick(key) : handleLockedClick()}
              />
            );
          })}

          {/* Locked Module Example */}
          <Card
            className="relative min-h-[200px] cursor-not-allowed opacity-60"
            onClick={handleLockedClick}
          >
            <div className="absolute top-4 right-4">
              <Badge variant="error" className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locked
              </Badge>
            </div>

            <div className="w-14 h-14 rounded-xl bg-card-border flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
              Premium Module
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Contact your administrator to gain access to this module
            </p>
          </Card>

          {/* Admin Panel (visible to admins only) */}
          {authUser.isAdmin && (
            <Card
              hover
              className="relative min-h-[200px] cursor-pointer
                bg-gradient-to-br from-amber-500/10 to-orange-600/10
                border-amber-500/30 hover:border-amber-500"
              onClick={() => router.push('/admin')}
            >
              <div className="absolute top-4 right-4">
                <Badge variant="warning" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </Badge>
              </div>

              <div className="w-14 h-14 rounded-xl gradient-admin flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <span className="text-2xl">⚙️</span>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                Admin Panel
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Manage users, permissions, and system settings
              </p>

              <div className="absolute bottom-4 right-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-6 h-6" />
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

interface ModuleCardProps {
  moduleKey: ModuleKey;
  name: string;
  description: string;
  emoji: string;
  gradient: string;
  hasAccess: boolean;
  onClick: () => void;
}

function ModuleCard({
  moduleKey,
  name,
  description,
  emoji,
  gradient,
  hasAccess,
  onClick,
}: ModuleCardProps) {
  const gradientClass = `gradient-${moduleKey.replace('_', '-')}`;

  return (
    <Card
      hover={hasAccess}
      glow={hasAccess}
      className={`relative min-h-[200px] group ${!hasAccess ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={onClick}
    >
      <div className="absolute top-4 right-4">
        {hasAccess ? (
          <Badge variant="success" className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Active
          </Badge>
        ) : (
          <Badge variant="error" className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Locked
          </Badge>
        )}
      </div>

      <div className={`w-14 h-14 rounded-xl ${gradientClass} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
        <span className="text-2xl">{emoji}</span>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {name}
      </h3>
      <p className="text-sm text-muted leading-relaxed">
        {description}
      </p>

      {hasAccess && (
        <div className="absolute bottom-4 right-4 text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
          <ArrowRight className="w-6 h-6" />
        </div>
      )}
    </Card>
  );
}
