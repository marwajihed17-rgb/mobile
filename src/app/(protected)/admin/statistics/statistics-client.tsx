'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  ArrowRight,
  X,
  Plus,
  Users,
  UserCheck,
  Calendar,
  AlertCircle,
  Search
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import type { Profile, SalamCustomer, MobilyCustomer } from '@/types/database';

interface CustomerWithProfile extends SalamCustomer {
  profiles?: {
    username: string | null;
    full_name: string | null;
    supervisor_name: string | null;
  } | null;
}

interface MobilyCustomerWithProfile extends MobilyCustomer {
  profiles?: {
    username: string | null;
    full_name: string | null;
    supervisor_name: string | null;
  } | null;
}

interface StatisticsClientProps {
  currentProfile: Profile;
  profiles: Profile[];
  salamCustomers: CustomerWithProfile[];
  mobilyCustomers: MobilyCustomerWithProfile[];
}

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

type ModalType = 'supervisor' | 'user' | 'needMore' | null;

export function StatisticsClient({
  currentProfile,
  profiles,
  salamCustomers,
  mobilyCustomers,
}: StatisticsClientProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

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

  // Combine all customers for statistics
  const allCustomers = useMemo(() => {
    const salam = salamCustomers.map(c => ({
      ...c,
      project: 'salam' as const,
    }));
    const mobily = mobilyCustomers.map(c => ({
      ...c,
      project: 'mobily' as const,
    }));
    return [...salam, ...mobily];
  }, [salamCustomers, mobilyCustomers]);

  // Format date helper
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }, []);

  // Get date only (without time) for grouping
  const getDateOnly = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  // Calculate Supervisor Daily Summary
  const supervisorSummary = useMemo(() => {
    const summaryMap = new Map<string, { dailyTotals: Map<string, number>; overallTotal: number }>();

    allCustomers.forEach(customer => {
      const supervisor = customer.profiles?.supervisor_name || customer.created_by_username || 'غير محدد';
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

    // Sort by date descending, then by supervisor
    result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.supervisor.localeCompare(b.supervisor);
    });

    return result;
  }, [allCustomers, getDateOnly]);

  // Calculate User Daily Summary
  const userSummary = useMemo(() => {
    const summaryMap = new Map<string, {
      supervisor: string;
      dailyTotals: Map<string, number>;
      overallTotal: number
    }>();

    allCustomers.forEach(customer => {
      const username = customer.created_by_username || customer.profiles?.username || 'غير محدد';
      const supervisor = customer.profiles?.supervisor_name || 'غير محدد';
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

    // Sort by date descending, then by username
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
      const matchesSearch = !searchQuery ||
        item.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = !dateFilter || item.date === dateFilter;
      return matchesSearch && matchesDate;
    });
  }, [supervisorSummary, searchQuery, dateFilter]);

  // Filter user data
  const filteredUserSummary = useMemo(() => {
    return userSummary.filter(item => {
      const matchesSearch = !searchQuery ||
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = !dateFilter || item.date === dateFilter;
      return matchesSearch && matchesDate;
    });
  }, [userSummary, searchQuery, dateFilter]);

  // Close modal handler
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSearchQuery('');
    setDateFilter('');
  }, []);

  // Render table card
  const renderTableCard = (
    title: string,
    arabicTitle: string,
    icon: React.ReactNode,
    color: string,
    onClick: () => void,
    dataCount: number
  ) => (
    <Card
      hover
      glow
      className={`relative min-h-[180px] group cursor-pointer bg-gradient-to-br ${color} transition-all`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.replace('/10', '').replace('border-', 'from-').replace('/30', '')} flex items-center justify-center transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-foreground">{dataCount}</span>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{arabicTitle}</h3>
      <p className="text-sm text-muted">{title}</p>

      <div className="absolute bottom-4 left-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-5 h-5 rotate-180" />
      </div>
    </Card>
  );

  // Render modal
  const renderModal = () => {
    if (!activeModal) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      >
        <div
          className="w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl border border-card-border shadow-2xl overflow-hidden animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-card-border">
            <div className="flex items-center gap-3">
              {activeModal === 'supervisor' && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">ملخص المشرف اليومي</h2>
                    <p className="text-sm text-muted">Supervisor Daily Summary</p>
                  </div>
                </>
              )}
              {activeModal === 'user' && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">ملخص المستخدمين اليومي</h2>
                    <p className="text-sm text-muted">Users Daily Summary</p>
                  </div>
                </>
              )}
              {activeModal === 'needMore' && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">إضافة جدول جديد</h2>
                    <p className="text-sm text-muted">Add New Table</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={closeModal}
              className="p-2 text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {activeModal === 'needMore' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">تحتاج المزيد من البيانات</h3>
                <p className="text-muted max-w-md">
                  للحصول على جداول إضافية، يرجى التواصل مع الدعم الفني أو إضافة المزيد من البيانات إلى النظام.
                </p>
                <p className="text-sm text-muted mt-4">Need more data to display additional tables.</p>
                <Button
                  variant="secondary"
                  onClick={closeModal}
                  className="mt-6"
                >
                  إغلاق
                </Button>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="text"
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-3 py-2 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                    {(searchQuery || dateFilter) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setDateFilter('');
                        }}
                      >
                        مسح
                      </Button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-card-border">
                  {activeModal === 'supervisor' && (
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

                  {activeModal === 'user' && (
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
                <div className="mt-4 flex justify-between items-center text-sm text-muted">
                  <span>
                    {activeModal === 'supervisor'
                      ? `إجمالي السجلات: ${filteredSupervisorSummary.length}`
                      : `إجمالي السجلات: ${filteredUserSummary.length}`
                    }
                  </span>
                  <span>
                    {activeModal === 'supervisor'
                      ? `Total Records: ${filteredSupervisorSummary.length}`
                      : `Total Records: ${filteredUserSummary.length}`
                    }
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-16">
      <Header user={authUser} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 text-muted hover:text-foreground hover:bg-card rounded-lg transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">الإحصائيات</h1>
                <p className="text-muted">ملخص البيانات اليومية للمشرفين والمستخدمين</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{salamCustomers.length + mobilyCustomers.length}</p>
            <p className="text-sm text-muted">إجمالي السجلات</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{salamCustomers.length}</p>
            <p className="text-sm text-muted">سجلات سلام</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{mobilyCustomers.length}</p>
            <p className="text-sm text-muted">سجلات موبايلي</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{profiles.length}</p>
            <p className="text-sm text-muted">المستخدمين</p>
          </Card>
        </div>

        {/* Tables Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">جداول الإحصائيات</h2>
          <p className="text-sm text-muted mb-6">اضغط على أي جدول لعرض التفاصيل الكاملة</p>
        </div>

        {/* Table Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {/* Supervisor Daily Summary Card */}
          {renderTableCard(
            'Supervisor Daily Summary',
            'ملخص المشرف اليومي',
            <UserCheck className="w-6 h-6 text-white" />,
            'from-green-500/10 to-emerald-600/10 border-green-500/30 hover:border-green-500',
            () => setActiveModal('supervisor'),
            supervisorSummary.length
          )}

          {/* Users Daily Summary Card */}
          {renderTableCard(
            'Users Daily Summary',
            'ملخص المستخدمين اليومي',
            <Users className="w-6 h-6 text-white" />,
            'from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500',
            () => setActiveModal('user'),
            userSummary.length
          )}

          {/* Add More Table Card */}
          <Card
            hover
            className="relative min-h-[180px] group cursor-pointer border-dashed border-2 bg-transparent hover:bg-card/50 transition-all flex flex-col items-center justify-center"
            onClick={() => setActiveModal('needMore')}
          >
            <div className="w-12 h-12 rounded-full bg-card-hover flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Plus className="w-6 h-6 text-muted group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-base font-medium text-muted group-hover:text-foreground transition-colors">إضافة جدول</h3>
            <p className="text-sm text-muted mt-1">Add Table</p>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert variant="info" className="mt-8">
          <AlertCircle className="w-4 h-4" />
          <span>يتم تحديث البيانات تلقائياً عند إضافة سجلات جديدة. اضغط على أي جدول لعرض التفاصيل والبحث والتصفية.</span>
        </Alert>
      </main>

      {/* Modal */}
      {renderModal()}
    </div>
  );
}
