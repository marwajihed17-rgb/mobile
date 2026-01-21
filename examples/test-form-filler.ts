/**
 * Form Filler Agent - Example Usage
 *
 * This file demonstrates how to use the Form Filler Agent to automatically
 * fill Salam and Mobily customer forms.
 *
 * NOTE: This is an example file for reference. Do not run this directly in production.
 */

import { FormFillerAgent } from '@/lib/agents';
import type { SalamFormData, MobilyFormData } from '@/lib/agents';

/**
 * Example 1: Fill a single Salam form
 */
async function exampleFillSalamForm() {
  const salamData: SalamFormData = {
    name: 'أحمد محمد علي',
    identity_number: '1234567890',
    phone_number: '0512345678',
    sim_number: '12345678',
    device_number: '87654321',
    nationality: 'سعودي',
    register_number: 'REG001',
  };

  const result = await FormFillerAgent.fillSalamForm(salamData, {
    userId: 'user-uuid-here',
    username: 'ahmad.ali',
  });

  if (result.success) {
    console.log('✓ Salam form filled successfully!');
    console.log('Customer ID:', result.customerId);
  } else {
    console.error('✗ Failed to fill form:', result.message);
    console.error('Errors:', result.errors);
  }

  return result;
}

/**
 * Example 2: Fill a single Mobily form
 */
async function exampleFillMobilyForm() {
  const mobilyData: MobilyFormData = {
    name: 'فاطمة علي حسن',
    identity_number: '0987654321',
    nationality: 'سعودي',
    phone_number: '0523456789',
    birth_date: '1995-03-15',
    identity_expiry_date: '2028-12-31',
    package: 'باقة الأفراد',
    email: 'fatima.ali@example.com',
    sim_number: '23456789',
    device_number: '98765432',
    city: 'الرياض',
    district: 'النخيل',
    register_number: 'REG002',
  };

  const result = await FormFillerAgent.fillMobilyForm(mobilyData, {
    userId: 'user-uuid-here',
    username: 'fatima.ali',
  });

  if (result.success) {
    console.log('✓ Mobily form filled successfully!');
    console.log('Customer ID:', result.customerId);
  } else {
    console.error('✗ Failed to fill form:', result.message);
    console.error('Errors:', result.errors);
  }

  return result;
}

/**
 * Example 3: Fill multiple Salam forms in batch
 */
async function exampleBatchFillSalamForms() {
  const formsData: SalamFormData[] = [
    {
      name: 'محمد أحمد',
      identity_number: '1111111111',
      phone_number: '0511111111',
      sim_number: '11111111',
      device_number: '11111111',
      nationality: 'سعودي',
      register_number: 'REG101',
    },
    {
      name: 'سارة محمد',
      identity_number: '2222222222',
      phone_number: '0522222222',
      sim_number: '22222222',
      device_number: '22222222',
      nationality: 'سعودي',
      register_number: 'REG102',
    },
    {
      name: 'عبدالله خالد',
      identity_number: '3333333333',
      phone_number: '0533333333',
      sim_number: '33333333',
      device_number: '33333333',
      nationality: 'سعودي',
      register_number: 'REG103',
    },
  ];

  const result = await FormFillerAgent.fillFormsBatch('salam', formsData, {
    userId: 'user-uuid-here',
    username: 'admin.user',
  });

  console.log(`\n✓ Batch processing complete:`);
  console.log(`  Success: ${result.successCount}`);
  console.log(`  Failed: ${result.failureCount}`);

  result.results.forEach((res, index) => {
    if (res.success) {
      console.log(`  [${index + 1}] ✓ ${formsData[index].name} - ${res.customerId}`);
    } else {
      console.log(`  [${index + 1}] ✗ ${formsData[index].name} - ${res.message}`);
    }
  });

  return result;
}

/**
 * Example 4: Using the API endpoint (fetch request)
 */
async function exampleAPIRequest() {
  const response = await fetch('/api/agents/fill-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectType: 'salam',
      formData: {
        name: 'خالد إبراهيم',
        identity_number: '4444444444',
        phone_number: '0544444444',
        sim_number: '44444444',
        device_number: '44444444',
        nationality: 'سعودي',
        register_number: 'REG201',
      },
      options: {
        skipValidation: false,
        allowDuplicates: false,
      },
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log('✓ API request successful!');
    console.log('Customer ID:', result.customerId);
  } else {
    console.error('✗ API request failed:', result.message);
    console.error('Errors:', result.errors);
  }

  return result;
}

