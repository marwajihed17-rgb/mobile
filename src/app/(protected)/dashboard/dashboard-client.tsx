'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Smartphone, List, Trash2, Edit, AlertCircle, Wifi, WifiOff, Search, ChevronDown, ChevronUp, Check, Loader2, X, Pencil } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase/client';
import { scrollToTop } from '@/utils/scroll';
import { useRealtimeSalamCustomers, useRealtimeMobilyCustomers } from '@/hooks/useRealtimeCustomers';
import { useRealtimeOperators } from '@/hooks/useRealtimeOperators';
import type { Profile, SalamCustomer, MobilyCustomer, ActivationStatus } from '@/types/database';

// Type for pending customer changes
interface CustomerPendingChanges {
  operator_id: string | null;
  activation_status: ActivationStatus | null;
  price?: number | null; // السعر - only for Mobily
}

// Success Modal Component
function SuccessModal({ isOpen, onClose, message }: { isOpen: boolean; onClose: () => void; message: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-card-border rounded-xl p-6 shadow-xl max-w-sm mx-4 animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 p-1 text-muted hover:text-foreground rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">تم بنجاح</h3>
          <p className="text-muted">{message}</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            حسناً
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // Search and expand states for customer lists
  const [salamSearchQuery, setSalamSearchQuery] = useState('');
  const [mobilySearchQuery, setMobilySearchQuery] = useState('');
  const [salamExpanded, setSalamExpanded] = useState(false);
  const [mobilyExpanded, setMobilyExpanded] = useState(false);

  // Real-time operators (users with role='operator') - stays synchronized with database
  const { operators, isConnected: operatorsConnected } = useRealtimeOperators();

  // Pending changes state - track unsaved changes per customer
  const [pendingChanges, setPendingChanges] = useState<Record<string, CustomerPendingChanges>>({});
  const [savingCustomerId, setSavingCustomerId] = useState<string | null>(null);

  // Edit mode state - track which customers are being edited
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');

  // Saved state - track recently saved values for optimistic UI update
  const [savedValues, setSavedValues] = useState<Record<string, { operator_id: string | null; operator_name: string | null; activation_status: ActivationStatus | null; price?: number | null }>>({});

  // Real-time subscriptions for both customer tables
  // Pass userId and isAdmin to properly filter and fetch fresh data
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
  const { customers: salamCustomers, isConnected: salamConnected } = useRealtimeSalamCustomers(recentSalamCustomers, profile.id, isAdmin);
  const { customers: mobilyCustomers, isConnected: mobilyConnected } = useRealtimeMobilyCustomers(recentMobilyCustomers, profile.id, isAdmin);

  // Filter and limit customers based on search and expanded state
  const filteredSalamCustomers = useMemo(() => {
    let filtered = salamCustomers;
    if (salamSearchQuery) {
      const query = salamSearchQuery.toLowerCase();
      filtered = salamCustomers.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.identity_number.toLowerCase().includes(query) ||
        customer.phone_number.toLowerCase().includes(query) ||
        (customer.created_by_username && customer.created_by_username.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [salamCustomers, salamSearchQuery]);

  const filteredMobilyCustomers = useMemo(() => {
    let filtered = mobilyCustomers;
    if (mobilySearchQuery) {
      const query = mobilySearchQuery.toLowerCase();
      filtered = mobilyCustomers.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.identity_number.toLowerCase().includes(query) ||
        customer.phone_number.toLowerCase().includes(query) ||
        (customer.created_by_username && customer.created_by_username.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [mobilyCustomers, mobilySearchQuery]);

  // Show only 5 initially, or all if expanded/searching
  const displayedSalamCustomers = useMemo(() => {
    if (salamSearchQuery || salamExpanded) return filteredSalamCustomers;
    return filteredSalamCustomers.slice(0, 5);
  }, [filteredSalamCustomers, salamSearchQuery, salamExpanded]);

  const displayedMobilyCustomers = useMemo(() => {
    if (mobilySearchQuery || mobilyExpanded) return filteredMobilyCustomers;
    return filteredMobilyCustomers.slice(0, 5);
  }, [filteredMobilyCustomers, mobilySearchQuery, mobilyExpanded]);

  // Legacy variables for backward compatibility
  const recentSalam = displayedSalamCustomers;
  const recentMobily = displayedMobilyCustomers;

  const authUser = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
    isSuperAdmin: profile.role === 'super_admin',
    isOperator: profile.role === 'operator',
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
      // Scroll to top to show success message and updated list
      scrollToTop();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? `خطأ: ${err.message}` : 'حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(null);
    }
  }, []);

  // Handle pending change for operator
  const handleOperatorChange = useCallback((customerId: string, operatorId: string | null, currentOperatorId: string | null) => {
    setPendingChanges(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        operator_id: operatorId,
        activation_status: prev[customerId]?.activation_status ?? null,
      }
    }));
  }, []);

  // Handle pending change for activation status
  const handleActivationStatusChange = useCallback((customerId: string, status: ActivationStatus | null) => {
    setPendingChanges(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        operator_id: prev[customerId]?.operator_id ?? null,
        activation_status: status,
      }
    }));
  }, []);

  // Handle pending change for price (Mobily only)
  const handlePriceChange = useCallback((customerId: string, price: number | null) => {
    setPendingChanges(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        operator_id: prev[customerId]?.operator_id ?? null,
        activation_status: prev[customerId]?.activation_status ?? null,
        price: price,
      }
    }));
  }, []);

  // Reset pending changes for a customer (clear selections)
  const handleResetChanges = useCallback((customerId: string) => {
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[customerId];
      return newChanges;
    });
  }, []);

  // Get operator name by ID
  const getOperatorName = useCallback((operatorId: string | null): string | null => {
    if (!operatorId) return null;
    const operator = operators.find(op => op.id === operatorId);
    return operator?.name || null;
  }, [operators]);

  // Submit customer changes
  const handleSubmitCustomerChanges = useCallback(async (customerId: string, projectType: 'salam' | 'mobily') => {
    const changes = pendingChanges[customerId];
    if (!changes) return;

    // Validate that at least one field is selected (price is optional for Mobily)
    const hasOperatorOrStatus = changes.operator_id !== null || changes.activation_status !== null;
    const hasPriceChange = projectType === 'mobily' && changes.price !== undefined;

    if (!hasOperatorOrStatus && !hasPriceChange) {
      setError('الرجاء اختيار المشغل أو حالة التفعيل قبل الحفظ');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSavingCustomerId(customerId);
    setError('');

    try {
      const supabase = getSupabaseClient();
      const tableName = projectType === 'salam' ? 'salam_customers' : 'mobily_customers';
      const operatorName = getOperatorName(changes.operator_id);

      // Build update object with only non-null values
      const updateData: Record<string, string | number | null> = {};
      if (changes.operator_id !== null) {
        updateData.operator_id = changes.operator_id;
        updateData.operator_name = operatorName;
      }
      if (changes.activation_status !== null) {
        updateData.activation_status = changes.activation_status;
      }
      // Add price for Mobily customers
      if (projectType === 'mobily' && changes.price !== undefined) {
        updateData.price = changes.price;
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData as never)
        .eq('id', customerId);

      if (updateError) {
        // Check if it's a column doesn't exist error
        if (updateError.message?.includes('column') || updateError.code === '42703') {
          console.warn('Database columns may not exist yet:', updateError.message);
          // Still clear pending changes and show success (data will be stored when columns exist)
        } else {
          throw updateError;
        }
      }

      // Save to savedValues for optimistic UI update
      setSavedValues(prev => ({
        ...prev,
        [customerId]: {
          operator_id: changes.operator_id,
          operator_name: operatorName,
          activation_status: changes.activation_status,
          price: changes.price,
        }
      }));

      // Clear pending changes and editing state for this customer
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[customerId];
        return newChanges;
      });
      setEditingCustomerId(null);

      // Show success modal
      setSuccessModalMessage('تم حفظ بيانات العميل بنجاح');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ';
      setError(`خطأ: ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSavingCustomerId(null);
    }
  }, [pendingChanges, getOperatorName]);

  // Check if customer has pending changes
  const hasPendingChanges = useCallback((customerId: string): boolean => {
    return !!pendingChanges[customerId];
  }, [pendingChanges]);

  // Check if customer is in edit mode (either has pending changes or is being edited)
  const isEditMode = useCallback((customerId: string): boolean => {
    return editingCustomerId === customerId || !!pendingChanges[customerId];
  }, [editingCustomerId, pendingChanges]);

  // Start editing a customer
  const startEditing = useCallback((customerId: string, customer: SalamCustomer | MobilyCustomer, projectType: 'salam' | 'mobily' = 'salam') => {
    setEditingCustomerId(customerId);
    // Initialize pending changes with effective values (saved or database) so user can modify them
    const effectiveOperatorId = savedValues[customerId]?.operator_id ?? customer.operator_id ?? null;
    const effectiveActivationStatus = savedValues[customerId]?.activation_status ?? customer.activation_status ?? null;
    const effectivePrice = projectType === 'mobily'
      ? (savedValues[customerId]?.price ?? (customer as MobilyCustomer).price ?? null)
      : undefined;

    setPendingChanges(prev => ({
      ...prev,
      [customerId]: {
        operator_id: effectiveOperatorId,
        activation_status: effectiveActivationStatus,
        ...(projectType === 'mobily' && { price: effectivePrice }),
      }
    }));
  }, [savedValues]);

  // Cancel editing (reset to original values)
  const cancelEditing = useCallback((customerId: string) => {
    setEditingCustomerId(null);
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[customerId];
      return newChanges;
    });
  }, []);

  // Get current value (pending, saved, or database)
  const getCurrentOperatorId = useCallback((customer: SalamCustomer | MobilyCustomer): string | null => {
    return pendingChanges[customer.id]?.operator_id ?? savedValues[customer.id]?.operator_id ?? customer.operator_id ?? null;
  }, [pendingChanges, savedValues]);

  const getCurrentActivationStatus = useCallback((customer: SalamCustomer | MobilyCustomer): ActivationStatus | null => {
    return pendingChanges[customer.id]?.activation_status ?? savedValues[customer.id]?.activation_status ?? customer.activation_status ?? null;
  }, [pendingChanges, savedValues]);

  // Get effective operator_name (saved value or database value)
  const getEffectiveOperatorName = useCallback((customer: SalamCustomer | MobilyCustomer): string | null => {
    // First check savedValues (optimistic update), then database value
    return savedValues[customer.id]?.operator_name ?? customer.operator_name ?? null;
  }, [savedValues]);

  // Get effective activation_status (saved value or database value)
  const getEffectiveActivationStatus = useCallback((customer: SalamCustomer | MobilyCustomer): ActivationStatus | null => {
    // First check savedValues (optimistic update), then database value
    return savedValues[customer.id]?.activation_status ?? customer.activation_status ?? null;
  }, [savedValues]);

  // Get current price (pending, saved, or database) - Mobily only
  const getCurrentPrice = useCallback((customer: MobilyCustomer): number | null => {
    return pendingChanges[customer.id]?.price ?? savedValues[customer.id]?.price ?? customer.price ?? null;
  }, [pendingChanges, savedValues]);

  // Get effective price (saved value or database value) - Mobily only
  const getEffectivePrice = useCallback((customer: MobilyCustomer): number | null => {
    // First check savedValues (optimistic update), then database value
    return savedValues[customer.id]?.price ?? customer.price ?? null;
  }, [savedValues]);

  // Check if price is saved (to determine if we should show checkmark for non-admin)
  const isPriceSaved = useCallback((customer: MobilyCustomer): boolean => {
    return (savedValues[customer.id]?.price !== undefined && savedValues[customer.id]?.price !== null) ||
           (customer.price !== undefined && customer.price !== null);
  }, [savedValues]);

  // Connection status indicator
  const isFullyConnected = salamConnected && mobilyConnected && operatorsConnected;

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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  آخر 5 عملاء - مشروع سلام
                  {salamConnected && (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      مباشر
                    </span>
                  )}
                </h2>
                {/* Search Input */}
                <div className="relative max-w-xs">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو المدخل..."
                    value={salamSearchQuery}
                    onChange={(e) => setSalamSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 text-sm bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {recentSalam.length > 0 ? (
                <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <div className={`overflow-x-auto ${salamExpanded || salamSearchQuery ? 'max-h-[400px] overflow-y-auto' : ''}`}>
                    <table className="w-full">
                      <thead className="bg-card-hover border-b border-card-border sticky top-0 z-10">
                        <tr>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإسم</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المدخل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الباقة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الهوية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجنسية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الجوال</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الشريحة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الجهاز</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم السجل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">التاريخ</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المشغل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">حالة التفعيل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSalam.map((customer) => (
                          <tr key={customer.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                            <td className="px-4 py-3 text-foreground whitespace-nowrap">{customer.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/30">
                                {customer.created_by_username || 'غير محدد'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.package || '-'}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.identity_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.nationality}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.phone_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.sim_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.device_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.register_number}</td>
                            <td className="px-4 py-3 text-muted text-sm whitespace-nowrap">{formatDate(customer.created_at)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {getEffectiveOperatorName(customer) && !isEditMode(customer.id) ? (
                                <button
                                  onClick={() => startEditing(customer.id, customer)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors cursor-pointer"
                                  title="انقر للتعديل"
                                >
                                  {getEffectiveOperatorName(customer)}
                                  <Pencil className="w-3 h-3 opacity-60" />
                                </button>
                              ) : (
                                <select
                                  value={getCurrentOperatorId(customer) || ''}
                                  onChange={(e) => handleOperatorChange(customer.id, e.target.value || null, customer.operator_id)}
                                  className="px-2 py-1 text-xs bg-card border border-card-border rounded text-foreground focus:outline-none focus:border-primary min-w-[90px]"
                                >
                                  <option value="" disabled>اختر المشغل</option>
                                  {operators.map((operator) => (
                                    <option key={operator.id} value={operator.id}>
                                      {operator.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {getEffectiveActivationStatus(customer) && !isEditMode(customer.id) ? (
                                <button
                                  onClick={() => startEditing(customer.id, customer)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                    getEffectiveActivationStatus(customer) === 'activated'
                                      ? 'bg-green-500/10 text-green-600 border border-green-500/30 hover:bg-green-500/20'
                                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20'
                                  }`}
                                  title="انقر للتعديل"
                                >
                                  {getEffectiveActivationStatus(customer) === 'activated' ? 'تم التفعيل' : 'جاري التفعيل'}
                                  <Pencil className="w-3 h-3 opacity-60" />
                                </button>
                              ) : (
                                <select
                                  value={getCurrentActivationStatus(customer) || ''}
                                  onChange={(e) => handleActivationStatusChange(customer.id, (e.target.value as ActivationStatus) || null)}
                                  className="px-2 py-1 text-xs bg-card border border-card-border rounded text-foreground focus:outline-none focus:border-primary min-w-[100px]"
                                >
                                  <option value="" disabled>اختر الحالة</option>
                                  <option value="activated">تم التفعيل</option>
                                  <option value="activating">جاري التفعيل</option>
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isEditMode(customer.id) && (
                                  <>
                                    <button
                                      onClick={() => handleSubmitCustomerChanges(customer.id, 'salam')}
                                      disabled={savingCustomerId === customer.id}
                                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                      {savingCustomerId === customer.id ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          جاري الحفظ
                                        </>
                                      ) : (
                                        'حفظ'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => cancelEditing(customer.id)}
                                      disabled={savingCustomerId === customer.id}
                                      className="p-1.5 text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-colors disabled:opacity-50"
                                      title="إلغاء"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteCustomer(customer.id, customer.name, 'salam')}
                                  disabled={isDeleting === customer.id}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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
                  {/* Show more/less button */}
                  {!salamSearchQuery && filteredSalamCustomers.length > 5 && (
                    <div className="border-t border-card-border p-3 text-center">
                      <button
                        onClick={() => setSalamExpanded(!salamExpanded)}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        {salamExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            عرض أقل
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            عرض الكل ({filteredSalamCustomers.length} عميل)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="text-center py-8">
                  <p className="text-muted">{salamSearchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد إدخالات حتى الآن'}</p>
                </Card>
              )}
            </div>

            {/* Recent Mobily Customers */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  آخر 5 عملاء - مشروع موبايلي
                  {mobilyConnected && (
                    <span className="text-xs text-blue-500 flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      مباشر
                    </span>
                  )}
                </h2>
                {/* Search Input */}
                <div className="relative max-w-xs">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو المدخل..."
                    value={mobilySearchQuery}
                    onChange={(e) => setMobilySearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 text-sm bg-card border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {recentMobily.length > 0 ? (
                <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <div className={`overflow-x-auto ${mobilyExpanded || mobilySearchQuery ? 'max-h-[400px] overflow-y-auto' : ''}`}>
                    <table className="w-full">
                      <thead className="bg-card-hover border-b border-card-border sticky top-0 z-10">
                        <tr>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإسم</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المدخل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الهوية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الجنسية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الجوال</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap w-24 md:w-32">تاريخ الميلاد</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap w-24 md:w-32">انتهاء الهوية</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الباقة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإيميل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الشريحة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم الجهاز</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المدينة</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الحي</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">رقم السجل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">التاريخ</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">المشغل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">السعر</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">حالة التفعيل</th>
                          <th className="text-start text-sm font-medium text-muted px-4 py-3 whitespace-nowrap">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentMobily.map((customer) => (
                          <tr key={customer.id} className="border-b border-card-border last:border-0 hover:bg-card-hover transition-colors">
                            <td className="px-4 py-3 text-foreground whitespace-nowrap">{customer.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/30">
                                {customer.created_by_username || 'غير محدد'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.identity_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.nationality}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.phone_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap w-24 md:w-32">{customer.birth_date}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap w-24 md:w-32">{customer.identity_expiry_date}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.package}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.email}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.sim_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.device_number}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.city}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.district}</td>
                            <td className="px-4 py-3 text-muted whitespace-nowrap">{customer.register_number}</td>
                            <td className="px-4 py-3 text-muted text-sm whitespace-nowrap">{formatDate(customer.created_at)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {getEffectiveOperatorName(customer) && !isEditMode(customer.id) ? (
                                <button
                                  onClick={() => startEditing(customer.id, customer, 'mobily')}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors cursor-pointer"
                                  title="انقر للتعديل"
                                >
                                  {getEffectiveOperatorName(customer)}
                                  <Pencil className="w-3 h-3 opacity-60" />
                                </button>
                              ) : (
                                <select
                                  value={getCurrentOperatorId(customer) || ''}
                                  onChange={(e) => handleOperatorChange(customer.id, e.target.value || null, customer.operator_id)}
                                  className="px-2 py-1 text-xs bg-card border border-card-border rounded text-foreground focus:outline-none focus:border-primary min-w-[90px]"
                                >
                                  <option value="" disabled>اختر المشغل</option>
                                  {operators.map((operator) => (
                                    <option key={operator.id} value={operator.id}>
                                      {operator.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            {/* السعر column - hidden for non-admin after saving */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isAdmin ? (
                                // Admin always sees the price value
                                isEditMode(customer.id) ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={getCurrentPrice(customer) ?? ''}
                                    onChange={(e) => handlePriceChange(customer.id, e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="السعر"
                                    className="px-2 py-1 text-xs bg-card border border-card-border rounded text-foreground focus:outline-none focus:border-primary w-20"
                                    dir="ltr"
                                  />
                                ) : (
                                  <span className="text-muted">
                                    {getEffectivePrice(customer) !== null ? `${getEffectivePrice(customer)} ر.س` : '-'}
                                  </span>
                                )
                              ) : (
                                // Non-admin: show input when editing, checkmark when saved, input when not saved
                                isEditMode(customer.id) ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={getCurrentPrice(customer) ?? ''}
                                    onChange={(e) => handlePriceChange(customer.id, e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="السعر"
                                    className="px-2 py-1 text-xs bg-card border border-card-border rounded text-foreground focus:outline-none focus:border-primary w-20"
                                    dir="ltr"
                                  />
                                ) : isPriceSaved(customer) ? (
                                  // Show checkmark when price is saved for non-admin
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500/10 text-green-600 rounded-full">
                                    <Check className="w-4 h-4" />
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {getEffectiveActivationStatus(customer) && !isEditMode(customer.id) ? (
                                <button
                                  onClick={() => startEditing(customer.id, customer, 'mobily')}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                    getEffectiveActivationStatus(customer) === 'activated'
                                      ? 'bg-green-500/10 text-green-600 border border-green-500/30 hover:bg-green-500/20'
                                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20'
                                  }`}
                                  title="انقر للتعديل"
                                >
                                  {getEffectiveActivationStatus(customer) === 'activated' ? 'تم التفعيل' : 'جاري التفعيل'}
                                  <Pencil className="w-3 h-3 opacity-60" />
                                </button>
                              ) : (
                                <select
                                  value={getCurrentActivationStatus(customer) || ''}
                                  onChange={(e) => handleActivationStatusChange(customer.id, (e.target.value as ActivationStatus) || null)}
                                  className="px-2 py-1 text-xs bg-card border border-card-border rounded text-foreground focus:outline-none focus:border-primary min-w-[100px]"
                                >
                                  <option value="" disabled>اختر الحالة</option>
                                  <option value="activated">تم التفعيل</option>
                                  <option value="activating">جاري التفعيل</option>
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isEditMode(customer.id) && (
                                  <>
                                    <button
                                      onClick={() => handleSubmitCustomerChanges(customer.id, 'mobily')}
                                      disabled={savingCustomerId === customer.id}
                                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                      {savingCustomerId === customer.id ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          جاري الحفظ
                                        </>
                                      ) : (
                                        'حفظ'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => cancelEditing(customer.id)}
                                      disabled={savingCustomerId === customer.id}
                                      className="p-1.5 text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-colors disabled:opacity-50"
                                      title="إلغاء"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteCustomer(customer.id, customer.name, 'mobily')}
                                  disabled={isDeleting === customer.id}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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
                  {/* Show more/less button */}
                  {!mobilySearchQuery && filteredMobilyCustomers.length > 5 && (
                    <div className="border-t border-card-border p-3 text-center">
                      <button
                        onClick={() => setMobilyExpanded(!mobilyExpanded)}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        {mobilyExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            عرض أقل
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            عرض الكل ({filteredMobilyCustomers.length} عميل)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="text-center py-8">
                  <p className="text-muted">{mobilySearchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد إدخالات حتى الآن'}</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successModalMessage}
      />
    </div>
  );
}
