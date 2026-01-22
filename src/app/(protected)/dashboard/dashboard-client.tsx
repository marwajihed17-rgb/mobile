'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Smartphone, List, Trash2, Edit, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRealtimeSalamCustomers, useRealtimeMobilyCustomers } from '@/hooks/useRealtimeCustomers';
import type { Profile, SalamCustomer, MobilyCustomer } from '@/types/database';

interface DashboardClientProps {
  profile: Profile;
  recentSalamCustomers: SalamCustomer[];
  recentMobilyCustomers: MobilyCustomer[];
}

export function DashboardClient({ profile, recentSalamCustomers, recentMobilyCustomers }: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'projects' | 'recent'>('projects');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Real-time subscriptions for both customer tables
  const { customers: salamCustomers, isConnected: salamConnected } = useRealtimeSalamCustomers(recentSalamCustomers);
  const { customers: mobilyCustomers, isConnected: mobilyConnected } = useRealtimeMobilyCustomers(recentMobilyCustomers);

  // Show only the 5 most recent customers
  const recentSalam = useMemo(() => salamCustomers.slice(0, 5), [salamCustomers]);
  const recentMobily = useMemo(() => mobilyCustomers.slice(0, 5), [mobilyCustomers]);

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

  const displayName = profile.username || profile.email.split('@')[0];

  // Memoized date formatter
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Optimistic delete with real-time sync
  const handleDeleteCustomer = useCallback(async (customerId: string, customerName: string, projectType: 'salam' | 'mobily') => {
    if (!confirm(`هل أنت متأكد من حذف ${customerName}؟`)) {
      return;
    }

    setIsDeleting(customerId);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseClient();
      const tableName = projectType === 'salam' ? 'salam_customers' : 'mobily_customers';

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', customerId);

      if (deleteError) {
        throw deleteError;
      }

      // Real-time subscription will automatically update the list
      setSuccess('تم حذف العميل بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? `خطأ: ${err.message}` : 'حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(null);
    }
  }, []);

  // Connection status indicator
  const isFullyConnected = salamConnected && mobilyConnected;

  return (
    <div className="min-h-screen pb-16">
      <Header user={authUser} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-2">مرحباً بك،</p>
              <h1 className="text-3xl font-bold text-foreground mb-2">اختر المشروع</h1>
              <p className="text-muted">اختر مشروعاً لإدخال البيانات</p>
            </div>
            {/* Real-time connection indicator */}
            <div className="flex items-center gap-2 text-sm">
              {isFullyConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500">جاري الاتصال...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'projects'
                ? 'bg-primary text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            المشاريع
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'recent'
                ? 'bg-primary text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            <List className="w-4 h-4" />
            الإدخالات الأخيرة
          </button>
        </div>

        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
            {/* Salam Project Button */}
            <Card
              hover
              glow
              className="relative min-h-[240px] group cursor-pointer bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30 hover:border-green-500"
              onClick={() => router.push('/salam')}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Phone className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                مشروع سلام
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                إدخال بيانات عملاء مشروع سلام
              </p>

              <div className="absolute bottom-4 text-muted opacity-0 group-hover:opacity-100 transition-all" style={{ insetInlineEnd: '1rem' }}>
                <ArrowLeft className="w-6 h-6" />
              </div>
            </Card>

            {/* Mobily Project Button */}
            <Card
              hover
              glow
              className="relative min-h-[240px] group cursor-pointer bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500"
              onClick={() => router.push('/mobily')}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Smartphone className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                مشروع موبايلي
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                إدخال بيانات عملاء مشروع موبايلي
              </p>

              <div className="absolute bottom-4 text-muted opacity-0 group-hover:opacity-100 transition-all" style={{ insetInlineEnd: '1rem' }}>
                <ArrowLeft className="w-6 h-6" />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-6">
            {/* Success/Error Messages */}
            {error && (
              <Alert variant="error">
                <AlertCircle className="w-4 h-4" />
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                <AlertCircle className="w-4 h-4" />
                {success}
              </Alert>
            )}

            {/* Recent Salam Customers */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                آخر 5 عملاء - مشروع سلام
                {salamConnected && (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    مباشر
                  </span>
                )}
              </h2>
              {recentSalam.length > 0 ? (
                <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-card-hover border-b border-card-border">
                        <tr>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإسم</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الهوية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجنسية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الجوال</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الشريحة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الجهاز</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم السجل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">التاريخ</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSalam.map((customer) => (
                          <tr key={customer.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                            <td className="px-4 py-3 text-foreground whitespace-nowrap">{customer.name}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.identity_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.nationality}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.phone_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.sim_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.device_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.register_number}</td>
                            <td className="px-4 py-3 text-muted text-sm whitespace-nowrap">{formatDate(customer.created_at)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteCustomer(customer.id, customer.name, 'salam')}
                                  disabled={isDeleting === customer.id}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <Card className="text-center py-8">
                  <p className="text-muted">لا توجد إدخالات حتى الآن</p>
                </Card>
              )}
            </div>

            {/* Recent Mobily Customers */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                آخر 5 عملاء - مشروع موبايلي
                {mobilyConnected && (
                  <span className="text-xs text-blue-500 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    مباشر
                  </span>
                )}
              </h2>
              {recentMobily.length > 0 ? (
                <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-card-hover border-b border-card-border">
                        <tr>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإسم</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الهوية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجنسية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الجوال</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">تاريخ الميلاد</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">انتهاء الهوية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الباقة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإيميل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الشريحة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الجهاز</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المدينة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الحي</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم السجل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">التاريخ</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentMobily.map((customer) => (
                          <tr key={customer.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                            <td className="px-4 py-3 text-foreground whitespace-nowrap">{customer.name}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.identity_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.nationality}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.phone_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.birth_date}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.identity_expiry_date}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.package}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.email}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.sim_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.device_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.city}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.district}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.register_number}</td>
                            <td className="px-4 py-3 text-muted text-sm whitespace-nowrap">{formatDate(customer.created_at)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteCustomer(customer.id, customer.name, 'mobily')}
                                  disabled={isDeleting === customer.id}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <Card className="text-center py-8">
                  <p className="text-muted">لا توجد إدخالات حتى الآن</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
