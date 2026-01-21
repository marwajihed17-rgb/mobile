/**
 * Form Filling Agent Library
 *
 * This library provides automated form filling capabilities for Salam and Mobily customer forms.
 *
 * @example
 * ```typescript
 * import { FormFillerAgent } from '@/lib/agents';
 *
 * const result = await FormFillerAgent.fillSalamForm(
 *   {
 *     name: 'أحمد محمد',
 *     identity_number: '1234567890',
 *     phone_number: '0512345678',
 *     sim_number: '12345678',
 *     device_number: '87654321',
 *     nationality: 'سعودي',
 *     register_number: 'REG001',
 *   },
 *   {
 *     userId: 'user-id',
 *     username: 'username',
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Form filled successfully:', result.customerId);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */

export { FormFillerAgent } from './form-filler';
export type {
  FormFillResult,
  FormFillOptions,
  SalamFormData,
  MobilyFormData,
} from './form-filler';

export { FieldValidator } from './field-validator';
export type {
  ValidationResult,
  FieldValidationRule,
  ValidationRules,
} from './field-validator';

export {
  getFormSchema,
  getRequiredFields,
  salamFormSchema,
  mobilyFormSchema,
} from './form-schemas';
export type { FormField, FormSchema } from './form-schemas';
