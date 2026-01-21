# Form Filler Agent - Quick Start Guide

## Overview

The Form Filler Agent is an automated system for filling Salam and Mobily customer forms in the PAA Solutions platform. It provides:

- **Automated validation** of all form fields
- **Duplicate detection** for identity and SIM numbers
- **Batch processing** for multiple forms
- **REST API endpoints** for integration
- **TypeScript support** with full type safety

## Installation

The Form Filler Agent is already integrated into your project. No additional installation required.

## Quick Start

### Method 1: Use the Agent Directly (Programmatic)

```typescript
import { FormFillerAgent } from '@/lib/agents';

// Fill a Salam form
const result = await FormFillerAgent.fillSalamForm(
  {
    name: 'أحمد محمد',
    identity_number: '1234567890',
    phone_number: '0512345678',
    sim_number: '12345678',
    device_number: '87654321',
    nationality: 'سعودي',
    register_number: 'REG001',
  },
  {
    userId: currentUser.id,
    username: currentUser.username,
  }
);

if (result.success) {
  console.log('Success!', result.customerId);
}
```

### Method 2: Use the API Endpoint (HTTP)

```bash
curl -X POST http://localhost:3000/api/agents/fill-form \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "salam",
    "formData": {
      "name": "أحمد محمد",
      "identity_number": "1234567890",
      "phone_number": "0512345678",
      "sim_number": "12345678",
      "device_number": "87654321",
      "nationality": "سعودي",
      "register_number": "REG001"
    }
  }'
```

## Form Fields

### Salam Form (7 fields)
```typescript
{
  name: string;                // Customer name
  identity_number: string;     // 10-digit national ID (unique)
  phone_number: string;        // Saudi phone number
  sim_number: string;          // SIM card number (unique)
  device_number: string;       // Device IMEI
  nationality: string;         // Nationality
  register_number: string;     // Registration number
}
```

### Mobily Form (13 fields)
```typescript
{
  name: string;                    // Customer name
  identity_number: string;         // 10-digit national ID (unique)
  nationality: string;             // Nationality
  phone_number: string;            // Saudi phone number
  birth_date: string;              // YYYY-MM-DD (must be in past)
  identity_expiry_date: string;    // YYYY-MM-DD (must be in future)
  package: string;                 // Subscription package
  email: string;                   // Valid email address
  sim_number: string;              // SIM card number (unique)
  device_number: string;           // Device IMEI
  city: string;                    // City
  district: string;                // District
  register_number: string;         // Registration number
}
```

## API Endpoints

### 1. Fill Single Form

**Endpoint:** `POST /api/agents/fill-form`

**Request:**
```json
{
  "projectType": "salam" | "mobily",
  "formData": { /* form fields */ },
  "options": {
    "skipValidation": false,
    "allowDuplicates": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم حفظ البيانات بنجاح",
  "customerId": "uuid"
}
```

### 2. Fill Multiple Forms (Batch)

**Endpoint:** `POST /api/agents/fill-forms-batch`

**Request:**
```json
{
  "projectType": "salam" | "mobily",
  "formsData": [
    { /* form 1 */ },
    { /* form 2 */ }
  ],
  "options": {
    "skipValidation": false,
    "allowDuplicates": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": [/* individual results */],
  "successCount": 5,
  "failureCount": 2
}
```

## Validation Rules

### Identity Number
- Must be exactly 10 digits
- Must be unique (no duplicates)
- Example: `1234567890`

### Phone Number
- Saudi format: `05XXXXXXXX` or `+9665XXXXXXXX`
- Example: `0512345678`, `+966512345678`

### SIM Number
- 8-20 characters
- Must be unique (no duplicates)

### Email (Mobily only)
- Valid email format
- Example: `user@example.com`

### Dates (Mobily only)
- Format: `YYYY-MM-DD`
- Birth date: Must be in the past
- ID expiry: Must be in the future

## Error Handling

All errors are returned in Arabic:

```typescript
{
  success: false,
  message: "يرجى تصحيح الأخطاء في النموذج",
  errors: {
    identity_number: "رقم الهوية مستخدم مسبقاً",
    phone_number: "رقم الجوال غير صحيح",
    email: "البريد الإلكتروني غير صحيح"
  }
}
```

## Common Error Messages

| Arabic Message | English Translation | Cause |
|---------------|---------------------|-------|
| رقم الهوية مستخدم مسبقاً | Identity number already used | Duplicate identity number |
| رقم الشريحة مستخدم مسبقاً | SIM number already used | Duplicate SIM number |
| رقم الجوال غير صحيح | Phone number invalid | Invalid phone format |
| البريد الإلكتروني غير صحيح | Email invalid | Invalid email format |
| تاريخ الميلاد لا يمكن أن يكون في المستقبل | Birth date cannot be in future | Date validation failed |
| هذا الحقل مطلوب | This field is required | Missing required field |

## Advanced Usage

### Skip Validation (Use with caution!)

```typescript
const result = await FormFillerAgent.fillSalamForm(
  formData,
  {
    userId: user.id,
    username: user.username,
    skipValidation: true,  // Skips all validation
  }
);
```

### Allow Duplicates (Use with caution!)

```typescript
const result = await FormFillerAgent.fillSalamForm(
  formData,
  {
    userId: user.id,
    username: user.username,
    allowDuplicates: true,  // Allows duplicate identity/SIM numbers
  }
);
```

### Batch Processing

```typescript
const formsData = [
  { /* form 1 */ },
  { /* form 2 */ },
  { /* form 3 */ },
];

const result = await FormFillerAgent.fillFormsBatch(
  'salam',
  formsData,
  {
    userId: user.id,
    username: user.username,
  }
);

console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`);

// Check individual results
result.results.forEach((res, index) => {
  if (res.success) {
    console.log(`Form ${index + 1}: ✓ ${res.customerId}`);
  } else {
    console.log(`Form ${index + 1}: ✗ ${res.message}`);
  }
});
```

## Files Structure

```
src/
├── lib/
│   └── agents/
│       ├── field-validator.ts      # Field validation logic
│       ├── form-schemas.ts         # Form definitions and rules
│       ├── form-filler.ts          # Main agent logic
│       ├── index.ts                # Exports
│       └── README.md               # Detailed documentation
├── app/
│   └── api/
│       └── agents/
│           ├── fill-form/
│           │   └── route.ts        # Single form API
│           └── fill-forms-batch/
│               └── route.ts        # Batch API
└── examples/
    └── test-form-filler.ts         # Usage examples

```

## Examples

Complete examples are available in:
- `/examples/test-form-filler.ts` - Comprehensive examples
- `/src/lib/agents/README.md` - Detailed documentation

## Need Help?

1. Check the documentation: `/src/lib/agents/README.md`
2. Review examples: `/examples/test-form-filler.ts`
3. API reference: See the API endpoints section above

## Notes

- All validation is performed before database insertion
- Uniqueness checks are performed on `identity_number` and `sim_number`
- User authentication is required for API endpoints
- Batch operations have a limit of 100 forms per request
- All form data is automatically trimmed before insertion
