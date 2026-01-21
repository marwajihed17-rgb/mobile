import { getSupabaseClient } from '@/lib/supabase/client';
import type { ProjectType } from '@/types/database';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export type ValidationRules = Record<string, FieldValidationRule>;

/**
 * Field validator for form data
 * Validates field formats, types, and uniqueness constraints
 */
export class FieldValidator {
  /**
   * Validate all fields according to the provided rules
   */
  static async validateFields(
    data: Record<string, any>,
    rules: ValidationRules
  ): Promise<ValidationResult> {
    const errors: Record<string, string> = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // Check required
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = 'هذا الحقل مطلوب';
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!value || value.toString().trim() === '') {
        continue;
      }

      const stringValue = value.toString().trim();

      // Check min length
      if (rule.minLength && stringValue.length < rule.minLength) {
        errors[field] = `يجب أن يكون الحقل ${rule.minLength} أحرف على الأقل`;
        continue;
      }

      // Check max length
      if (rule.maxLength && stringValue.length > rule.maxLength) {
        errors[field] = `يجب أن لا يتجاوز الحقل ${rule.maxLength} حرف`;
        continue;
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(stringValue)) {
        errors[field] = 'صيغة الحقل غير صحيحة';
        continue;
      }

      // Check custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors[field] = customError;
          continue;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Check if identity number already exists for a project
   */
  static async checkIdentityNumberUniqueness(
    identityNumber: string,
    projectType: ProjectType
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      const tableName = projectType === 'mobily' ? 'mobily_customers' : 'salam_customers';

      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq('identity_number', identityNumber.trim())
        .maybeSingle();

      if (error) {
        console.error('Error checking identity number:', error);
        return { exists: false, error: 'حدث خطأ أثناء التحقق من رقم الهوية' };
      }

      return { exists: !!data };
    } catch (err) {
      console.error('Unexpected error checking identity number:', err);
      return { exists: false, error: 'حدث خطأ غير متوقع أثناء التحقق من رقم الهوية' };
    }
  }

  /**
   * Check if SIM number already exists for a project
   */
  static async checkSimNumberUniqueness(
    simNumber: string,
    projectType: ProjectType
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      const tableName = projectType === 'mobily' ? 'mobily_customers' : 'salam_customers';

      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq('sim_number', simNumber.trim())
        .maybeSingle();

      if (error) {
        console.error('Error checking SIM number:', error);
        return { exists: false, error: 'حدث خطأ أثناء التحقق من رقم الشريحة' };
      }

      return { exists: !!data };
    } catch (err) {
      console.error('Unexpected error checking SIM number:', err);
      return { exists: false, error: 'حدث خطأ غير متوقع أثناء التحقق من رقم الشريحة' };
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validate phone number format (Saudi format)
   */
  static isValidPhoneNumber(phone: string): boolean {
    // Saudi phone numbers: 05XXXXXXXX or +9665XXXXXXXX
    const phonePattern = /^(05\d{8}|(\+?966)?5\d{8})$/;
    return phonePattern.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  static isValidDate(date: string): boolean {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) return false;

    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  /**
   * Validate that a date is not in the future
   */
  static isNotFutureDate(date: string): boolean {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate <= today;
  }

  /**
   * Validate that a date is in the future
   */
  static isFutureDate(date: string): boolean {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate > today;
  }
}
