'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Login failed');
      }

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Failed to get user profile');
      }

      const userProfile = profile as { role: string; status: string };

      if (userProfile.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error('Your account is not active. Please contact administrator.');
      }

      // Role-based redirection
      if (userProfile.role === 'admin' || userProfile.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
      {/* Logo */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="mx-auto mb-4 flex justify-center">
          <Image
            src="/retaam-logo.png"
            alt="Retaam Solutions"
            width={200}
            height={60}
            className="h-16 w-auto"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground">مرحباً بك</h1>
        <p className="text-muted mt-2">سجل دخولك للمتابعة</p>
      </div>

      {/* Login Form */}
      <div className="bg-card border border-card-border rounded-2xl p-8 animate-fade-in-up">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="البريد الإلكتروني"
            placeholder="أدخل بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
            required
            autoComplete="email"
          />

          <Input
            type="password"
            label="كلمة المرور"
            placeholder="أدخل كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            تسجيل الدخول
          </Button>
        </form>
      </div>

      {/* Support link */}
      <p className="text-center text-sm text-muted mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        تحتاج مساعدة؟{' '}
        <a
          href="mailto:support@paa-solutions.com"
          className="text-primary hover:text-primary-400 transition-colors"
        >
          تواصل معنا
        </a>
      </p>
    </div>
  );
}
