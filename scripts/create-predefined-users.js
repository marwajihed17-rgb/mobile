/**
 * ============================================
 * SUPABASE PREDEFINED USERS CREATION SCRIPT
 * ============================================
 *
 * This script creates predefined admin and regular users
 * for the authentication system using Supabase Admin API.
 *
 * Prerequisites:
 * - Database schema must be created first (run rebuild_with_auth.sql)
 * - Environment variables must be set (.env.local)
 *
 * Usage:
 * node scripts/create-predefined-users.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables!');
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase Admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================
// PREDEFINED USERS CONFIGURATION
// ============================================

const PREDEFINED_USERS = [
  // Super Admin User
  {
    email: 'admin@paasolutions.com',
    password: 'Admin@2026',
    username: 'super_admin',
    full_name: 'Super Administrator',
    supervisor_name: 'System',
    role: 'super_admin',
    description: 'System Super Administrator with full access'
  },
  // Admin User
  {
    email: 'admin1@paasolutions.com',
    password: 'Admin1@2026',
    username: 'admin1',
    full_name: 'Admin User 1',
    supervisor_name: 'Super Admin',
    role: 'admin',
    description: 'Admin user with management privileges'
  },
  // Regular Users
  {
    email: 'user1@paasolutions.com',
    password: 'User1@2026',
    username: 'user1',
    full_name: 'Regular User 1',
    supervisor_name: 'Admin 1',
    role: 'user',
    description: 'Regular user with standard access'
  },
  {
    email: 'user2@paasolutions.com',
    password: 'User2@2026',
    username: 'user2',
    full_name: 'Regular User 2',
    supervisor_name: 'Admin 1',
    role: 'user',
    description: 'Regular user with standard access'
  },
  {
    email: 'user3@paasolutions.com',
    password: 'User3@2026',
    username: 'user3',
    full_name: 'Regular User 3',
    supervisor_name: 'Admin 1',
    role: 'user',
    description: 'Regular user with standard access'
  }
];

// ============================================
// USER CREATION FUNCTIONS
// ============================================

/**
 * Create a single user with the Supabase Admin API
 */
async function createUser(userData) {
  try {
    console.log(`\n📝 Creating user: ${userData.username} (${userData.email})...`);

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === userData.email);

    if (userExists) {
      console.log(`   ⚠️  User ${userData.email} already exists. Skipping...`);
      return { success: false, message: 'User already exists', existed: true };
    }

    // Create user with Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: userData.username,
        full_name: userData.full_name,
        supervisor_name: userData.supervisor_name,
        role: userData.role
      }
    });

    if (authError) {
      console.error(`   ❌ Error creating auth user: ${authError.message}`);
      return { success: false, error: authError.message };
    }

    console.log(`   ✅ Auth user created with ID: ${authData.user.id}`);

    // The profile and settings are automatically created by the trigger
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify profile was created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error(`   ⚠️  Warning: Profile verification failed: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profile created: ${profile.username} (${profile.role})`);
    }

    return {
      success: true,
      user: authData.user,
      profile: profile
    };

  } catch (error) {
    console.error(`   ❌ Unexpected error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Create all predefined users
 */
async function createAllUsers() {
  console.log('========================================');
  console.log('🚀 CREATING PREDEFINED USERS');
  console.log('========================================');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`👥 Total users to create: ${PREDEFINED_USERS.length}`);

  const results = {
    created: [],
    existed: [],
    failed: []
  };

  // Create users sequentially to avoid race conditions
  for (const userData of PREDEFINED_USERS) {
    const result = await createUser(userData);

    if (result.success) {
      results.created.push(userData);
    } else if (result.existed) {
      results.existed.push(userData);
    } else {
      results.failed.push({ user: userData, error: result.error });
    }

    // Small delay between user creations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Display results summary
 */
function displayResults(results) {
  console.log('\n========================================');
  console.log('📊 USER CREATION SUMMARY');
  console.log('========================================\n');

  console.log(`✅ Successfully created: ${results.created.length}`);
  results.created.forEach(user => {
    console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
  });

  if (results.existed.length > 0) {
    console.log(`\n⚠️  Already existed: ${results.existed.length}`);
    results.existed.forEach(user => {
      console.log(`   - ${user.username} - ${user.email}`);
    });
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed to create: ${results.failed.length}`);
    results.failed.forEach(({ user, error }) => {
      console.log(`   - ${user.username} - ${user.email}`);
      console.log(`     Error: ${error}`);
    });
  }

  console.log('\n========================================');
  console.log('📝 PREDEFINED USER CREDENTIALS');
  console.log('========================================\n');

  console.log('🔐 SUPER ADMIN:');
  console.log('   Username: super_admin');
  console.log('   Email: admin@paasolutions.com');
  console.log('   Password: Admin@2026');
  console.log('   Role: super_admin');
  console.log('   Redirect: /admin (Admin Dashboard)\n');

  console.log('🔐 ADMIN:');
  console.log('   Username: admin1');
  console.log('   Email: admin1@paasolutions.com');
  console.log('   Password: Admin1@2026');
  console.log('   Role: admin');
  console.log('   Redirect: /admin (Admin Dashboard)\n');

  console.log('🔐 REGULAR USERS:');
  console.log('   User 1:');
  console.log('     Username: user1');
  console.log('     Email: user1@paasolutions.com');
  console.log('     Password: User1@2026');
  console.log('     Role: user');
  console.log('     Redirect: /dashboard (User Dashboard)\n');

  console.log('   User 2:');
  console.log('     Username: user2');
  console.log('     Email: user2@paasolutions.com');
  console.log('     Password: User2@2026');
  console.log('     Role: user');
  console.log('     Redirect: /dashboard (User Dashboard)\n');

  console.log('   User 3:');
  console.log('     Username: user3');
  console.log('     Email: user3@paasolutions.com');
  console.log('     Password: User3@2026');
  console.log('     Role: user');
  console.log('     Redirect: /dashboard (User Dashboard)\n');

  console.log('========================================');
  console.log('✨ AUTHENTICATION FEATURES');
  console.log('========================================\n');

  console.log('✅ Login with Email OR Username');
  console.log('✅ Role-based Access Control (RBAC)');
  console.log('✅ Automatic Role-based Redirects:');
  console.log('   - Super Admin → /admin');
  console.log('   - Admin → /admin');
  console.log('   - User → /dashboard');
  console.log('✅ Row Level Security (RLS) enabled');
  console.log('✅ Secure password authentication');
  console.log('✅ User status management (active/inactive/suspended)');

  console.log('\n========================================');
  console.log('🎯 NEXT STEPS');
  console.log('========================================\n');

  console.log('1. Test login at: http://localhost:3000/login');
  console.log('2. Try logging in with different user roles');
  console.log('3. Verify automatic redirects based on roles');
  console.log('4. Check admin dashboard access control');
  console.log('5. Test user dashboard functionality');

  console.log('\n========================================');
  console.log('✅ SETUP COMPLETE!');
  console.log('========================================\n');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  try {
    const results = await createAllUsers();
    displayResults(results);

    if (results.failed.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
