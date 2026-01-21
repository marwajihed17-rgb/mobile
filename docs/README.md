# PAA Solutions SaaS - Documentation

Welcome to the documentation for the PAA Solutions SaaS platform. This documentation is organized into several categories to help you find what you need quickly.

## 📚 Documentation Structure

### Setup Guides (`setup/`)
Step-by-step instructions for getting the project up and running:

- **[QUICK_START.md](setup/QUICK_START.md)** - Quick start guide for developers
- **[DEPLOYMENT.md](setup/DEPLOYMENT.md)** - Deployment instructions for production
- **[SUPABASE_AUTH_SETUP_GUIDE.md](setup/SUPABASE_AUTH_SETUP_GUIDE.md)** - Setting up Supabase authentication
- **[SUPABASE_INTEGRATION.md](setup/SUPABASE_INTEGRATION.md)** - Integrating Supabase into the project
- **[SUPABASE_DASHBOARD_SETUP.md](SUPABASE_DASHBOARD_SETUP.md)** - Dashboard setup in Supabase

### Feature Guides (`guides/`)
Instructions for using specific features:

- **[FORM_FILLER_GUIDE.md](guides/FORM_FILLER_GUIDE.md)** - Using the automated form filler agent

### Troubleshooting (`troubleshooting/`)
Solutions for common issues:

- **[ADMIN_DASHBOARD_FIX.md](troubleshooting/ADMIN_DASHBOARD_FIX.md)** - Fixing admin dashboard issues
- **[DATABASE_FIX_SUMMARY.md](troubleshooting/DATABASE_FIX_SUMMARY.md)** - Summary of database fixes
- **[FIX_USER_CREATION.md](troubleshooting/FIX_USER_CREATION.md)** - Fixing user creation issues
- **[QUICK_FIX_GUIDE.md](troubleshooting/QUICK_FIX_GUIDE.md)** - Quick fixes for common problems
- **[TROUBLESHOOTING_USER_CREATION.md](troubleshooting/TROUBLESHOOTING_USER_CREATION.md)** - Detailed user creation troubleshooting

### Reference (`reference/`)
Technical reference and migration documentation:

- **[CUSTOMERS_TABLE_MIGRATION.md](reference/CUSTOMERS_TABLE_MIGRATION.md)** - Customer table migration details
- **[DATABASE_CLEANUP_MIGRATION.md](reference/DATABASE_CLEANUP_MIGRATION.md)** - Database cleanup procedures
- **[MIGRATION_GUIDE.md](reference/MIGRATION_GUIDE.md)** - General migration guide
- **[MIGRATION_INSTRUCTIONS.md](reference/MIGRATION_INSTRUCTIONS.md)** - Detailed migration instructions

### Design System
HTML documentation for the UI design system:

- **[animations.html](animations.html)** - Animation system documentation
- **[components.html](components.html)** - Component library documentation
- **[style-guide.html](style-guide.html)** - Visual style guide
- **[user-flows.html](user-flows.html)** - User flow diagrams

## 🚀 Quick Links

### For New Developers
1. Start with [QUICK_START.md](setup/QUICK_START.md)
2. Set up authentication: [SUPABASE_AUTH_SETUP_GUIDE.md](setup/SUPABASE_AUTH_SETUP_GUIDE.md)
3. Review the migration guide: [MIGRATION_GUIDE.md](reference/MIGRATION_GUIDE.md)

### For Deployment
1. Review [DEPLOYMENT.md](setup/DEPLOYMENT.md)
2. Check [SUPABASE_DASHBOARD_SETUP.md](SUPABASE_DASHBOARD_SETUP.md)

### For Troubleshooting
1. Check [QUICK_FIX_GUIDE.md](troubleshooting/QUICK_FIX_GUIDE.md) first
2. For user creation issues: [TROUBLESHOOTING_USER_CREATION.md](troubleshooting/TROUBLESHOOTING_USER_CREATION.md)
3. For database issues: [DATABASE_FIX_SUMMARY.md](troubleshooting/DATABASE_FIX_SUMMARY.md)

## 📋 Project Overview

This is a Next.js 14 application built with:
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS (RTL/Arabic optimized)
- **Features**:
  - Multi-project customer management (Salam & Mobily)
  - Role-based access control (User, Admin, Super Admin)
  - Automated form filling agents
  - Hijri/Gregorian calendar support
  - Real-time statistics and dashboards

## 🤝 Contributing

When adding new documentation:
1. Place setup guides in `setup/`
2. Place feature guides in `guides/`
3. Place troubleshooting docs in `troubleshooting/`
4. Place technical reference in `reference/`
5. Update this README with links to new documents
