'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Smartphone,
  Settings,
  Users,
  Search,
  Trash2,
  Shield,
  ArrowRight,
  X,
  UserPlus,
  Lock,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRealtimeSalamCustomers, useRealtimeMobilyCustomers } from '@/hooks/useRealtimeCustomers';
import { useRealtimeProfiles } from '@/hooks/useRealtimeProfiles';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';
import type { Profile, UserRole, UserStatus, SalamCustomer, MobilyCustomer } from '@/types/database';

interface CustomerWithProfile extends SalamCustomer {
  profiles?: {
    username: string | null;
    full_name: string | null;
    email: string;
  } | null;
}

interface MobilyCustomerWithProfile extends MobilyCustomer {
  profiles?: {
    username: string | null;
    full_name: string | null;
    email: string;
  } | null;
}

interface AdminClientProps {
  currentProfile: Profile;
  profiles: Profile[];
  salamCustomers: CustomerWithProfile[];
  mobilyCustomers: MobilyCustomerWithProfile[];
  stats: {
    salamCount: number;
    mobilyCount: number;
    salamDailyCount: number;
    mobilyDailyCount: number;
  };
}

type ActiveView = 'dashboard' | 'salam' | 'mobily' | 'settings';

export function AdminClient({
  currentProfile,
  profiles: initialProfiles,
  salamCustomers: initialSalamCustomers,
  mobilyCustomers: initialMobilyCustomers,
  stats,
}: AdminClientProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Real-time subscriptions for all data
  const { profiles, isConnected: profilesConnected } = useRealtimeProfiles(initialProfiles);
  const { customers: salamCustomers, isConnected: salamConnected } = useRealtimeSalamCustomers(initialSalamCustomers || []);
  const { customers: mobilyCustomers, isConnected: mobilyConnected } = useRealtimeMobilyCustomers(initialMobilyCustomers || []);
  const realtimeStats = useRealtimeStats(stats);

  // User Management Filters
  const [usernameFilter, setUsernameFilter] = useState('');
  const [supervisorFilter, setSupervisorFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [creationDateFilter, setCreationDateFilter] = useState('');

  // Salam Customer Search
  const [salamSearchQuery, setSalamSearchQuery] = useState('');

  // Mobily Customer Search
  const [mobilySearchQuery, setMobilySearchQuery] = useState('');

  // Debug logging
  console.log('AdminClient received data:', {
    salamCustomersCount: salamCustomers?.length || 0,
    mobilyCustomersCount: mobilyCustomers?.length || 0,
    profilesCount: profiles?.length || 0,
    stats,
    currentUserRole: currentProfile?.role,
    salamSample: salamCustomers?.[0] || 'No data',
    mobilySample: mobilyCustomers?.[0] || 'No data',
  });

  // User Management States
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    supervisor_name: '',
    password: '',
    role: 'user' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const authUser = {
    id: currentProfile.id,
    email: currentProfile.email,
    fullName: currentProfile.full_name,
    username: currentProfile.username,
    avatarUrl: currentProfile.avatar_url,
    role: currentProfile.role,
    isAdmin: true,
    isSuperAdmin: currentProfile.role === 'super_admin',
  };

  // Memoized date formatter for better performance
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }, []);

  // Memoized filtered customers for better performance
  const filteredSalamCustomers = useMemo(() => salamCustomers.filter(customer => {
    if (!salamSearchQuery) return true;

    const query = salamSearchQuery.toLowerCase();
    const searchableFields = [
      customer.name,
      customer.created_by_username || '',
      customer.identity_number,
      customer.phone_number,
      customer.sim_number,
      customer.device_number,
      customer.nationality,
      customer.register_number,
      formatDate(customer.created_at),
    ];

    return searchableFields.some(field =>
      field.toLowerCase().includes(query)
    );
  }), [salamCustomers, salamSearchQuery]);

  // Memoized filtered Mobily customers
  const filteredMobilyCustomers = useMemo(() => mobilyCustomers.filter(customer => {
    if (!mobilySearchQuery) return true;

    const query = mobilySearchQuery.toLowerCase();
    const searchableFields = [
      customer.name,
      customer.created_by_username || '',
      customer.identity_number,
      customer.nationality,
      customer.phone_number,
      customer.sim_number,
      customer.device_number,
      customer.register_number,
      customer.birth_date || '',
      customer.identity_expiry_date || '',
      customer.package || '',
      customer.email || '',
      customer.city || '',
      customer.district || '',
      formatDate(customer.created_at),
    ];

    return searchableFields.some(field =>
      field.toLowerCase().includes(query)
    );
  }), [mobilyCustomers, mobilySearchQuery]);

  // Memoized filtered profiles
  const filteredProfiles = useMemo(() => profiles.filter(profile => {
    // Username filter
    const matchesUsername = !usernameFilter ||
      (profile.username?.toLowerCase() || '').includes(usernameFilter.toLowerCase());

    // Supervisor filter
    const matchesSupervisor = !supervisorFilter ||
      (profile.supervisor_name?.toLowerCase() || '').includes(supervisorFilter.toLowerCase());

    // Role filter
    const matchesRole = !roleFilter || profile.role === roleFilter;

    // Status filter
    const matchesStatus = !statusFilter || profile.status === statusFilter;

    // Creation date filter
    const matchesCreationDate = !creationDateFilter ||
      profile.created_at.startsWith(creationDateFilter);

    // General search filter (searches in username and full name)
    const matchesSearch = !searchQuery ||
      (profile.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (profile.username?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    return matchesUsername && matchesSupervisor && matchesRole &&
           matchesStatus && matchesCreationDate && matchesSearch;
  }), [profiles, usernameFilter, supervisorFilter, roleFilter, statusFilter, creationDateFilter, searchQuery]);

  // Memoized callback for adding users
  const handleAddUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Call server API to create user with admin privileges
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في إنشاء المستخدم');
      }

      setSuccess('تم إضافة المستخدم بنجاح');
      setNewUserData({ username: '', supervisor_name: '', password: '', role: 'user' });
      setShowAddUser(false);
      // Real-time subscription will automatically update the profiles list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  }, [newUserData]);

  // Memoized callback for deleting users
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Real-time subscription will automatically update the profiles list
      setSuccess('تم حذف المستخدم بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
  }, []);

  // Memoized callback for updating user status
  const handleUpdateStatus = useCallback(async (userId: string, status: UserStatus) => {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('profiles')
        .update({ status } as never)
        .eq('id', userId);

      if (error) throw error;

      // Real-time subscription will automatically update the profiles list
      setSuccess('تم تحديث الحالة بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
  }, []);

  // Connection status
  const isFullyConnected = profilesConnected && salamConnected && mobilyConnected;

  return (
    <div className="min-h-screen pb-16">
      <Header user={authUser} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Alerts */}
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

        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
                <p className="text-muted">إدارة النظام والمستخدمين</p>
              </div>
            </div>
            {/* Real-time connection indicator */}
            <div className="flex items-center gap-2 text-sm">
              {isFullyConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-green-500 font-medium">متصل بالوقت الفعلي</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span className="text-amber-500">جاري الاتصال...</span>
                </>
              )}
            </div>
          </div>

          {/* Data Status Warning */}
          {salamCustomers.length === 0 && mobilyCustomers.length === 0 && (
            <Alert variant="warning" className="mt-4">
              <AlertCircle className="w-4 h-4" />
              لا توجد بيانات عملاء في النظام. تأكد من وجود سجلات في قاعدة البيانات وأن لديك صلاحيات المشرف.
            </Alert>
          )}
        </div>

        {/* Stats Cards - Real-time updated */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center relative overflow-hidden">
            <p className="text-3xl font-bold text-foreground">{realtimeStats.salamCount}</p>
            <p className="text-sm text-muted">إجمالي - مشروع سلام</p>
            {salamConnected && <div className="absolute top-2 right-2"><Wifi className="w-3 h-3 text-green-500" /></div>}
          </Card>
          <Card className="p-4 text-center relative overflow-hidden">
            <p className="text-3xl font-bold text-foreground">{realtimeStats.mobilyCount}</p>
            <p className="text-sm text-muted">إجمالي - مشروع موبايلي</p>
            {mobilyConnected && <div className="absolute top-2 right-2"><Wifi className="w-3 h-3 text-blue-500" /></div>}
          </Card>
          <Card className="p-4 text-center relative overflow-hidden">
            <p className="text-3xl font-bold text-green-600">{realtimeStats.salamDailyCount}</p>
            <p className="text-sm text-muted">عدد المستخدمين اليومي - سلام</p>
            {salamConnected && <div className="absolute top-2 right-2"><Wifi className="w-3 h-3 text-green-500" /></div>}
          </Card>
          <Card className="p-4 text-center relative overflow-hidden">
            <p className="text-3xl font-bold text-blue-600">{realtimeStats.mobilyDailyCount}</p>
            <p className="text-sm text-muted">عدد المستخدمين اليومي - موبايلي</p>
            {mobilyConnected && <div className="absolute top-2 right-2"><Wifi className="w-3 h-3 text-blue-500" /></div>}
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => { setActiveView('dashboard'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'dashboard'
                ? 'bg-primary text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => { setActiveView('salam'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeView === 'salam'
                ? 'bg-green-500 text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            <Phone className="w-4 h-4" />
            مشروع سلام
          </button>
          <button
            onClick={() => { setActiveView('mobily'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeView === 'mobily'
                ? 'bg-blue-500 text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            مشروع موبايلي
          </button>
          <button
            onClick={() => { setActiveView('settings'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeView === 'settings'
                ? 'bg-amber-500 text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            <Settings className="w-4 h-4" />
            إدارة المستخدمين
          </button>
        </div>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {/* Salam Project Card */}
            <Card
              hover
              glow
              className="relative min-h-[200px] group cursor-pointer bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30 hover:border-green-500"
              onClick={() => setActiveView('salam')}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Phone className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                مشروع سلام
              </h3>
              <p className="text-sm text-muted">
                عرض بيانات العملاء
              </p>

              <div className="absolute bottom-4 left-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 rotate-180" />
              </div>
            </Card>

            {/* Mobily Project Card */}
            <Card
              hover
              glow
              className="relative min-h-[200px] group cursor-pointer bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500"
              onClick={() => setActiveView('mobily')}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Smartphone className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                مشروع موبايلي
              </h3>
              <p className="text-sm text-muted">
                عرض بيانات العملاء
              </p>

              <div className="absolute bottom-4 left-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 rotate-180" />
              </div>
            </Card>

            {/* Settings Card */}
            <Card
              hover
              glow
              className="relative min-h-[200px] group cursor-pointer bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/30 hover:border-amber-500"
              onClick={() => setActiveView('settings')}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Users className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                إدارة المستخدمين
              </h3>
              <p className="text-sm text-muted">
                إضافة وحذف وتعديل الصلاحيات
              </p>

              <div className="absolute bottom-4 left-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 rotate-180" />
              </div>
            </Card>
          </div>
        )}

        {/* Salam List View */}
        {activeView === 'salam' && (
          <div className="space-y-6">
            {/* Search Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  placeholder="بحث في جميع الحقول..."
                  value={salamSearchQuery}
                  onChange={(e) => setSalamSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              {salamSearchQuery && (
                <Button
                  variant="secondary"
                  onClick={() => setSalamSearchQuery('')}
                  className="text-sm"
                >
                  مسح
                </Button>
              )}
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card-hover border-b border-card-border">
                    <tr>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإسم</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المدخل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الهوية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجوال</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الشريحة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجهاز</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجنسية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">السجل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalamCustomers.length > 0 ? (
                      filteredSalamCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 text-foreground whitespace-nowrap">{customer.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-600 border border-green-500/30">
                              {customer.created_by_username || customer.profiles?.username || customer.profiles?.full_name || 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.identity_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.phone_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.sim_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.device_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.nationality}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.register_number}</td>
                          <td className="px-4 py-3 text-muted text-sm whitespace-nowrap">{formatDate(customer.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-muted">
                          لا توجد نتائج
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Mobily List View */}
        {activeView === 'mobily' && (
          <div className="space-y-6">
            {/* Search Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  placeholder="بحث في جميع الحقول..."
                  value={mobilySearchQuery}
                  onChange={(e) => setMobilySearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              {mobilySearchQuery && (
                <Button
                  variant="secondary"
                  onClick={() => setMobilySearchQuery('')}
                  className="text-sm"
                >
                  مسح
                </Button>
              )}
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card-hover border-b border-card-border">
                    <tr>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإسم</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المدخل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الهوية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجنسية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجوال</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الشريحة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجهاز</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">السجل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">تاريخ الميلاد</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">انتهاء الهوية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الباقة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإيميل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المدينة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الحي</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMobilyCustomers.length > 0 ? (
                      filteredMobilyCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 text-foreground whitespace-nowrap">{customer.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 border border-blue-500/30">
                              {customer.created_by_username || customer.profiles?.username || customer.profiles?.full_name || 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.identity_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.nationality}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.phone_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.sim_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.device_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.register_number}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.birth_date}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.identity_expiry_date}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.package}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.email}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.city}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.district}</td>
                          <td className="px-4 py-3 text-muted text-sm whitespace-nowrap">{formatDate(customer.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={15} className="px-4 py-8 text-center text-muted">
                          لا توجد نتائج
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Settings / User Management View */}
        {activeView === 'settings' && (
          <div className="space-y-6">
            {/* Header and Add User */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو إسم المستخدم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <Button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                إضافة مستخدم
              </Button>
            </div>

            {/* Advanced Filters */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">تصفية متقدمة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Username Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-muted">إسم المستخدم</label>
                  <input
                    type="text"
                    placeholder="إسم المستخدم"
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Supervisor Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-muted">إسم المشرف</label>
                  <input
                    type="text"
                    placeholder="إسم المشرف"
                    value={supervisorFilter}
                    onChange={(e) => setSupervisorFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Role Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-muted">الدور</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-card border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">الكل</option>
                    <option value="user">مستخدم</option>
                    <option value="admin">مشرف</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-muted">الحالة</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-card border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">الكل</option>
                    <option value="active">مفعل</option>
                    <option value="inactive">غير مفعل</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>

                {/* Creation Date Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-muted">تاريخ الإنشاء</label>
                  <input
                    type="date"
                    value={creationDateFilter}
                    onChange={(e) => setCreationDateFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-card border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {(usernameFilter || supervisorFilter || roleFilter || statusFilter || creationDateFilter) && (
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setUsernameFilter('');
                      setSupervisorFilter('');
                      setRoleFilter('');
                      setStatusFilter('');
                      setCreationDateFilter('');
                    }}
                    className="text-sm"
                  >
                    مسح جميع الفلاتر
                  </Button>
                </div>
              )}
            </Card>

            {/* Add User Modal */}
            {showAddUser && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">إضافة مستخدم جديد</h3>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="text-muted hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <Input
                    type="text"
                    label="إسم المستخدم"
                    placeholder="أدخل إسم المستخدم"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                    icon={<User className="w-5 h-5" />}
                    required
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      البريد الإلكتروني
                    </label>
                    <div className="px-4 py-2.5 bg-card border border-card-border rounded-lg text-muted">
                      {newUserData.username ? `${newUserData.username}@retaam.app` : 'سيتم توليده تلقائياً...'}
                    </div>
                    <p className="text-xs text-muted">سيتم توليد البريد الإلكتروني تلقائياً بناءً على إسم المستخدم</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      دور المستخدم
                    </label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full px-4 py-2.5 bg-card border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                      required
                    >
                      <option value="user">مستخدم</option>
                      <option value="admin">مشرف</option>
                    </select>
                  </div>
                  <Input
                    type="text"
                    label="إسم المشرف"
                    placeholder="أدخل إسم المشرف"
                    value={newUserData.supervisor_name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, supervisor_name: e.target.value }))}
                    icon={<User className="w-5 h-5" />}
                  />
                  <Input
                    type="password"
                    label="كلمة المرور"
                    placeholder="أدخل كلمة المرور (8 أحرف على الأقل)"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    icon={<Lock className="w-5 h-5" />}
                    required
                    minLength={8}
                  />
                  <div className="flex gap-4 pt-4">
                    <Button type="submit" isLoading={isLoading}>
                      إضافة المستخدم
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowAddUser(false)}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Users Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card-hover border-b border-card-border">
                    <tr>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">إسم المستخدم</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">إسم المشرف</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الدور</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الحالة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">تاريخ الإنشاء</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.length > 0 ? (
                      filteredProfiles.map((profile) => (
                        <tr key={profile.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 text-foreground">{profile.username || '-'}</td>
                          <td className="px-4 py-3 text-muted">{profile.supervisor_name || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={profile.role === 'admin' ? 'warning' : 'default'}>
                              {profile.role === 'admin' ? 'مشرف' : 'مستخدم'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={profile.status}
                              onChange={(e) => handleUpdateStatus(profile.id, e.target.value as UserStatus)}
                              className="px-3 py-1 bg-card border border-card-border rounded text-sm text-foreground focus:outline-none focus:border-primary"
                              disabled={profile.id === currentProfile.id}
                            >
                              <option value="active">مفعل</option>
                              <option value="inactive">غير مفعل</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-muted text-sm">{formatDate(profile.created_at)}</td>
                          <td className="px-4 py-3">
                            {profile.id !== currentProfile.id && (
                              <button
                                onClick={() => handleDeleteUser(profile.id)}
                                className="text-error hover:text-error/80 transition-colors"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted">
                          لا توجد نتائج
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
