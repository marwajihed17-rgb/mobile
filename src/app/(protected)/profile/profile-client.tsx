'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Bell, Save } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Profile, UserSettings } from '@/types/database';

interface ProfileClientProps {
  profile: Profile;
  settings: UserSettings | null;
}

export function ProfileClient({ profile, settings }: ProfileClientProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.notifications_enabled ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const authUser = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
    isSuperAdmin: profile.role === 'super_admin',
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update settings
      if (settings) {
        const { error: settingsError } = await supabase
          .from('user_settings')
          .update({ notifications_enabled: notificationsEnabled })
          .eq('user_id', profile.id);

        if (settingsError) throw settingsError;
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Header user={authUser} showBackButton backHref="/dashboard" />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted">Manage your account information</p>
        </div>

        {success && (
          <Alert variant="success" className="mb-6">
            Your changes have been saved successfully.
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar
                  name={fullName || profile.email}
                  imageUrl={profile.avatar_url}
                  size="lg"
                />
                <div>
                  <p className="font-medium text-foreground">{fullName || profile.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={profile.status === 'active' ? 'success' : 'error'}
                    >
                      {profile.status}
                    </Badge>
                    <Badge variant="primary">
                      {profile.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-5 h-5" />}
              />

              {/* Email (read-only) */}
              <Input
                label="Email"
                value={profile.email}
                disabled
                icon={<Mail className="w-5 h-5" />}
              />
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-card-hover border border-card-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted">Receive email updates about your activity</p>
                </div>
                <Toggle
                  checked={notificationsEnabled}
                  onChange={setNotificationsEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </main>
    </div>
  );
}
