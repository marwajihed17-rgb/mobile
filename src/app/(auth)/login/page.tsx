'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';
import { signInWithEmailOrUsername } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Check for error message in URL params (from middleware redirect)
  useEffect(() => {
    if (searchParams) {
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(errorParam);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      // Sign in with email or username
      const authData = await signInWithEmailOrUsername(emailOrUsername, password);

      if (!authData.user) {
        throw new Error('Login failed');
      }

      // Get user profile to check role and status
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
        throw new Error('حسابك معطل.');
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
            type="text"
            label="البريد الإلكتروني أو إسم المستخدم"
            placeholder="أدخل البريد الإلكتروني أو إسم المستخدم"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            icon={<User className="w-5 h-5" />}
            required
            autoComplete="username"
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md"></div>}>
      <LoginForm />
    </Suspense>
  );
}
