'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  ArrowRight,
  X,
  Users,
  UserCheck,
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

type ModalType = 'supervisor' | 'user' | null;

export function StatisticsClient({
  currentProfile,
  profiles,
  salamCustomers,
  mobilyCustomers,
}: StatisticsClientProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Combine all customers for statistics with correct supervisor mapping
  const allCustomers = useMemo(() => {
    const salam = salamCustomers.map(c => ({
      ...c,
      project: 'salam' as const,
      // Get supervisor_name from the user's profile who created this record
      user_supervisor: (c as CustomerWithProfile).profiles?.supervisor_name || null,
    }));
    const mobily = mobilyCustomers.map(c => ({
      ...c,
      project: 'mobily' as const,
      // Get supervisor_name from the user's profile who created this record
      user_supervisor: (c as MobilyCustomerWithProfile).profiles?.supervisor_name || null,
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

    // Sort by date descending, then by supervisor
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
      return matchesSearch;
    });
  }, [supervisorSummary, searchQuery]);

  // Filter user data
  const filteredUserSummary = useMemo(() => {
    return userSummary.filter(item => {
      const matchesSearch = !searchQuery ||
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [userSummary, searchQuery]);

  // Close modal handler
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSearchQuery('');
  }, []);

  // Render table card
  const renderTableCard = (
    arabicTitle: string,
    icon: React.ReactNode,
    color: string,
    onClick: () => void
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
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{arabicTitle}</h3>
      <p className="text-sm text-muted">اضغط للعرض</p>

      <div className="absolute bottom-4 left-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-5 h-5" />
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
            {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="relative w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="text"
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                    />
                  </div>
                  {searchQuery && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                    >
                      مسح
                    </Button>
                  )}
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
            <div className="mt-4 text-sm text-muted">
              <span>
                {activeModal === 'supervisor'
                  ? `إجمالي السجلات: ${filteredSupervisorSummary.length}`
                  : `إجمالي السجلات: ${filteredUserSummary.length}`
                }
              </span>
            </div>
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
                <h1 className="text-2xl font-bold text-foreground">جداول الإحصائيات</h1>
                <p className="text-muted">اضغط على أي جدول لعرض التفاصيل الكاملة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {/* Supervisor Daily Summary Card */}
          {renderTableCard(
            'ملخص المشرف اليومي',
            <UserCheck className="w-6 h-6 text-white" />,
            'from-green-500/10 to-emerald-600/10 border-green-500/30 hover:border-green-500',
            () => setActiveModal('supervisor')
          )}

          {/* Users Daily Summary Card */}
          {renderTableCard(
            'ملخص المستخدمين اليومي',
            <Users className="w-6 h-6 text-white" />,
            'from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500',
            () => setActiveModal('user')
          )}
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
