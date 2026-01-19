// Database types for Supabase tables
export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
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

// Salam Customer (7 fields + system fields)
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
  created_at: string;
  updated_at: string;
}

// Mobily Customer (13 fields + system fields)
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
  identity_expiry_date: string;
  package: string;
  email: string;
  city: string;
  district: string;
  created_at: string;
  updated_at: string;
}

// Legacy interfaces for backward compatibility
export interface SalamEntry extends SalamCustomer {}
export interface MobilyEntry extends MobilyCustomer {}

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
    };
    Views: Record<string, never>;
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
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
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
