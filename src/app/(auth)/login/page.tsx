'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

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
      await signIn(email, password);
      router.push(redirectTo);
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
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">P</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        <p className="text-muted mt-2">Sign in to your account</p>
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
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
            required
            autoComplete="email"
          />

          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-primary hover:text-primary-400 transition-colors font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Support link */}
      <p className="text-center text-sm text-muted mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        Need help?{' '}
        <a
          href="mailto:support@paa-solutions.com"
          className="text-primary hover:text-primary-400 transition-colors"
        >
          Contact Support
        </a>
      </p>
    </div>
  );
}
