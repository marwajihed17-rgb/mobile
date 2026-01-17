'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  CreditCard,
  Phone,
  Smartphone,
  Hash,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface SalamFormClientProps {
  profile: Profile;
}

export function SalamFormClient({ profile }: SalamFormClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    identity_number: '',
    phone_number: '',
    sim_number: '',
    device_number: '',
    nationality: '',
    register_number: '',
  });

  const authUser = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
    isSuperAdmin: profile.role === 'super_admin',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseClient();

      // Check if user already exists
      const { data: existing } = await supabase
        .from('salam_entries')
        .select('id')
        .eq('identity_number', formData.identity_number)
        .single();

      if (existing) {
        setError('المستخدم موجود مسبقاً');
        setIsLoading(false);
        return;
      }

      // Insert new entry
      const { error: insertError } = await supabase
        .from('salam_entries')
        .insert({
          user_id: profile.id,
          name: formData.name,
          identity_number: formData.identity_number,
          phone_number: formData.phone_number,
          sim_number: formData.sim_number,
          device_number: formData.device_number,
          nationality: formData.nationality,
          register_number: formData.register_number,
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess('تم حفظ البيانات بنجاح');
      setFormData({
        name: '',
        identity_number: '',
        phone_number: '',
        sim_number: '',
        device_number: '',
        nationality: '',
        register_number: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Header user={authUser} showBackButton backHref="/dashboard" />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">مشروع سلام</h1>
              <p className="text-muted">إدخال بيانات العميل</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {error && (
            <Alert variant="error" className="mb-6">
              <AlertCircle className="w-4 h-4" />
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-6">
              <CheckCircle className="w-4 h-4" />
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              name="name"
              label="الإسم"
              placeholder="أدخل الإسم الكامل"
              value={formData.name}
              onChange={handleChange}
              icon={<User className="w-5 h-5" />}
              required
            />

            <Input
              type="text"
              name="identity_number"
              label="رقم الهوية"
              placeholder="أدخل رقم الهوية"
              value={formData.identity_number}
              onChange={handleChange}
              icon={<CreditCard className="w-5 h-5" />}
              required
            />

            <Input
              type="tel"
              name="phone_number"
              label="رقم الجوال"
              placeholder="أدخل رقم الجوال"
              value={formData.phone_number}
              onChange={handleChange}
              icon={<Phone className="w-5 h-5" />}
              required
            />

            <Input
              type="text"
              name="sim_number"
              label="رقم الشريحة"
              placeholder="أدخل رقم الشريحة"
              value={formData.sim_number}
              onChange={handleChange}
              icon={<Smartphone className="w-5 h-5" />}
              required
            />

            <Input
              type="text"
              name="device_number"
              label="رقم الجهاز"
              placeholder="أدخل رقم الجهاز"
              value={formData.device_number}
              onChange={handleChange}
              icon={<Hash className="w-5 h-5" />}
              required
            />

            <Input
              type="text"
              name="nationality"
              label="الجنسية"
              placeholder="أدخل الجنسية"
              value={formData.nationality}
              onChange={handleChange}
              icon={<Globe className="w-5 h-5" />}
              required
            />

            <Input
              type="text"
              name="register_number"
              label="سجل"
              placeholder="أدخل رقم السجل"
              value={formData.register_number}
              onChange={handleChange}
              icon={<FileText className="w-5 h-5" />}
              required
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                حفظ البيانات
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard')}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
