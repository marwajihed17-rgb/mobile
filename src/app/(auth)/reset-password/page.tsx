'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { updatePassword } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
      setIsChecking(false);
    };
    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="animate-spin w-8 h-8 border-2 border-card-border border-t-primary rounded-full mx-auto" />
        <p className="text-muted mt-4">Verifying session...</p>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Invalid or Expired Link</h2>
          <p className="text-muted mb-6">
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
          <Button onClick={() => router.push('/forgot-password')} fullWidth>
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Password Updated</h2>
          <p className="text-muted mb-4">
            Your password has been successfully updated. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-card-border rounded-2xl p-8 animate-fade-in-up">
        <h1 className="text-xl font-bold text-foreground mb-2">Set New Password</h1>
        <p className="text-muted text-sm mb-6">
          Enter your new password below. Make sure it&apos;s at least 8 characters.
        </p>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="password"
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            required
            autoComplete="new-password"
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
