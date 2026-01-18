'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Smartphone, List } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Profile, SalamEntry, MobilyEntry } from '@/types/database';

interface DashboardClientProps {
  profile: Profile;
  recentSalamEntries: SalamEntry[];
  recentMobilyEntries: MobilyEntry[];
}

export function DashboardClient({ profile, recentSalamEntries, recentMobilyEntries }: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'projects' | 'recent'>('projects');

  const authUser = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
    isSuperAdmin: profile.role === 'super_admin',
  };

  const firstName = profile.full_name?.split(' ')[0] || profile.email.split('@')[0];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen pb-16">
      <Header user={authUser} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-in-up">
          <p className="text-sm text-muted mb-2">مرحباً بك، {firstName}!</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">اختر المشروع</h1>
          <p className="text-muted">اختر مشروعاً لإدخال البيانات</p>
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
              <div className="absolute top-4" style={{ insetInlineStart: '1rem' }}>
                <Badge variant="success" className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  نشط
                </Badge>
              </div>

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
              <div className="absolute top-4" style={{ insetInlineStart: '1rem' }}>
                <Badge variant="primary" className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  نشط
                </Badge>
              </div>

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
            {/* Recent Salam Entries */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                آخر إدخالات مشروع سلام
              </h2>
              {recentSalamEntries.length > 0 ? (
                <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-card-hover border-b border-card-border">
                        <tr>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3">الإسم</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3">رقم الهوية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3">رقم الجوال</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSalamEntries.map((entry) => (
                          <tr key={entry.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                            <td className="px-4 py-3 text-foreground">{entry.name}</td>
                            <td className="px-4 py-3 text-muted">{entry.identity_number}</td>
                            <td className="px-4 py-3 text-muted">{entry.phone_number}</td>
                            <td className="px-4 py-3 text-muted text-sm">{formatDate(entry.created_at)}</td>
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

            {/* Recent Mobily Entries */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                آخر إدخالات مشروع موبايلي
              </h2>
              {recentMobilyEntries.length > 0 ? (
                <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-card-hover border-b border-card-border">
                        <tr>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3">الإسم</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3">رقم الهوية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3">رقم الجوال</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentMobilyEntries.map((entry) => (
                          <tr key={entry.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                            <td className="px-4 py-3 text-foreground">{entry.name}</td>
                            <td className="px-4 py-3 text-muted">{entry.identity_number}</td>
                            <td className="px-4 py-3 text-muted">{entry.phone_number}</td>
                            <td className="px-4 py-3 text-muted text-sm">{formatDate(entry.created_at)}</td>
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
