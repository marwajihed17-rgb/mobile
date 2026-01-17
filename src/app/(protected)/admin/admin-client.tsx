'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Smartphone,
  Settings,
  Users,
  Download,
  Search,
  Trash2,
  Shield,
  ArrowRight,
  X,
  UserPlus,
  Mail,
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
import type { Profile, SalamEntry, MobilyEntry, UserRole } from '@/types/database';

interface AdminClientProps {
  currentProfile: Profile;
  profiles: Profile[];
  salamEntries: SalamEntry[];
  mobilyEntries: MobilyEntry[];
  stats: {
    totalUsers: number;
    adminCount: number;
    salamCount: number;
    mobilyCount: number;
  };
}

type ActiveView = 'dashboard' | 'salam' | 'mobily' | 'settings';

export function AdminClient({
  currentProfile,
  profiles: initialProfiles,
  salamEntries: initialSalamEntries,
  mobilyEntries: initialMobilyEntries,
  stats,
}: AdminClientProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState(initialProfiles);
  const [salamEntries] = useState(initialSalamEntries);
  const [mobilyEntries] = useState(initialMobilyEntries);

  // User Management States
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const authUser = {
    id: currentProfile.id,
    email: currentProfile.email,
    fullName: currentProfile.full_name,
    avatarUrl: currentProfile.avatar_url,
    role: currentProfile.role,
    isAdmin: true,
    isSuperAdmin: currentProfile.role === 'super_admin',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Export to CSV
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filter entries based on search
  const filteredSalamEntries = salamEntries.filter(entry =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.identity_number.includes(searchQuery) ||
    entry.phone_number.includes(searchQuery)
  );

  const filteredMobilyEntries = mobilyEntries.filter(entry =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.identity_number.includes(searchQuery) ||
    entry.phone_number.includes(searchQuery)
  );

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

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            full_name: newUserData.full_name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile role after a brief delay to allow trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: newUserData.role } as never)
          .eq('id', authData.user.id);

        if (updateError) console.error('Role update error:', updateError);
      }

      setSuccess('تم إضافة المستخدم بنجاح');
      setNewUserData({ email: '', password: '', full_name: '', role: 'user' });
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
        .update({ status: 'suspended' } as never)
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p =>
        p.id === userId ? { ...p, status: 'suspended' } : p
      ) as Profile[]);
      setSuccess('تم تعطيل المستخدم بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
  };

  // Update user role
  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('profiles')
        .update({ role } as never)
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p =>
        p.id === userId ? { ...p, role } : p
      ) as Profile[]);
      setSuccess('تم تحديث الصلاحية بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
  };

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
            <p className="text-3xl font-bold text-foreground">{stats.salamCount}</p>
            <p className="text-sm text-muted">مشروع سلام</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.mobilyCount}</p>
            <p className="text-sm text-muted">مشروع موبايلي</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
            <p className="text-sm text-muted">المستخدمين</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.adminCount}</p>
            <p className="text-sm text-muted">المشرفين</p>
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
                <Badge variant="success">{stats.salamCount} سجل</Badge>
              </div>

              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Phone className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                مشروع سلام
              </h3>
              <p className="text-sm text-muted">
                عرض وتصدير بيانات العملاء
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
                <Badge variant="primary">{stats.mobilyCount} سجل</Badge>
              </div>

              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Smartphone className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                مشروع موبايلي
              </h3>
              <p className="text-sm text-muted">
                عرض وتصدير بيانات العملاء
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
                <Badge variant="warning">{stats.totalUsers} مستخدم</Badge>
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
            {/* Search and Export */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
              <Button
                onClick={() => exportToCSV(filteredSalamEntries as unknown as Record<string, unknown>[], 'salam_entries')}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير CSV
              </Button>
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
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalamEntries.length > 0 ? (
                      filteredSalamEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 text-foreground">{entry.name}</td>
                          <td className="px-4 py-3 text-muted">{entry.identity_number}</td>
                          <td className="px-4 py-3 text-muted">{entry.phone_number}</td>
                          <td className="px-4 py-3 text-muted">{entry.sim_number}</td>
                          <td className="px-4 py-3 text-muted">{entry.device_number}</td>
                          <td className="px-4 py-3 text-muted">{entry.nationality}</td>
                          <td className="px-4 py-3 text-muted">{entry.register_number}</td>
                          <td className="px-4 py-3 text-muted text-sm">{formatDate(entry.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted">
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
            {/* Search and Export */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
              <Button
                onClick={() => exportToCSV(filteredMobilyEntries as unknown as Record<string, unknown>[], 'mobily_entries')}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير CSV
              </Button>
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
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMobilyEntries.length > 0 ? (
                      filteredMobilyEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 text-foreground">{entry.name}</td>
                          <td className="px-4 py-3 text-muted">{entry.identity_number}</td>
                          <td className="px-4 py-3 text-muted">{entry.nationality}</td>
                          <td className="px-4 py-3 text-muted">{entry.phone_number}</td>
                          <td className="px-4 py-3 text-muted">{entry.birth_date}</td>
                          <td className="px-4 py-3 text-muted">{entry.identity_expiry_date}</td>
                          <td className="px-4 py-3 text-muted">{entry.package}</td>
                          <td className="px-4 py-3 text-muted">{entry.email}</td>
                          <td className="px-4 py-3 text-muted">{entry.city}</td>
                          <td className="px-4 py-3 text-muted text-sm">{formatDate(entry.created_at)}</td>
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
                    label="الإسم الكامل"
                    placeholder="أدخل الإسم"
                    value={newUserData.full_name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, full_name: e.target.value }))}
                    icon={<User className="w-5 h-5" />}
                    required
                  />
                  <Input
                    type="email"
                    label="البريد الإلكتروني"
                    placeholder="أدخل البريد الإلكتروني"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    icon={<Mail className="w-5 h-5" />}
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
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground-secondary">الصلاحية</label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full px-4 py-3 bg-card-hover border border-card-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="user">مستخدم عادي</option>
                      <option value="admin">مشرف</option>
                    </select>
                  </div>
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
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الإسم</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">البريد الإلكتروني</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الصلاحية</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الحالة</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">تاريخ الإنشاء</th>
                      <th className="text-right text-sm font-medium text-muted px-4 py-3">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.length > 0 ? (
                      filteredProfiles.map((profile) => (
                        <tr key={profile.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                          <td className="px-4 py-3 text-foreground">{profile.full_name || '-'}</td>
                          <td className="px-4 py-3 text-muted">{profile.email}</td>
                          <td className="px-4 py-3">
                            <select
                              value={profile.role}
                              onChange={(e) => handleUpdateRole(profile.id, e.target.value as UserRole)}
                              className="px-2 py-1 bg-card border border-card-border rounded text-sm text-foreground focus:outline-none focus:border-primary"
                              disabled={profile.id === currentProfile.id}
                            >
                              <option value="user">مستخدم</option>
                              <option value="admin">مشرف</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={profile.status === 'active' ? 'success' : 'error'}>
                              {profile.status === 'active' ? 'نشط' : 'معطل'}
                            </Badge>
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
