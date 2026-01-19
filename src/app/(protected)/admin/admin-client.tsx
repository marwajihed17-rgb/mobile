'use client';

import { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Profile, UserRole, UserStatus } from '@/types/database';

interface Customer {
  id: string;
  user_id: string;
  created_by_username: string | null;
  name: string;
  identity_number: string;
  phone_number: string;
  sim_number: string;
  device_number: string;
  nationality: string;
  register_number: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    full_name: string | null;
    email: string;
  } | null;
}

interface MobilyCustomer extends Customer {
  birth_date: string;
  identity_expiry_date: string;
  package: string;
  email: string;
  city: string;
  district: string;
}

interface AdminClientProps {
  currentProfile: Profile;
  profiles: Profile[];
  salamCustomers: Customer[];
  mobilyCustomers: MobilyCustomer[];
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
  const [profiles, setProfiles] = useState(initialProfiles);
  const [salamCustomers, setSalamCustomers] = useState(initialSalamCustomers);
  const [mobilyCustomers, setMobilyCustomers] = useState(initialMobilyCustomers);
  const [statsData, setStatsData] = useState(stats);

  // User Management States
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    supervisor_name: '',
    password: '',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // Filter customers based on search and date
  const filterCustomers = <T extends Customer>(customers: T[]): T[] => {
    return customers.filter(customer => {
      // Search filter
      const matchesSearch = !searchQuery ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.identity_number.includes(searchQuery) ||
        customer.phone_number.includes(searchQuery);

      // Date filter
      const matchesDate = !dateFilter ||
        customer.created_at.startsWith(dateFilter);

      return matchesSearch && matchesDate;
    });
  };

  const filteredSalamCustomers = filterCustomers(salamCustomers);
  const filteredMobilyCustomers = filterCustomers(mobilyCustomers);

  const filteredProfiles = profiles.filter(profile =>
    (profile.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseClient();

      // Generate email from username for authentication
      const email = `${newUserData.username.toLowerCase().replace(/\s+/g, '_')}@system.local`;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: newUserData.password,
        options: {
          data: {
            username: newUserData.username,
            supervisor_name: newUserData.supervisor_name,
          },
        },
      });

      if (authError) throw authError;

