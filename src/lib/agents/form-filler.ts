import { getSupabaseClient } from '@/lib/supabase/client';
import { FieldValidator } from './field-validator';
import { getFormSchema, getRequiredFields } from './form-schemas';
import type { ProjectType, MobilyCustomer, SalamCustomer } from '@/types/database';
import type { Database } from '@/types/database';

/**
 * Form filling result
 */
export interface FormFillResult {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
  data?: any;
  customerId?: string;
}

/**
 * Form data input for Salam project
 */
export interface SalamFormData {
  name: string;
  identity_number: string;
  phone_number: string;
  sim_number: string;
  device_number: string;
  nationality: string;
  register_number: string;
}

/**
 * Form data input for Mobily project
 */
export interface MobilyFormData {
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
}

/**
 * Form filling options
 */
export interface FormFillOptions {
  userId: string;
  username: string;
  skipValidation?: boolean;
  allowDuplicates?: boolean;
}

/**
 * Form Filler Agent
 * Automatically fills and submits forms for Salam and Mobily projects
 */
export class FormFillerAgent {
  /**
   * Fill a Salam customer form
   */
  static async fillSalamForm(
    formData: SalamFormData,
    options: FormFillOptions
  ): Promise<FormFillResult> {
    return this.fillForm('salam', formData, options);
  }

  /**
   * Fill a Mobily customer form
   */
  static async fillMobilyForm(
    formData: MobilyFormData,
    options: FormFillOptions
  ): Promise<FormFillResult> {
    return this.fillForm('mobily', formData, options);
  }

  /**
   * Generic form filling method
   */
  static async fillForm(
    projectType: ProjectType,
    formData: Record<string, any>,
    options: FormFillOptions
  ): Promise<FormFillResult> {
    try {
      const schema = getFormSchema(projectType);

      // Step 1: Validate form data structure
      if (!options.skipValidation) {
        const structureCheck = this.validateFormStructure(formData, projectType);
        if (!structureCheck.isValid) {
          return {
            success: false,
            message: 'البيانات المدخلة غير صحيحة',
            errors: structureCheck.errors,
          };
        }

        // Step 2: Validate field values
        const validationResult = await FieldValidator.validateFields(
          formData,
          schema.validationRules
        );

        if (!validationResult.isValid) {
          return {
            success: false,
            message: 'يرجى تصحيح الأخطاء في النموذج',
            errors: validationResult.errors,
          };
        }

        // Step 3: Check uniqueness constraints
        if (!options.allowDuplicates) {
          const uniquenessCheck = await this.checkUniquenessConstraints(
            formData,
            projectType
          );

          if (!uniquenessCheck.isValid) {
            return {
              success: false,
              message: 'البيانات المدخلة مسجلة مسبقاً',
              errors: uniquenessCheck.errors,
            };
          }
        }
      }

      // Step 4: Prepare data for insertion
      const preparedData = this.prepareDataForInsertion(
        formData,
        options.userId,
        options.username
      );

      // Step 5: Insert into database
      const insertResult = await this.insertFormData(
        projectType,
        preparedData
      );

      if (!insertResult.success) {
        return insertResult;
      }

      return {
        success: true,
        message: 'تم حفظ البيانات بنجاح',
        data: preparedData,
        customerId: insertResult.customerId,
      };
    } catch (error) {
      console.error('Error in FormFillerAgent:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        errors: {
          general: 'حدث خطأ أثناء معالجة البيانات',
        },
      };
    }
  }

  /**
   * Validate form structure (check if all required fields are present)
   */
  private static validateFormStructure(
    formData: Record<string, any>,
    projectType: ProjectType
  ): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const requiredFields = getRequiredFields(projectType);

    for (const field of requiredFields) {
      if (!(field in formData)) {
        errors[field] = 'هذا الحقل مطلوب';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Check uniqueness constraints (identity_number and sim_number)
   */
  private static async checkUniquenessConstraints(
    formData: Record<string, any>,
    projectType: ProjectType
  ): Promise<{ isValid: boolean; errors: Record<string, string> }> {
    const errors: Record<string, string> = {};

    // Check identity number
    if (formData.identity_number) {
      const identityCheck = await FieldValidator.checkIdentityNumberUniqueness(
        formData.identity_number,
        projectType
      );

      if (identityCheck.error) {
        errors.identity_number = identityCheck.error;
      } else if (identityCheck.exists) {
        errors.identity_number = 'رقم الهوية مستخدم مسبقاً. الرجاء إدخال رقم آخر.';
      }
    }

    // Check SIM number
    if (formData.sim_number) {
      const simCheck = await FieldValidator.checkSimNumberUniqueness(
        formData.sim_number,
        projectType
      );

      if (simCheck.error) {
        errors.sim_number = simCheck.error;
      } else if (simCheck.exists) {
        errors.sim_number = 'رقم الشريحة مستخدم مسبقاً. الرجاء إدخال رقم آخر.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Prepare data for database insertion (trim values, add metadata)
   */
  private static prepareDataForInsertion(
    formData: Record<string, any>,
    userId: string,
    username: string
  ): Record<string, any> {
    const prepared: Record<string, any> = {
      user_id: userId,
      created_by_username: username,
    };

    // Trim all string values
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        prepared[key] = value.trim();
      } else {
        prepared[key] = value;
      }
    }

    return prepared;
  }

  /**
   * Insert form data into the database
   */
  private static async insertFormData(
    projectType: ProjectType,
    data: Record<string, any>
  ): Promise<FormFillResult> {
    try {
      const supabase = getSupabaseClient();
      const tableName = projectType === 'mobily' ? 'mobily_customers' : 'salam_customers';

      const { data: insertedData, error } = await supabase
        .from(tableName)
        .insert(data)
        .select('id')
        .single();

      if (error) {
        console.error('Database insert error:', error);

        // Handle specific database errors
        if (error.code === '23505') {
          // Unique constraint violation
          const errors: Record<string, string> = {};
          if (error.message.includes('identity_number')) {
            errors.identity_number = 'رقم الهوية مستخدم مسبقاً';
          }
          if (error.message.includes('sim_number')) {
            errors.sim_number = 'رقم الشريحة مستخدم مسبقاً';
          }

          return {
            success: false,
            message: 'البيانات المدخلة مسجلة مسبقاً في النظام',
            errors,
          };
        } else if (error.code === '23503') {
          return {
            success: false,
            message: 'خطأ في الاتصال بقاعدة البيانات - يرجى المحاولة مرة أخرى',
            errors: { general: error.message },
          };
        } else {
          return {
            success: false,
            message: `خطأ في الحفظ: ${error.message}`,
            errors: { general: error.message },
          };
        }
      }

      return {
        success: true,
        message: 'تم حفظ البيانات بنجاح',
        customerId: insertedData?.id,
      };
    } catch (error) {
      console.error('Unexpected database error:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع أثناء الحفظ',
        errors: {
          general: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Fill multiple forms in batch
   */
  static async fillFormsBatch(
    projectType: ProjectType,
    formsData: Array<Record<string, any>>,
    options: FormFillOptions
  ): Promise<{
    success: boolean;
    results: FormFillResult[];
    successCount: number;
    failureCount: number;
  }> {
    const results: FormFillResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const formData of formsData) {
      const result = await this.fillForm(projectType, formData, options);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      success: successCount > 0,
      results,
      successCount,
      failureCount,
    };
  }
}
