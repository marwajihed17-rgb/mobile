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
  Calendar,
  Mail,
  Package,
  MapPin,
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { CalendarDatePicker, type CalendarType } from '@/components/ui/calendar-date-picker';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface MobilyFormClientProps {
  profile: Profile;
}

export function MobilyFormClient({ profile }: MobilyFormClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [simError, setSimError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    identity_number: '',
    nationality: '',
    phone_number: '',
    birth_date: '',
    birth_date_calendar_type: 'gregorian' as CalendarType,
    identity_expiry_date: '',
    package: '',
    email: '',
    sim_number: '',
    device_number: '',
    city: '',
    district: '',
    register_number: '',
  });

  const authUser = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
    isSuperAdmin: profile.role === 'super_admin',
  };

  // Validate identity number uniqueness
  const validateIdentityNumber = async (value: string) => {
    if (!value.trim()) {
      setIdentityError('');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: existing, error: checkError } = await supabase
        .from('mobily_customers')
        .select('id')
        .eq('identity_number', value.trim())
        .maybeSingle();

      if (checkError) {
        console.error('Error checking identity number:', checkError);
        return;
      }

      if (existing) {
        setIdentityError('رقم الهوية مستخدم مسبقاً. الرجاء إدخال رقم آخر.');
      } else {
        setIdentityError('');
      }
    } catch (err) {
      console.error('Unexpected error validating identity:', err);
    }
  };

  // Validate SIM number uniqueness
  const validateSimNumber = async (value: string) => {
    if (!value.trim()) {
      setSimError('');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: existing, error: checkError } = await supabase
        .from('mobily_customers')
        .select('id')
        .eq('sim_number', value.trim())
        .maybeSingle();

      if (checkError) {
        console.error('Error checking SIM number:', checkError);
        return;
      }

      if (existing) {
        setSimError('رقم الشريحة مستخدم مسبقاً. الرجاء إدخال رقم آخر.');
      } else {
        setSimError('');
      }
    } catch (err) {
      console.error('Unexpected error validating SIM:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');

    // Clear field-specific errors when user types
    if (name === 'identity_number') {
      setIdentityError('');
    } else if (name === 'sim_number') {
      setSimError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseClient();

      // Validate all required fields
      if (!formData.name || !formData.identity_number || !formData.nationality ||
          !formData.phone_number || !formData.birth_date || !formData.identity_expiry_date ||
          !formData.package || !formData.email || !formData.sim_number ||
          !formData.device_number || !formData.city || !formData.district ||
          !formData.register_number) {
        setError('يرجى ملء جميع الحقول المطلوبة');
        setIsLoading(false);
        return;
      }

      // Final validation check for identity number
      const { data: existingIdentity, error: identityCheckError } = await supabase
        .from('mobily_customers')
        .select('id')
        .eq('identity_number', formData.identity_number.trim())
        .maybeSingle();

      if (identityCheckError) {
        console.error('Error checking identity number:', identityCheckError);
        setError('حدث خطأ أثناء التحقق من البيانات');
        setIsLoading(false);
        return;
      }

      if (existingIdentity) {
        setIdentityError('رقم الهوية مستخدم مسبقاً. الرجاء إدخال رقم آخر.');
        setError('رقم الهوية مستخدم مسبقاً');
        setIsLoading(false);
        return;
      }

      // Final validation check for SIM number
      const { data: existingSim, error: simCheckError } = await supabase
        .from('mobily_customers')
        .select('id')
        .eq('sim_number', formData.sim_number.trim())
        .maybeSingle();

      if (simCheckError) {
        console.error('Error checking SIM number:', simCheckError);
        setError('حدث خطأ أثناء التحقق من البيانات');
        setIsLoading(false);
        return;
      }

      if (existingSim) {
        setSimError('رقم الشريحة مستخدم مسبقاً. الرجاء إدخال رقم آخر.');
        setError('رقم الشريحة مستخدم مسبقاً');
        setIsLoading(false);
        return;
      }

      // Insert new mobily customer entry
      const { error: insertError } = await supabase
        .from('mobily_customers')
        .insert({
          user_id: profile.id,
          created_by_username: profile.username,
          name: formData.name.trim(),
          identity_number: formData.identity_number.trim(),
          phone_number: formData.phone_number.trim(),
          sim_number: formData.sim_number.trim(),
          device_number: formData.device_number.trim(),
          nationality: formData.nationality.trim(),
          register_number: formData.register_number.trim(),
          birth_date: formData.birth_date,
          birth_date_calendar_type: formData.birth_date_calendar_type,
          identity_expiry_date: formData.identity_expiry_date,
          package: formData.package.trim(),
          email: formData.email.trim(),
          city: formData.city.trim(),
          district: formData.district.trim(),
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        if (insertError.code === '23505') {
          // Unique constraint violation
          if (insertError.message.includes('identity_number')) {
            setIdentityError('رقم الهوية مستخدم مسبقاً. الرجاء إدخال رقم آخر.');
            setError('رقم الهوية مسجل مسبقاً في النظام');
          } else if (insertError.message.includes('sim_number')) {
            setSimError('رقم الشريحة مستخدم مسبقاً. الرجاء إدخال رقم آخر.');
            setError('رقم الشريحة مسجل مسبقاً في النظام');
          } else {
            setError('البيانات المدخلة مسجلة مسبقاً في النظام');
          }
        } else if (insertError.code === '23503') {
          setError('خطأ في الاتصال بقاعدة البيانات - يرجى المحاولة مرة أخرى');
        } else {
          setError(`خطأ في الحفظ: ${insertError.message}`);
        }
        setIsLoading(false);
        return;
      }

      setSuccess('تم حفظ البيانات بنجاح ✓');
      setFormData({
        name: '',
        identity_number: '',
        nationality: '',
        phone_number: '',
        birth_date: '',
        birth_date_calendar_type: 'gregorian',
        identity_expiry_date: '',
        package: '',
        email: '',
        sim_number: '',
        device_number: '',
        city: '',
        district: '',
        register_number: '',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err instanceof Error ? `خطأ: ${err.message}` : 'حدث خطأ غير متوقع أثناء الحفظ');
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
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">مشروع موبايلي</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onBlur={(e) => validateIdentityNumber(e.target.value)}
                icon={<CreditCard className="w-5 h-5" />}
                error={identityError}
                required
                dir="rtl"
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
                type="tel"
                name="phone_number"
                label="رقم الجوال"
                placeholder="أدخل رقم الجوال"
                value={formData.phone_number}
                onChange={handleChange}
                icon={<Phone className="w-5 h-5" />}
                required
                dir="rtl"
              />

              <CalendarDatePicker
                name="birth_date"
                label="تاريخ الميلاد"
                value={formData.birth_date}
                calendarType={formData.birth_date_calendar_type}
                onChange={(value) => setFormData(prev => ({ ...prev, birth_date: value }))}
                onCalendarTypeChange={(type) => setFormData(prev => ({ ...prev, birth_date_calendar_type: type }))}
                required
              />

              <Input
                type="date"
                name="identity_expiry_date"
                label="تاريخ انتهاء الهوية"
                placeholder="أدخل تاريخ انتهاء الهوية"
                value={formData.identity_expiry_date}
                onChange={handleChange}
                icon={<Calendar className="w-5 h-5" />}
                required
                dir="ltr"
              />

              <Input
                type="text"
                name="package"
                label="الباقة"
                placeholder="أدخل الباقة"
                value={formData.package}
                onChange={handleChange}
                icon={<Package className="w-5 h-5" />}
                required
              />

              <Input
                type="email"
                name="email"
                label="الإيميل"
                placeholder="أدخل البريد الإلكتروني"
                value={formData.email}
                onChange={handleChange}
                icon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                type="text"
                name="sim_number"
                label="الشريحة"
                placeholder="أدخل رقم الشريحة"
                value={formData.sim_number}
                onChange={handleChange}
                onBlur={(e) => validateSimNumber(e.target.value)}
                icon={<Smartphone className="w-5 h-5" />}
                error={simError}
                required
                dir="rtl"
              />

              <Input
                type="text"
                name="device_number"
                label="الجهاز"
                placeholder="أدخل رقم الجهاز"
                value={formData.device_number}
                onChange={handleChange}
                icon={<Hash className="w-5 h-5" />}
                required
              />

              <Input
                type="text"
                name="city"
                label="المدينة"
                placeholder="أدخل المدينة"
                value={formData.city}
                onChange={handleChange}
                icon={<Building className="w-5 h-5" />}
                required
              />

              <Input
                type="text"
                name="district"
                label="الحي"
                placeholder="أدخل الحي"
                value={formData.district}
                onChange={handleChange}
                icon={<MapPin className="w-5 h-5" />}
                required
              />
            </div>

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
