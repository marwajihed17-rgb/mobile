'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { requestPasswordReset } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
          <p className="text-muted mb-6">
            If an account exists for <strong className="text-foreground">{email}</strong>,
            we&apos;ve sent password reset instructions.
          </p>
          <Link href="/login">
            <Button fullWidth variant="secondary">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Back Link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8 animate-fade-in"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>

      {/* Form */}
      <div className="bg-card border border-card-border rounded-2xl p-8 animate-fade-in-up">
        <h1 className="text-xl font-bold text-foreground mb-2">Reset Password</h1>
        <p className="text-muted text-sm mb-6">
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>

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

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            Send Reset Link
          </Button>
        </form>
      </div>
    </div>
  );
}
