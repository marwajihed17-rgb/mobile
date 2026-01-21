# Form Filling Agent

Automated form filling system for Salam and Mobily customer forms.

## Features

- **Automated Form Validation**: Validates all fields according to project-specific rules
- **Uniqueness Checks**: Prevents duplicate identity numbers and SIM numbers
- **Batch Processing**: Fill multiple forms at once
- **Error Handling**: Comprehensive error messages in Arabic
- **Type Safety**: Full TypeScript support with type definitions

## Components

### 1. FormFillerAgent

Main agent class that handles form filling operations.

#### Methods

- `fillSalamForm(formData, options)` - Fill a Salam customer form
- `fillMobilyForm(formData, options)` - Fill a Mobily customer form
- `fillForm(projectType, formData, options)` - Generic form filling method
- `fillFormsBatch(projectType, formsData, options)` - Fill multiple forms in batch

### 2. FieldValidator

Validates form field values and checks uniqueness constraints.

#### Methods

- `validateFields(data, rules)` - Validate all fields according to rules
- `checkIdentityNumberUniqueness(identityNumber, projectType)` - Check if identity number exists
- `checkSimNumberUniqueness(simNumber, projectType)` - Check if SIM number exists
- `isValidEmail(email)` - Validate email format
- `isValidPhoneNumber(phone)` - Validate Saudi phone number format
- `isValidDate(date)` - Validate date format
- `isNotFutureDate(date)` - Check if date is not in the future
- `isFutureDate(date)` - Check if date is in the future

### 3. Form Schemas

Defines the structure and validation rules for each form.

- `salamFormSchema` - Salam form schema (7 fields)
- `mobilyFormSchema` - Mobily form schema (13 fields)
- `getFormSchema(projectType)` - Get schema by project type
- `getRequiredFields(projectType)` - Get required fields for a project

## Usage

### Basic Example

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
    userId: 'user-id',
    username: 'username',
  }
);

if (result.success) {
  console.log('Form filled successfully!');
  console.log('Customer ID:', result.customerId);
} else {
  console.error('Errors:', result.errors);
}
```

### Batch Processing

```typescript
import { FormFillerAgent } from '@/lib/agents';

const formsData = [
  {
    name: 'أحمد محمد',
    identity_number: '1234567890',
    phone_number: '0512345678',
    // ... other fields
  },
  {
    name: 'فاطمة علي',
    identity_number: '0987654321',
    phone_number: '0523456789',
    // ... other fields
  },
];

const result = await FormFillerAgent.fillFormsBatch(
  'salam',
  formsData,
  {
    userId: 'user-id',
    username: 'username',
  }
);

console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`);
```

### With Options

```typescript
const result = await FormFillerAgent.fillMobilyForm(
  formData,
  {
    userId: 'user-id',
    username: 'username',
    skipValidation: false, // Set to true to skip validation
    allowDuplicates: false, // Set to true to allow duplicate identity/SIM numbers
  }
);
```

## API Endpoints

### POST /api/agents/fill-form

Fill a single form.

**Request:**
```json
{
  "projectType": "salam",
  "formData": {
    "name": "أحمد محمد",
    "identity_number": "1234567890",
    "phone_number": "0512345678",
    "sim_number": "12345678",
    "device_number": "87654321",
    "nationality": "سعودي",
    "register_number": "REG001"
  },
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

### POST /api/agents/fill-forms-batch

Fill multiple forms at once.

**Request:**
```json
{
  "projectType": "mobily",
  "formsData": [
    { /* form data 1 */ },
    { /* form data 2 */ }
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
  "results": [
    { "success": true, "message": "تم حفظ البيانات بنجاح", "customerId": "uuid1" },
    { "success": false, "message": "رقم الهوية مستخدم مسبقاً", "errors": {...} }
  ],
  "successCount": 1,
  "failureCount": 1
}
```

## Form Fields

### Salam Form (7 fields)
- `name` - Customer name (string, required)
- `identity_number` - National ID (10 digits, required, unique)
- `phone_number` - Phone number (Saudi format, required)
- `sim_number` - SIM card number (required, unique)
- `device_number` - Device IMEI (required)
- `nationality` - Nationality (string, required)
- `register_number` - Registration number (string, required)

### Mobily Form (13 fields)
- `name` - Customer name (string, required)
- `identity_number` - National ID (10 digits, required, unique)
- `nationality` - Nationality (string, required)
- `phone_number` - Phone number (Saudi format, required)
- `birth_date` - Date of birth (YYYY-MM-DD, required, must be in past)
- `identity_expiry_date` - ID expiry date (YYYY-MM-DD, required, must be in future)
- `package` - Subscription package (string, required)
- `email` - Email address (valid email format, required)
- `sim_number` - SIM card number (required, unique)
- `device_number` - Device IMEI (required)
- `city` - City (string, required)
- `district` - District (string, required)
- `register_number` - Registration number (string, required)

## Validation Rules

### Identity Number
- Must be exactly 10 digits
- Must be unique within the project
- Pattern: `^\d{10}$`

### Phone Number
- Saudi format: `05XXXXXXXX` or `+9665XXXXXXXX`
- Spaces are automatically removed

### Email (Mobily only)
- Must be a valid email format
- Pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### Dates (Mobily only)
- Format: `YYYY-MM-DD`
- `birth_date`: Must be in the past
- `identity_expiry_date`: Must be in the future

### SIM Number
- 8-20 characters
- Must be unique within the project

## Error Handling

The agent returns detailed error messages in Arabic:

```typescript
{
  success: false,
  message: "يرجى تصحيح الأخطاء في النموذج",
  errors: {
    identity_number: "رقم الهوية مستخدم مسبقاً",
    email: "البريد الإلكتروني غير صحيح"
  }
}
```

## Testing

See `/examples/test-form-filler.ts` for complete examples and test cases.
