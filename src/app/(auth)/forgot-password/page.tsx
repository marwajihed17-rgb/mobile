'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { requestPasswordResetByUsername } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await requestPasswordResetByUsername(username);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">تم إرسال رابط إعادة التعيين</h2>
          <p className="text-muted mb-6">
            إذا كان الحساب <strong className="text-foreground">{username}</strong> موجوداً،
            فقد تم إرسال تعليمات إعادة تعيين كلمة المرور.
          </p>
          <Link href="/login">
            <Button fullWidth variant="secondary">
              العودة لتسجيل الدخول
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
        العودة لتسجيل الدخول
      </Link>

      {/* Form */}
      <div className="bg-card border border-card-border rounded-2xl p-8 animate-fade-in-up">
        <h1 className="text-xl font-bold text-foreground mb-2">إعادة تعيين كلمة المرور</h1>
        <p className="text-muted text-sm mb-6">
          أدخل إسم المستخدم الخاص بك وسنرسل لك تعليمات إعادة تعيين كلمة المرور.
        </p>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            label="إسم المستخدم"
            placeholder="أدخل إسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<User className="w-5 h-5" />}
            required
            autoComplete="username"
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            إرسال رابط إعادة التعيين
          </Button>
        </form>
      </div>
    </div>
  );
}
