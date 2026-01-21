import { FieldValidator, type ValidationRules } from './field-validator';
import type { ProjectType } from '@/types/database';

/**
 * Form field definition
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date';
  required: boolean;
  placeholder?: string;
}

/**
 * Form schema definition
 */
export interface FormSchema {
  projectType: ProjectType;
  fields: FormField[];
  validationRules: ValidationRules;
}

/**
 * Salam form schema (7 fields)
 */
export const salamFormSchema: FormSchema = {
  projectType: 'salam',
  fields: [
    {
      name: 'name',
      label: 'الإسم',
      type: 'text',
      required: true,
      placeholder: 'أدخل الإسم الكامل',
    },
    {
      name: 'identity_number',
      label: 'رقم الهوية',
      type: 'text',
      required: true,
      placeholder: 'أدخل رقم الهوية',
    },
    {
      name: 'phone_number',
      label: 'رقم الجوال',
      type: 'tel',
      required: true,
      placeholder: 'أدخل رقم الجوال',
    },
    {
      name: 'sim_number',
      label: 'رقم الشريحة',
      type: 'text',
      required: true,
      placeholder: 'أدخل رقم الشريحة',
    },
    {
      name: 'device_number',
      label: 'رقم الجهاز',
      type: 'text',
      required: true,
      placeholder: 'أدخل رقم الجهاز',
    },
    {
      name: 'nationality',
      label: 'الجنسية',
      type: 'text',
      required: true,
      placeholder: 'أدخل الجنسية',
    },
    {
      name: 'register_number',
      label: 'سجل',
      type: 'text',
      required: true,
      placeholder: 'أدخل رقم السجل',
    },
  ],
  validationRules: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    identity_number: {
      required: true,
      minLength: 10,
      maxLength: 10,
      pattern: /^\d{10}$/,
      custom: (value: string) => {
        if (!/^\d{10}$/.test(value)) {
          return 'رقم الهوية يجب أن يكون 10 أرقام';
        }
        return null;
      },
    },
    phone_number: {
      required: true,
      custom: (value: string) => {
        if (!FieldValidator.isValidPhoneNumber(value)) {
          return 'رقم الجوال غير صحيح';
        }
        return null;
      },
    },
    sim_number: {
      required: true,
      minLength: 8,
      maxLength: 20,
    },
    device_number: {
      required: true,
      minLength: 8,
      maxLength: 20,
    },
    nationality: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    register_number: {
      required: true,
      minLength: 1,
      maxLength: 50,
    },
  },
};

/**
 * Mobily form schema (13 fields)
 */
export const mobilyFormSchema: FormSchema = {
  projectType: 'mobily',
  fields: [
    {
      name: 'name',
      label: 'الإسم',
      type: 'text',
      required: true,
      placeholder: 'أدخل الإسم الكامل',
    },
    {
      name: 'identity_number',
      label: 'رقم الهوية',
      type: 'text',
      required: true,
      placeholder: 'أدخل رقم الهوية',
    },
    {
      name: 'nationality',
      label: 'الجنسية',
      type: 'text',
      required: true,
      placeholder: 'أدخل الجنسية',
    },
    {
      name: 'phone_number',
      label: 'رقم الجوال',
      type: 'tel',
      required: true,
      placeholder: 'أدخل رقم الجوال',
    },
    {
      name: 'birth_date',
      label: 'تاريخ الميلاد',
      type: 'date',
      required: true,
    },
    {
      name: 'identity_expiry_date',
      label: 'تاريخ انتهاء الهوية',
      type: 'date',
      required: true,
    },
    {
      name: 'package',
      label: 'الباقة',
      type: 'text',
      required: true,
      placeholder: 'أدخل الباقة',
    },
    {
      name: 'email',
      label: 'الإيميل',
      type: 'email',
      required: true,
      placeholder: 'أدخل البريد الإلكتروني',
    },
    {
      name: 'sim_number',
      label: 'الشريحة',
      type: 'text',
      required: true,
      placeholder: 'أدخل رقم الشريحة',
    },
    {
      name: 'device_number',
      label: 'الجهاز',
      type: 'text',
      required: true,
      placeholder: 'أدخل رقم الجهاز',
    },
    {
      name: 'city',
      label: 'المدينة',
      type: 'text',
      required: true,
      placeholder: 'أدخل المدينة',
    },
    {
      name: 'district',
      label: 'الحي',
      type: 'text',
      required: true,
      placeholder: 'أدخل الحي',
    },
    {
      name: 'register_number',
      label: 'سجل',
      type: 'text',
      required: true,
      placeholder: 'أدخل رقم السجل',
    },
  ],
  validationRules: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    identity_number: {
      required: true,
      minLength: 10,
      maxLength: 10,
      pattern: /^\d{10}$/,
      custom: (value: string) => {
        if (!/^\d{10}$/.test(value)) {
          return 'رقم الهوية يجب أن يكون 10 أرقام';
        }
        return null;
      },
    },
    nationality: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    phone_number: {
      required: true,
      custom: (value: string) => {
        if (!FieldValidator.isValidPhoneNumber(value)) {
          return 'رقم الجوال غير صحيح';
        }
        return null;
      },
    },
    birth_date: {
      required: true,
      custom: (value: string) => {
        if (!FieldValidator.isValidDate(value)) {
          return 'تاريخ الميلاد غير صحيح';
        }
        if (!FieldValidator.isNotFutureDate(value)) {
          return 'تاريخ الميلاد لا يمكن أن يكون في المستقبل';
        }
        return null;
      },
    },
    identity_expiry_date: {
      required: true,
      custom: (value: string) => {
        if (!FieldValidator.isValidDate(value)) {
          return 'تاريخ انتهاء الهوية غير صحيح';
        }
        if (!FieldValidator.isFutureDate(value)) {
          return 'تاريخ انتهاء الهوية يجب أن يكون في المستقبل';
        }
        return null;
      },
    },
    package: {
      required: true,
      minLength: 1,
      maxLength: 100,
    },
    email: {
      required: true,
      custom: (value: string) => {
        if (!FieldValidator.isValidEmail(value)) {
          return 'البريد الإلكتروني غير صحيح';
        }
        return null;
      },
    },
    sim_number: {
      required: true,
      minLength: 8,
      maxLength: 20,
    },
    device_number: {
      required: true,
      minLength: 8,
      maxLength: 20,
    },
    city: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    district: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    register_number: {
      required: true,
      minLength: 1,
      maxLength: 50,
    },
  },
};

/**
 * Get form schema by project type
 */
export function getFormSchema(projectType: ProjectType): FormSchema {
  return projectType === 'mobily' ? mobilyFormSchema : salamFormSchema;
}

/**
 * Get required fields for a project type
 */
export function getRequiredFields(projectType: ProjectType): string[] {
  const schema = getFormSchema(projectType);
  return schema.fields.filter(f => f.required).map(f => f.name);
}