      setSuccess('تم إضافة المستخدم بنجاح');
      setNewUserData({ username: '', supervisor_name: '', password: '' });
      setShowAddUser(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== userId));
      setSuccess('تم حذف المستخدم بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
  };

  // Update user status
  const handleUpdateStatus = async (userId: string, status: UserStatus) => {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('profiles')
        .update({ status } as never)
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p =>
        p.id === userId ? { ...p, status } : p
      ) as Profile[]);
      setSuccess('تم تحديث الحالة بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
  };

  // Set up real-time subscriptions for all data
  useEffect(() => {
    const supabase = getSupabaseClient();

    // Function to fetch updated stats
    const fetchStats = async () => {
      try {
        const { count: salamCount } = await supabase
          .from('salam_customers')
          .select('*', { count: 'exact', head: true });

        const { count: mobilyCount } = await supabase
          .from('mobily_customers')
          .select('*', { count: 'exact', head: true });

        const { data: salamDailyData } = await supabase.rpc('get_salam_daily_count');
        const { data: mobilyDailyData } = await supabase.rpc('get_mobily_daily_count');

        setStatsData({
          salamCount: salamCount || 0,
          mobilyCount: mobilyCount || 0,
          salamDailyCount: salamDailyData || 0,
          mobilyDailyCount: mobilyDailyData || 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    // Real-time subscription for Salam customers
    const salamChannel = supabase
      .channel('admin_salam_customers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salam_customers'
        },
        async (payload) => {
          console.log('Admin: Salam customer change detected:', payload);

          if (payload.eventType === 'INSERT') {
            const { data: newCustomer } = await supabase
              .from('salam_customers')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (newCustomer) {
              setSalamCustomers(prev => [newCustomer as Customer, ...prev]);
              fetchStats(); // Update stats
            }
          } else if (payload.eventType === 'DELETE') {
            setSalamCustomers(prev => prev.filter(c => c.id !== payload.old.id));
            fetchStats(); // Update stats
          } else if (payload.eventType === 'UPDATE') {
            setSalamCustomers(prev =>
              prev.map(c => c.id === payload.new.id ? payload.new as Customer : c)
            );
          }
        }
      )
      .subscribe();

    // Real-time subscription for Mobily customers
    const mobilyChannel = supabase
      .channel('admin_mobily_customers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mobily_customers'
        },
        async (payload) => {
          console.log('Admin: Mobily customer change detected:', payload);

          if (payload.eventType === 'INSERT') {
            const { data: newCustomer } = await supabase
              .from('mobily_customers')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (newCustomer) {
              setMobilyCustomers(prev => [newCustomer as MobilyCustomer, ...prev]);
              fetchStats(); // Update stats
            }
          } else if (payload.eventType === 'DELETE') {
            setMobilyCustomers(prev => prev.filter(c => c.id !== payload.old.id));
            fetchStats(); // Update stats
          } else if (payload.eventType === 'UPDATE') {
            setMobilyCustomers(prev =>
              prev.map(c => c.id === payload.new.id ? payload.new as MobilyCustomer : c)
            );
          }
        }
      )
      .subscribe();

    // Real-time subscription for user profiles
    const profilesChannel = supabase
      .channel('admin_profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        async (payload) => {
          console.log('Admin: Profile change detected:', payload);

          if (payload.eventType === 'INSERT') {
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (newProfile) {
              setProfiles(prev => [newProfile as Profile, ...prev]);
            }
          } else if (payload.eventType === 'DELETE') {
            setProfiles(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setProfiles(prev =>
              prev.map(p => p.id === payload.new.id ? payload.new as Profile : p)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(salamChannel);
      supabase.removeChannel(mobilyChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

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
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
              <p className="text-muted">إدارة النظام والمستخدمين</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{statsData.salamCount}</p>
            <p className="text-sm text-muted">إجمالي - مشروع سلام</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{statsData.mobilyCount}</p>
            <p className="text-sm text-muted">إجمالي - مشروع موبايلي</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{statsData.salamDailyCount}</p>
            <p className="text-sm text-muted">عدد المستخدمين اليومي - سلام</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{statsData.mobilyDailyCount}</p>
            <p className="text-sm text-muted">عدد المستخدمين اليومي - موبايلي</p>
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
              <div className="absolute top-4 right-4">
                <Badge variant="success">{statsData.salamCount} سجل</Badge>
              </div>

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
              <div className="absolute top-4 right-4">
                <Badge variant="primary">{statsData.mobilyCount} سجل</Badge>
              </div>

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
              <div className="absolute top-4 right-4">
                <Badge variant="warning">{profiles.length} مستخدم</Badge>
              </div>

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
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو رقم الهوية أو الجوال..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1 max-w-xs">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  placeholder="تصفية حسب التاريخ"
                  className="w-full px-4 py-2 bg-card border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              {dateFilter && (
                <Button
                  variant="secondary"
                  onClick={() => setDateFilter('')}
                  className="self-start"
                >
                  إلغاء الفلتر
                </Button>
              )}
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card-hover border-b border-card-border">
                    <tr>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الإسم</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">رقم الهوية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الجوال</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الشريحة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الجهاز</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الجنسية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">السجل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">المدخل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalamCustomers.length > 0 ? (
                      filteredSalamCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 text-foreground">{customer.name}</td>
                          <td className="px-4 py-3 text-muted">{customer.identity_number}</td>
                          <td className="px-4 py-3 text-muted">{customer.phone_number}</td>
                          <td className="px-4 py-3 text-muted">{customer.sim_number}</td>
                          <td className="px-4 py-3 text-muted">{customer.device_number}</td>
                          <td className="px-4 py-3 text-muted">{customer.nationality}</td>
                          <td className="px-4 py-3 text-muted">{customer.register_number}</td>
                          <td className="px-4 py-3 text-muted">
                            {customer.created_by_username || customer.profiles?.username || customer.profiles?.full_name || 'غير محدد'}
                          </td>
                          <td className="px-4 py-3 text-muted text-sm">{formatDate(customer.created_at)}</td>
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
                  <tfoot className="bg-green-500/10 border-t-2 border-green-500">
                    <tr>
                      <td colSpan={9} className="px-4 py-4">
                        <div className="flex justify-center items-center gap-3">
                          <span className="text-lg font-bold text-green-600">إجمالي – مشروع سلام:</span>
                          <span className="text-2xl font-bold text-green-700">{statsData.salamCount}</span>
                          <span className="text-sm text-muted">عميل</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Mobily List View */}
        {activeView === 'mobily' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو رقم الهوية أو الجوال..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1 max-w-xs">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  placeholder="تصفية حسب التاريخ"
                  className="w-full px-4 py-2 bg-card border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              {dateFilter && (
                <Button
                  variant="secondary"
                  onClick={() => setDateFilter('')}
                  className="self-start"
                >
                  إلغاء الفلتر
                </Button>
              )}
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card-hover border-b border-card-border">
                    <tr>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الإسم</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">رقم الهوية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الجنسية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الجوال</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">تاريخ الميلاد</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">انتهاء الهوية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الباقة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الإيميل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">المدينة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">المدخل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMobilyCustomers.length > 0 ? (
                      filteredMobilyCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 text-foreground">{customer.name}</td>
                          <td className="px-4 py-3 text-muted">{customer.identity_number}</td>
                          <td className="px-4 py-3 text-muted">{customer.nationality}</td>
                          <td className="px-4 py-3 text-muted">{customer.phone_number}</td>
                          <td className="px-4 py-3 text-muted">{customer.birth_date}</td>
                          <td className="px-4 py-3 text-muted">{customer.identity_expiry_date}</td>
                          <td className="px-4 py-3 text-muted">{customer.package}</td>
                          <td className="px-4 py-3 text-muted">{customer.email}</td>
                          <td className="px-4 py-3 text-muted">{customer.city}</td>
                          <td className="px-4 py-3 text-muted">
                            {customer.created_by_username || customer.profiles?.username || customer.profiles?.full_name || 'غير محدد'}
                          </td>
                          <td className="px-4 py-3 text-muted text-sm">{formatDate(customer.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-muted">
                          لا توجد نتائج
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-blue-500/10 border-t-2 border-blue-500">
                    <tr>
                      <td colSpan={11} className="px-4 py-4">
                        <div className="flex justify-center items-center gap-3">
                          <span className="text-lg font-bold text-blue-600">إجمالي – مشروع موبايلي:</span>
                          <span className="text-2xl font-bold text-blue-700">{statsData.mobilyCount}</span>
                          <span className="text-sm text-muted">عميل</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
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
                  placeholder="بحث بالاسم أو البريد الإلكتروني..."
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
                  <Input
                    type="text"
                    label="إسم المشرف"
                    placeholder="أدخل إسم المشرف"
                    value={newUserData.supervisor_name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, supervisor_name: e.target.value }))}
                    icon={<User className="w-5 h-5" />}
                    required
                  />
                  <Input
                    type="password"
                    label="كلمة المرور"
                    placeholder="أدخل كلمة المرور"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    icon={<Lock className="w-5 h-5" />}
                    required
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
                        <td colSpan={5} className="px-4 py-8 text-center text-muted">
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