/**
 * Example 5: Batch API request
 */
async function exampleBatchAPIRequest() {
  const response = await fetch('/api/agents/fill-forms-batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectType: 'mobily',
      formsData: [
        {
          name: 'نورة عبدالله',
          identity_number: '5555555555',
          nationality: 'سعودي',
          phone_number: '0555555555',
          birth_date: '1990-05-20',
          identity_expiry_date: '2029-06-30',
          package: 'باقة العائلة',
          email: 'noura@example.com',
          sim_number: '55555555',
          device_number: '55555555',
          city: 'جدة',
          district: 'البحيرة',
          register_number: 'REG301',
        },
        {
          name: 'عمر سعد',
          identity_number: '6666666666',
          nationality: 'سعودي',
          phone_number: '0566666666',
          birth_date: '1985-08-10',
          identity_expiry_date: '2027-09-15',
          package: 'باقة الشباب',
          email: 'omar@example.com',
          sim_number: '66666666',
          device_number: '66666666',
          city: 'الدمام',
          district: 'الفيصلية',
          register_number: 'REG302',
        },
      ],
      options: {
        skipValidation: false,
        allowDuplicates: false,
      },
    }),
  });

  const result = await response.json();

  console.log(`\n✓ Batch API request complete:`);
  console.log(`  Success: ${result.successCount}`);
  console.log(`  Failed: ${result.failureCount}`);

  return result;
}

/**
 * Example 6: Error handling
 */
async function exampleErrorHandling() {
  // This will fail due to invalid data
  const invalidData: Partial<SalamFormData> = {
    name: 'A', // Too short
    identity_number: '123', // Invalid format
    phone_number: '123456', // Invalid format
    sim_number: '', // Empty
  };

  const result = await FormFillerAgent.fillSalamForm(
    invalidData as SalamFormData,
    {
      userId: 'user-uuid-here',
      username: 'test.user',
    }
  );

  if (!result.success) {
    console.log('✓ Validation working correctly!');
    console.log('Errors found:');
    Object.entries(result.errors || {}).forEach(([field, error]) => {
      console.log(`  - ${field}: ${error}`);
    });
  }

  return result;
}

/**
 * Example 7: Skip validation (use with caution!)
 */
async function exampleSkipValidation() {
  const data: SalamFormData = {
    name: 'اختبار',
    identity_number: '7777777777',
    phone_number: '0577777777',
    sim_number: '77777777',
    device_number: '77777777',
    nationality: 'سعودي',
    register_number: 'TEST',
  };

  const result = await FormFillerAgent.fillSalamForm(data, {
    userId: 'user-uuid-here',
    username: 'test.user',
    skipValidation: true, // Skip all validation checks
  });

  if (result.success) {
    console.log('✓ Form filled (validation skipped)');
  }

  return result;
}

// Export examples
export {
  exampleFillSalamForm,
  exampleFillMobilyForm,
  exampleBatchFillSalamForms,
  exampleAPIRequest,
  exampleBatchAPIRequest,
  exampleErrorHandling,
  exampleSkipValidation,
};

/**
 * Run all examples (for testing purposes)
 */
async function runAllExamples() {
  console.log('=== Form Filler Agent Examples ===\n');

  console.log('1. Fill Salam Form');
  await exampleFillSalamForm();

  console.log('\n2. Fill Mobily Form');
  await exampleFillMobilyForm();

  console.log('\n3. Batch Fill Salam Forms');
  await exampleBatchFillSalamForms();

  console.log('\n4. API Request');
  await exampleAPIRequest();

  console.log('\n5. Batch API Request');
  await exampleBatchAPIRequest();

  console.log('\n6. Error Handling');
  await exampleErrorHandling();

  console.log('\n7. Skip Validation');
  await exampleSkipValidation();

  console.log('\n=== All examples complete ===');
}

// Uncomment to run all examples
// runAllExamples();
