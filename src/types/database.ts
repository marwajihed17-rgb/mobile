// Database types for Supabase tables
export type UserRole = 'user' | 'admin' | 'super_admin' | 'operator';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ActivationStatus = 'activated' | 'activating' | 'confirmed'; // تم التفعيل (مشغل) | جاري التفعيل | تم التأكيد النهائي
export type ProjectType = 'salam' | 'mobily';
export type CalendarType = 'gregorian' | 'hijri';

// Operator interface
export interface Operator {
  id: string;
  name: string;
  code?: string;
  is_active?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string; // Now required - primary identifier
  supervisor_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  operator_id: string | null; // المشغل - references operators table
  activation_status: ActivationStatus | null; // الحالة - تم التفعيل | جاري التفعيل
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  dashboard_access: boolean;
  admin_privileges: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Salam Customer (8 fields + system fields)
export interface SalamCustomer {
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
  package: string | null; // الباقة
  operator_id: string | null; // المشغل - assigned operator
  operator_name: string | null; // المشغل name for display
  activation_status: ActivationStatus | null; // حالة التفعيل
  created_at: string;
  updated_at: string;
}

// Mobily Customer (14 fields + system fields)
export interface MobilyCustomer {
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
  birth_date: string;
  birth_date_calendar_type: CalendarType;
  identity_expiry_date: string;
  identity_expiry_date_calendar_type: CalendarType;
  package: string;
  email: string;
  city: string;
  district: string;
  price: number | null; // السعر
  operator_id: string | null; // المشغل - assigned operator
  operator_name: string | null; // المشغل name for display
  activation_status: ActivationStatus | null; // حالة التفعيل
  created_at: string;
  updated_at: string;
}

// Legacy interfaces for backward compatibility
export interface SalamEntry extends SalamCustomer {}
export interface MobilyEntry extends MobilyCustomer {}

// ============================================
// NEW UNIFIED STRUCTURE
// ============================================

// Unified Customer (combines Salam and Mobily)
export interface Customer {
  id: string;
  user_id: string;
  created_by_username: string | null;

  // Common fields (required for all projects)
  full_name: string;
  identity_number: string;
  phone_number: string;
  sim_number: string;
  device_number: string;
  nationality: string;
  register_number: string;

  // Project identification
  project: ProjectType;
  supervisor_name: string | null;
  status: string;

  // Mobily-specific fields (nullable for Salam customers)
  birth_date: string | null;
  birth_date_calendar_type: CalendarType | null;
  identity_expiry_date: string | null;
  identity_expiry_date_calendar_type: CalendarType | null;
  package: string | null;
  email: string | null;
  city: string | null;
  district: string | null;

  // System fields
  created_at: string;
  updated_at: string;
}

// Project
export interface Project {
  id: string;
  name: string;
  code: ProjectType;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Daily Customer Totals
export interface DailyCustomerTotal {
  id: string;
  date: string;
  project: ProjectType;
  total_customers: number;
  unique_users: number;
  created_at: string;
  updated_at: string;
}

// Stats Daily Baseline (for daily reset at 00:30)
export interface StatsDailyBaseline {
  id: string;
  date: string;
  project: ProjectType;
  baseline_total: number;
  created_at: string;
  updated_at: string;
}

// Customer with user details (from view)
export interface CustomerWithUser extends Customer {
  username: string | null;
  user_email: string | null;
  user_full_name: string | null;
  user_role: UserRole | null;
  user_status: UserStatus | null;
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSettings, 'id' | 'created_at'>>;
      };
      salam_customers: {
        Row: SalamCustomer;
        Insert: Omit<SalamCustomer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SalamCustomer, 'id' | 'created_at'>>;
      };
      mobily_customers: {
        Row: MobilyCustomer;
        Insert: Omit<MobilyCustomer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MobilyCustomer, 'id' | 'created_at'>>;
      };
      // Legacy tables kept for backward compatibility
      salam_entries: {
        Row: SalamEntry;
        Insert: Omit<SalamEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SalamEntry, 'id' | 'created_at'>>;
      };
      mobily_entries: {
        Row: MobilyEntry;
        Insert: Omit<MobilyEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MobilyEntry, 'id' | 'created_at'>>;
      };
      // New unified tables
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Customer, 'id' | 'created_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      daily_customer_totals: {
        Row: DailyCustomerTotal;
        Insert: Omit<DailyCustomerTotal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailyCustomerTotal, 'id' | 'created_at'>>;
      };
      stats_daily_baseline: {
        Row: StatsDailyBaseline;
        Insert: Omit<StatsDailyBaseline, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StatsDailyBaseline, 'id' | 'created_at'>>;
      };
    };
    Views: {
      customers_with_users: {
        Row: CustomerWithUser;
      };
      daily_stats: {
        Row: {
          date: string;
          salam_count: number;
          mobily_count: number;
          salam_users: number;
          mobily_users: number;
          total_count: number;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      check_salam_exists: {
        Args: { p_identity_number: string };
        Returns: boolean;
      };
      check_mobily_exists: {
        Args: { p_identity_number: string };
        Returns: boolean;
      };
      check_salam_customer_exists: {
        Args: { p_identity_number: string };
        Returns: boolean;
      };
      check_mobily_customer_exists: {
        Args: { p_identity_number: string };
        Returns: boolean;
      };
      get_recent_salam_customers: {
        Args: { p_limit?: number };
        Returns: SalamCustomer[];
      };
      get_recent_mobily_customers: {
        Args: { p_limit?: number };
        Returns: MobilyCustomer[];
      };
      get_salam_daily_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_mobily_daily_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_stats_by_date_range: {
        Args: { p_start_date: string; p_end_date?: string };
        Returns: { date: string; salam_count: number; mobily_count: number; total_count: number }[];
      };
      // New unified functions
      check_customer_exists: {
        Args: { p_identity_number: string; p_project: ProjectType };
        Returns: boolean;
      };
      get_daily_customer_count: {
        Args: { p_project: ProjectType };
        Returns: number;
      };
      get_customer_stats_by_date_range: {
        Args: { p_start_date: string; p_end_date?: string };
        Returns: { date: string; salam_count: number; mobily_count: number; total_count: number }[];
      };
      // Stats baseline functions for daily reset
      get_stats_baseline: {
        Args: { p_project: ProjectType };
        Returns: number;
      };
      record_daily_baseline: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      project_type: ProjectType;
      calendar_type: CalendarType;
    };
  };
}

// Helper types
export type ProfileWithSettings = Profile & {
  user_settings: UserSettings | null;
};

export type AdminUserView = Profile & {
  user_settings: UserSettings | null;
  last_login: string | null;
};
