'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
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
  Wifi,
  WifiOff,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';
import { scrollToTop } from '@/utils/scroll';
import { useRealtimeSalamCustomers, useRealtimeMobilyCustomers } from '@/hooks/useRealtimeCustomers';
import { useRealtimeProfiles } from '@/hooks/useRealtimeProfiles';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';
import type { Profile, UserRole, UserStatus, SalamCustomer, MobilyCustomer } from '@/types/database';

interface CustomerWithProfile extends SalamCustomer {
  profiles?: {
    username: string | null;
    full_name: string | null;
    email: string;
    supervisor_name: string | null;
  } | null;
}

interface MobilyCustomerWithProfile extends MobilyCustomer {
  profiles?: {
    username: string | null;
    full_name: string | null;
    email: string;
    supervisor_name: string | null;
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
    salamTotalWithBaseline: number;
    mobilyTotalWithBaseline: number;
    salamBaseline: number;
    mobilyBaseline: number;
  };
}

type ActiveView = 'dashboard' | 'salam' | 'mobily' | 'statistics' | 'settings';

interface SupervisorSummary {
  date: string;
  supervisor: string;
  dailyTotal: number;
  overallTotal: number;
}

interface UserSummary {
  date: string;
  username: string;
  supervisor: string;
  dailyTotal: number;
  overallTotal: number;
}

