// Database types for Supabase tables
export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ModuleType = 'invoice' | 'kdr' | 'ga' | 'kdr_inv' | 'kdr_sellout';
export type ProjectType = 'salam' | 'mobily';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface ModuleAccess {
  id: string;
  user_id: string;
  module_type: ModuleType;
  has_access: boolean;
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

export interface ChatMessage {
  id: string;
  user_id: string;
  module_type: ModuleType;
  content: string;
  is_bot: boolean;
  attachments: string[] | null;
  created_at: string;
}

export interface FileUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  module_type: ModuleType | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// Salam Project Entry
export interface SalamEntry {
  id: string;
  user_id: string;
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

// Mobily Project Entry
export interface MobilyEntry {
  id: string;
  user_id: string;
  name: string;
  identity_number: string;
  nationality: string;
  phone_number: string;
  birth_date: string;
  identity_expiry_date: string;
  package: string;
  email: string;
  sim_number: string;
  device_number: string;
  city: string;
  district: string;
  register_number: string;
  created_at: string;
  updated_at: string;
}

// Unified Customer Entry (supports both Salam and Mobily projects)
export interface Customer {
  id: string;
  user_id: string;
  project_type: ProjectType;
  // Common fields (required for all projects)
  name: string;
  identity_number: string;
  phone_number: string;
  sim_number: string;
  device_number: string;
  nationality: string;
  register_number: string;
  // Mobily-specific fields (nullable for Salam)
  birth_date: string | null;
  identity_expiry_date: string | null;
  package: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  created_at: string;
  updated_at: string;
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
      module_access: {
        Row: ModuleAccess;
        Insert: Omit<ModuleAccess, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ModuleAccess, 'id' | 'created_at'>>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSettings, 'id' | 'created_at'>>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>;
      };
      file_uploads: {
        Row: FileUpload;
        Insert: Omit<FileUpload, 'id' | 'created_at'>;
        Update: Partial<Omit<FileUpload, 'id' | 'created_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
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
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Customer, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      get_user_modules: {
        Args: { user_id: string };
        Returns: ModuleType[];
      };
      check_salam_exists: {
        Args: { p_identity_number: string };
        Returns: boolean;
      };
      check_mobily_exists: {
        Args: { p_identity_number: string };
        Returns: boolean;
      };
      check_customer_exists: {
        Args: { p_identity_number: string; p_project_type: ProjectType };
        Returns: boolean;
      };
      get_recent_customers: {
        Args: { p_project_type: ProjectType; p_limit?: number };
        Returns: Customer[];
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      module_type: ModuleType;
      project_type: ProjectType;
    };
  };
}

// Helper types
export type ProfileWithModules = Profile & {
  module_access: ModuleAccess[];
  user_settings: UserSettings | null;
};

export type AdminUserView = Profile & {
  module_access: ModuleAccess[];
  user_settings: UserSettings | null;
  last_login: string | null;
};
