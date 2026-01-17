'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserCheck, Shield, UserX,
  ChevronDown, Plus, Mail, Lock, User,
  Trash2, RefreshCw, Check
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Avatar } from '@/components/ui/avatar';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';
import { MODULE_INFO, type ModuleKey } from '@/lib/utils';
import type { Profile, ModuleAccess, UserSettings } from '@/types/database';

interface AdminClientProps {
  currentProfile: Profile;
  profiles: Profile[];
  allModuleAccess: ModuleAccess[];
  allSettings: UserSettings[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    adminCount: number;
    disabledUsers: number;
  };
}

export function AdminClient({
  currentProfile,
  profiles,
  allModuleAccess,
  allSettings,
  stats,
}: AdminClientProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Create user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');

  const authUser = {
    id: currentProfile.id,
    email: currentProfile.email,
    fullName: currentProfile.full_name,
    avatarUrl: currentProfile.avatar_url,
    role: currentProfile.role,
    isAdmin: currentProfile.role === 'admin' || currentProfile.role === 'super_admin',
    isSuperAdmin: currentProfile.role === 'super_admin',
  };

  const toggleUserExpand = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getUserModules = (userId: string) => {
    return allModuleAccess.filter(m => m.user_id === userId);
  };

  const getUserSettings = (userId: string) => {
    return allSettings.find(s => s.user_id === userId);
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use Supabase admin API to create user
      const { error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newFullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      setShowCreateForm(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleModuleAccess = async (userId: string, moduleType: string, hasAccess: boolean) => {
    try {
      const { error } = await supabase
        .from('module_access')
        .update({ has_access: !hasAccess })
        .eq('user_id', userId)
        .eq('module_type', moduleType);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access');
    }
  };

  const handleToggleAdminPrivileges = async (userId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ admin_privileges: !currentValue })
        .eq('user_id', userId);

      if (error) throw error;

      // Also update the role if granting admin
      if (!currentValue) {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', userId);

        if (roleError) throw roleError;
      } else {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'user' })
          .eq('id', userId);

        if (roleError) throw roleError;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update privileges');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Header user={authUser} showBackButton backHref="/dashboard" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg gradient-admin flex items-center justify-center text-lg">
                ⚙️
              </span>
              Admin Panel
            </h1>
            <p className="text-muted mt-2">Manage users, permissions, and system settings</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} />
          <StatCard label="Active Users" value={stats.activeUsers} icon={UserCheck} variant="success" />
          <StatCard label="Administrators" value={stats.adminCount} icon={Shield} variant="warning" />
          <StatCard label="Disabled Accounts" value={stats.disabledUsers} icon={UserX} variant="error" />
        </div>

        {/* Users Section */}
        <Card className="overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-card-border">
            <h2 className="text-lg font-semibold">Users</h2>
            <Badge variant="muted">{stats.totalUsers} users</Badge>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <div className="p-6 bg-primary/5 border-b border-card-border animate-fade-in-up">
              <h3 className="font-semibold mb-4">Create New User</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input
                  placeholder="Full name"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} isLoading={isLoading}>
                  Create User
                </Button>
              </div>
            </div>
          )}

          {/* User List */}
          <div className="max-h-[600px] overflow-y-auto hide-scrollbar">
            {profiles.map((profile) => {
              const isExpanded = expandedUsers.has(profile.id);
              const modules = getUserModules(profile.id);
              const settings = getUserSettings(profile.id);
              const isCurrentUser = profile.id === currentProfile.id;

              return (
                <div key={profile.id} className="border-b border-card-border last:border-b-0">
                  {/* User Row Header */}
                  <div
                    className="flex items-center justify-between p-4 hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => toggleUserExpand(profile.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar
                        name={profile.full_name || profile.email}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {profile.full_name || profile.email.split('@')[0]}
                          {isCurrentUser && (
                            <span className="text-xs text-muted ml-2">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted">{profile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {(profile.role === 'admin' || profile.role === 'super_admin') && (
                          <Badge variant="warning">Admin</Badge>
                        )}
                        <Badge variant={profile.status === 'active' ? 'success' : 'error'}>
                          {profile.status}
                        </Badge>
                      </div>
                      <button className="p-2 hover:bg-white/5 rounded-md transition-colors">
                        <ChevronDown
                          className={`w-5 h-5 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-black/20 border-t border-card-border animate-fade-in-up">
                      <div className="ml-14 grid md:grid-cols-2 gap-6">
                        {/* Permissions */}
                        <div>
                          <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
                            Permissions
                          </h4>
                          <div className="space-y-2">
                            <ToggleSetting
                              label="Dashboard Access"
                              checked={settings?.dashboard_access ?? true}
                              disabled={isCurrentUser}
                            />
                            <ToggleSetting
                              label="Admin Privileges"
                              checked={settings?.admin_privileges ?? false}
                              onChange={() => handleToggleAdminPrivileges(profile.id, settings?.admin_privileges ?? false)}
                              disabled={isCurrentUser || profile.role === 'super_admin'}
                            />
                          </div>
                        </div>

                        {/* Module Access */}
                        <div>
                          <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
                            Module Access
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(MODULE_INFO).map(([key, info]) => {
                              const moduleAccess = modules.find(m => m.module_type === key);
                              const hasAccess = moduleAccess?.has_access ?? false;

                              return (
                                <button
                                  key={key}
                                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium
                                    rounded-lg border transition-colors
                                    ${hasAccess
                                      ? 'bg-primary/10 border-primary text-primary'
                                      : 'bg-card border-card-border text-muted hover:border-card-border-hover'
                                    }`}
                                  onClick={() => handleToggleModuleAccess(profile.id, key, hasAccess)}
                                >
                                  <span>{info.emoji}</span>
                                  {info.name.split(' ')[0]}
                                  {hasAccess && <Check className="w-3 h-3" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-14 mt-4 pt-4 border-t border-card-border flex flex-wrap gap-3">
                        {profile.status === 'inactive' && (
                          <Button
                            size="sm"
                            onClick={() => handleToggleUserStatus(profile.id, profile.status)}
                          >
                            Enable Account
                          </Button>
                        )}
                        <Button size="sm" variant="secondary">
                          <RefreshCw className="w-4 h-4" />
                          Reset Password
                        </Button>
                        {!isCurrentUser && (
                          <>
                            {profile.status === 'active' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleToggleUserStatus(profile.id, profile.status)}
                              >
                                Disable Account
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setDeleteConfirm(profile.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete User
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Delete Confirmation */}
                      {deleteConfirm === profile.id && (
                        <div className="ml-14 mt-3 p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3 animate-fade-in-up">
                          <span className="text-sm text-error flex-1">
                            Are you sure you want to delete this user?
                          </span>
                          <Button size="sm" variant="secondary" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" variant="danger">
                            Confirm Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

function StatCard({ label, value, icon: Icon, variant = 'default' }: StatCardProps) {
  const variantColors = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  };

  return (
    <Card className="p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">{label}</span>
        <Icon className="w-5 h-5 text-muted" />
      </div>
      <p className={`text-2xl font-bold ${variantColors[variant]}`}>{value}</p>
    </Card>
  );
}

interface ToggleSettingProps {
  label: string;
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
}

function ToggleSetting({ label, checked, onChange, disabled }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-card border border-card-border rounded-lg">
      <span className="text-sm text-foreground-secondary">{label}</span>
      <Toggle checked={checked} onChange={onChange || (() => {})} disabled={disabled} />
    </div>
  );
}