type StatisticsModalType = 'supervisor' | 'user' | null;

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
  // Admin sees all customers (isAdmin=true)
  const { profiles, isConnected: profilesConnected } = useRealtimeProfiles(initialProfiles);
  const { customers: salamCustomers, isConnected: salamConnected } = useRealtimeSalamCustomers(initialSalamCustomers || [], currentProfile.id, true);
  const { customers: mobilyCustomers, isConnected: mobilyConnected } = useRealtimeMobilyCustomers(initialMobilyCustomers || [], currentProfile.id, true);
  const realtimeStats = useRealtimeStats(stats);

  // User Management Filters
  const [usernameFilter, setUsernameFilter] = useState('');
  const [supervisorFilter, setSupervisorFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [creationDateFilter, setCreationDateFilter] = useState('');

  // Salam Customer Search
  const [salamSearchQuery, setSalamSearchQuery] = useState('');

  // Mobily Customer Search
  const [mobilySearchQuery, setMobilySearchQuery] = useState('');

  // Statistics View States
  const [statisticsModal, setStatisticsModal] = useState<StatisticsModalType>(null);
  const [statsSearchQuery, setStatsSearchQuery] = useState('');

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
  const addUserFormRef = useRef<HTMLDivElement>(null);


  const authUser = {
    id: currentProfile.id,
    email: currentProfile.email,
    fullName: currentProfile.full_name,
    username: currentProfile.username,
    avatarUrl: currentProfile.avatar_url,
    role: currentProfile.role,
    isAdmin: true,
    isSuperAdmin: currentProfile.role === 'super_admin',
    isOperator: currentProfile.role === 'operator',
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

  // Get date only (without time) for grouping
  const getDateOnly = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  // Combine all customers for statistics with correct supervisor mapping
  const allCustomers = useMemo(() => {
    const salam = (salamCustomers || []).map(c => ({
      ...c,
      project: 'salam' as const,
      // Get supervisor_name from the user's profile who created this record
      user_supervisor: (c as CustomerWithProfile).profiles?.supervisor_name || null,
    }));
    const mobily = (mobilyCustomers || []).map(c => ({
      ...c,
      project: 'mobily' as const,
      // Get supervisor_name from the user's profile who created this record
      user_supervisor: (c as MobilyCustomerWithProfile).profiles?.supervisor_name || null,
    }));
    return [...salam, ...mobily];
  }, [salamCustomers, mobilyCustomers]);

  // Calculate Supervisor Daily Summary - Shows supervisors and their team's daily totals
  const supervisorSummary = useMemo(() => {
    const summaryMap = new Map<string, { dailyTotals: Map<string, number>; overallTotal: number }>();

    allCustomers.forEach(customer => {
      // Use the supervisor_name from the user's profile (the supervisor of the user who created this record)
      const supervisor = customer.user_supervisor || 'غير محدد';
      const date = getDateOnly(customer.created_at);

      if (!summaryMap.has(supervisor)) {
        summaryMap.set(supervisor, { dailyTotals: new Map(), overallTotal: 0 });
      }

      const supervisorData = summaryMap.get(supervisor)!;
      supervisorData.dailyTotals.set(date, (supervisorData.dailyTotals.get(date) || 0) + 1);
      supervisorData.overallTotal += 1;
    });

    const result: SupervisorSummary[] = [];
    summaryMap.forEach((data, supervisor) => {
      data.dailyTotals.forEach((dailyTotal, date) => {
        result.push({
          date,
          supervisor,
          dailyTotal,
          overallTotal: data.overallTotal,
        });
      });
    });

    result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.supervisor.localeCompare(b.supervisor);
    });

    return result;
  }, [allCustomers, getDateOnly]);

  // Calculate User Daily Summary - Shows users (المدخل) and their supervisors (المشرف)
  const userSummary = useMemo(() => {
    const summaryMap = new Map<string, {
      supervisor: string;
      dailyTotals: Map<string, number>;
      overallTotal: number
    }>();

    allCustomers.forEach(customer => {
      // The user who created the record (المدخل)
      const username = customer.created_by_username || 'غير محدد';
      // The supervisor of that user (المشرف)
      const supervisor = customer.user_supervisor || 'غير محدد';
      const date = getDateOnly(customer.created_at);

      if (!summaryMap.has(username)) {
        summaryMap.set(username, { supervisor, dailyTotals: new Map(), overallTotal: 0 });
      }

      const userData = summaryMap.get(username)!;
      userData.dailyTotals.set(date, (userData.dailyTotals.get(date) || 0) + 1);
      userData.overallTotal += 1;
    });

    const result: UserSummary[] = [];
    summaryMap.forEach((data, username) => {
      data.dailyTotals.forEach((dailyTotal, date) => {
        result.push({
          date,
          username,
          supervisor: data.supervisor,
          dailyTotal,
          overallTotal: data.overallTotal,
        });
      });
    });

    result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.username.localeCompare(b.username);
    });

    return result;
  }, [allCustomers, getDateOnly]);

  // Filter supervisor data
  const filteredSupervisorSummary = useMemo(() => {
    return supervisorSummary.filter(item => {
      const matchesSearch = !statsSearchQuery ||
        item.supervisor.toLowerCase().includes(statsSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [supervisorSummary, statsSearchQuery]);

  // Filter user data
  const filteredUserSummary = useMemo(() => {
    return userSummary.filter(item => {
      const matchesSearch = !statsSearchQuery ||
        item.username.toLowerCase().includes(statsSearchQuery.toLowerCase()) ||
        item.supervisor.toLowerCase().includes(statsSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [userSummary, statsSearchQuery]);

  // Close statistics modal handler
  const closeStatisticsModal = useCallback(() => {
    setStatisticsModal(null);
    setStatsSearchQuery('');
  }, []);

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

    // Creation date filter
    const matchesCreationDate = !creationDateFilter ||
      profile.created_at.startsWith(creationDateFilter);

    // General search filter (searches in username and full name)
    const matchesSearch = !searchQuery ||
      (profile.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (profile.username?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    return matchesUsername && matchesSupervisor && matchesRole &&
           matchesCreationDate && matchesSearch;
  }), [profiles, usernameFilter, supervisorFilter, roleFilter, creationDateFilter, searchQuery]);

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
      // Scroll to top to show success message and new user
      scrollToTop();
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
      // Scroll to top to show success message and updated list
      scrollToTop();
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
      // Scroll to top to show success message and updated status
      scrollToTop();
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
            onClick={() => { setActiveView('statistics'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeView === 'statistics'
                ? 'bg-purple-500 text-white'
                : 'bg-card text-muted hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            الإحصائيات
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
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
                <ArrowRight className="w-5 h-5" />
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
                <ArrowRight className="w-5 h-5" />
              </div>
            </Card>

            {/* Statistics Card */}
            <Card
              hover
              glow
              className="relative min-h-[200px] group cursor-pointer bg-gradient-to-br from-purple-500/10 to-indigo-600/10 border-purple-500/30 hover:border-purple-500"
              onClick={() => setActiveView('statistics')}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                الإحصائيات
              </h3>
              <p className="text-sm text-muted">
                ملخص المشرفين والمستخدمين اليومي
              </p>

              <div className="absolute bottom-4 left-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5" />
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
                <ArrowRight className="w-5 h-5" />
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
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المشغل</th>
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
                          <td className="px-4 py-3 whitespace-nowrap">
                            {customer.operator_name ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                {customer.operator_name}
                              </span>
                            ) : (
                              <span className="text-muted text-sm">-</span>
                            )}
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
                        <td colSpan={10} className="px-4 py-8 text-center text-muted">
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
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المشغل</th>
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
                          <td className="px-4 py-3 whitespace-nowrap">
                            {customer.operator_name ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                {customer.operator_name}
                              </span>
                            ) : (
                              <span className="text-muted text-sm">-</span>
                            )}
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
                        <td colSpan={16} className="px-4 py-8 text-center text-muted">
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

        {/* Statistics View */}
        {activeView === 'statistics' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">جداول الإحصائيات</h2>
                <p className="text-muted">اضغط على أي جدول لعرض التفاصيل الكاملة</p>
              </div>
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Supervisor Daily Summary Card */}
              <Card
                hover
                glow
                className="relative min-h-[180px] group cursor-pointer bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30 hover:border-green-500 transition-all"
                onClick={() => setStatisticsModal('supervisor')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">ملخص المشرف اليومي</h3>
                <p className="text-sm text-muted">اضغط للعرض</p>
                <div className="absolute bottom-4 left-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Card>

              {/* Users Daily Summary Card */}
              <Card
                hover
                glow
                className="relative min-h-[180px] group cursor-pointer bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500 transition-all"
                onClick={() => setStatisticsModal('user')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">ملخص المستخدمين اليومي</h3>
                <p className="text-sm text-muted">اضغط للعرض</p>
                <div className="absolute bottom-4 left-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Card>
            </div>

            {/* Info Alert */}
            <Alert variant="info" className="mt-8">
              <AlertCircle className="w-4 h-4" />
              <span>يتم تحديث البيانات تلقائياً عند إضافة سجلات جديدة. اضغط على أي جدول لعرض التفاصيل والبحث والتصفية.</span>
            </Alert>
          </div>
        )}

        {/* Statistics Modal */}
        {statisticsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeStatisticsModal}
          >
            <div
              className="w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl border border-card-border shadow-2xl overflow-hidden animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-card-border">
                <div className="flex items-center gap-3">
                  {statisticsModal === 'supervisor' && (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">ملخص المشرف اليومي</h2>
                    </>
                  )}
                  {statisticsModal === 'user' && (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">ملخص المستخدمين اليومي</h2>
                    </>
                  )}
                </div>
                <button
                  onClick={closeStatisticsModal}
                  className="p-2 text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Filters */}
                    <div className="flex gap-4 mb-6">
                      <div className="relative w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <input
                          type="text"
                          placeholder="بحث..."
                          value={statsSearchQuery}
                          onChange={(e) => setStatsSearchQuery(e.target.value)}
                          className="w-full pr-10 pl-4 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                      {statsSearchQuery && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setStatsSearchQuery('')}
                        >
                          مسح
                        </Button>
                      )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-card-border">
                      {statisticsModal === 'supervisor' && (
                        <table className="w-full">
                          <thead className="bg-card-hover border-b border-card-border">
                            <tr>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">التاريخ</th>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المشرف</th>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المجموع اليومي</th>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المجموع الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSupervisorSummary.length > 0 ? (
                              filteredSupervisorSummary.map((row, index) => (
                                <tr key={`${row.date}-${row.supervisor}-${index}`} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(row.date)}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-600 border border-green-500/30">
                                      {row.supervisor}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">{row.dailyTotal}</td>
                                  <td className="px-4 py-3 text-muted whitespace-nowrap">{row.overallTotal}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                                  لا توجد نتائج
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}

                      {statisticsModal === 'user' && (
                        <table className="w-full">
                          <thead className="bg-card-hover border-b border-card-border">
                            <tr>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">التاريخ</th>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المدخل</th>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المشرف</th>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المجموع اليومي</th>
                              <th className="text-right text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المجموع الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUserSummary.length > 0 ? (
                              filteredUserSummary.map((row, index) => (
                                <tr key={`${row.date}-${row.username}-${index}`} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(row.date)}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 border border-blue-500/30">
                                      {row.username}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-indigo-600/20 text-purple-600 border border-purple-500/30">
                                      {row.supervisor}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">{row.dailyTotal}</td>
                                  <td className="px-4 py-3 text-muted whitespace-nowrap">{row.overallTotal}</td>
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
                      )}
                    </div>

                {/* Summary Footer */}
                <div className="mt-4 text-sm text-muted">
                  <span>
                    {statisticsModal === 'supervisor'
                      ? `إجمالي السجلات: ${filteredSupervisorSummary.length}`
                      : `إجمالي السجلات: ${filteredUserSummary.length}`
                    }
                  </span>
                </div>
              </div>
            </div>
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
                  placeholder="بحث بالاسم أو المدخل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <Button
                onClick={() => {
                  setShowAddUser(true);
                  setTimeout(() => {
                    addUserFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                إضافة مستخدم
              </Button>
            </div>

            {/* Advanced Filters */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">تصفية متقدمة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Username Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-muted">المدخل</label>
                  <input
                    type="text"
                    placeholder="المدخل"
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
                    <option value="operator">المشغل</option>
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
              {(usernameFilter || supervisorFilter || roleFilter || creationDateFilter) && (
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setUsernameFilter('');
                      setSupervisorFilter('');
                      setRoleFilter('');
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
              <div ref={addUserFormRef}>
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
                    label="المدخل"
                    placeholder="أدخل اسم المدخل"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                    icon={<User className="w-5 h-5" />}
                    required
                  />
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
                      <option value="operator">المشغل</option>
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
              </div>
            )}

            {/* Users Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card-hover border-b border-card-border">
                    <tr>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">المدخل</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">إسم المشرف</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الدور</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3 w-24 md:w-32">تاريخ الإنشاء</th>
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
                            <Badge variant={profile.role === 'admin' ? 'warning' : profile.role === 'operator' ? 'success' : 'default'}>
                              {profile.role === 'admin' ? 'مشرف' : profile.role === 'operator' ? 'المشغل' : 'مستخدم'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted text-sm w-24 md:w-32">{formatDate(profile.created_at)}</td>
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
