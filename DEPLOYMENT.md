# PAA Solutions SaaS - Deployment Guide

This guide provides complete instructions for deploying the PAA Solutions SaaS application using Supabase (backend) and Vercel (hosting).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Supabase Setup](#supabase-setup)
4. [Database Schema Setup](#database-schema-setup)
5. [Environment Variables](#environment-variables)
6. [Vercel Deployment](#vercel-deployment)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] A [Supabase](https://supabase.com) account
- [ ] A [Vercel](https://vercel.com) account
- [ ] A GitHub repository for this project

---

## Project Structure

```
paa-solutions-saas/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (protected)/        # Protected pages (require auth)
│   │   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   ├── profile/
│   │   │   └── chat/[module]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/             # React components
│   │   ├── ui/                 # UI primitives
│   │   └── layout/             # Layout components
│   ├── lib/                    # Utilities
│   │   ├── supabase/           # Supabase clients
│   │   ├── auth.ts
│   │   ├── storage.ts
│   │   └── utils.ts
│   ├── types/                  # TypeScript types
│   │   └── database.ts
│   └── middleware.ts           # Auth middleware
├── supabase/
│   └── schema.sql              # Database schema
├── public/                     # Static assets
├── .env.example                # Environment template
├── .env.local                  # Local environment (gitignored)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── vercel.json
```

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - **Name**: `paa-solutions` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned

### 2. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: For client-side access
   - **service_role key**: For server-side admin operations (keep secret!)

### 3. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Configure email templates in **Authentication** → **Email Templates**
4. Go to **Authentication** → **URL Configuration**
5. Set:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production URLs later

---

## Database Schema Setup

### 1. Run the Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the file `supabase/schema.sql` from this project
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run**

This will create:
- All database tables (profiles, module_access, user_settings, chat_messages, file_uploads, audit_logs)
- Custom types/enums (user_role, user_status, module_type)
- Database functions (is_admin, is_super_admin, get_user_modules)
- Triggers (auto-update timestamps, new user setup)
- Row Level Security policies
- Storage buckets (uploads, avatars)

### 2. Verify Setup

After running the schema, verify in **Table Editor**:
- [x] `profiles` table exists
- [x] `module_access` table exists
- [x] `user_settings` table exists
- [x] `chat_messages` table exists
- [x] `file_uploads` table exists
- [x] `audit_logs` table exists

In **Storage**:
- [x] `uploads` bucket exists
- [x] `avatars` bucket exists

### 3. Create First Admin User

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email and password for your admin
4. After user is created, go to **Table Editor** → **profiles**
5. Find the new user and change `role` from `user` to `super_admin`

---

## Environment Variables

### Local Development

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service role key for admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)

Add these environment variables in Vercel:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Service role key (sensitive!) |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL |

---

## Vercel Deployment

### Method 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or the project folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave default
6. Add environment variables (see table above)
7. Click **Deploy**

### Method 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (will prompt for settings)
vercel

# Deploy to production
vercel --prod
```

### Post-Deployment Steps

1. Copy your Vercel deployment URL (e.g., `https://paa-solutions.vercel.app`)
2. Go to Supabase → **Authentication** → **URL Configuration**
3. Update:
   - **Site URL**: Your Vercel URL
   - **Redirect URLs**: Add your Vercel URL

---

## Post-Deployment Configuration

### 1. Update Supabase Auth URLs

In Supabase Dashboard → **Authentication** → **URL Configuration**:

```
Site URL: https://your-app.vercel.app
Redirect URLs:
  - https://your-app.vercel.app/**
  - http://localhost:3000/** (for local dev)
```

### 2. Configure Email Templates

In Supabase → **Authentication** → **Email Templates**:

Update the templates to include your brand name and URLs:
- Confirmation email
- Password reset email
- Magic link email

### 3. Enable Real-time (Optional)

For real-time chat updates:
1. Go to **Database** → **Replication**
2. Enable replication for `chat_messages` table

### 4. Set Up Custom Domain (Optional)

In Vercel:
1. Go to your project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Security Checklist

Before going live, ensure:

- [ ] All environment variables are set correctly
- [ ] Service role key is NOT exposed to client
- [ ] RLS policies are enabled on all tables
- [ ] Storage bucket policies are configured
- [ ] Email verification is enabled (optional)
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Supabase URL whitelist is configured
- [ ] First admin user is set up

---

## Troubleshooting

### "Invalid API key" Error

- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check that the key is properly formatted (no extra spaces)
- Ensure environment variables are deployed to Vercel

### "Permission denied" Errors

- Check RLS policies are correctly set up
- Verify user has appropriate role/access
- Check that the user is authenticated

### "Table doesn't exist" Errors

- Ensure you ran the complete `schema.sql`
- Check for SQL errors when running the schema
- Verify tables exist in Supabase Table Editor

### Authentication Redirect Issues

- Update Site URL in Supabase Auth settings
- Add all valid redirect URLs to the whitelist
- Clear browser cookies/cache

### Build Failures on Vercel

- Check Node.js version matches (18+)
- Verify all dependencies are in package.json
- Check for TypeScript errors locally first

---

## Maintenance

### Database Backups

Supabase provides automatic backups on Pro plans. For free tier:
1. Go to **Database** → **Backups**
2. Download manual backups periodically

### Monitoring

- Use Vercel Analytics for frontend performance
- Use Supabase Dashboard for database metrics
- Set up error tracking (e.g., Sentry) for production

### Scaling

For higher traffic:
- Upgrade Supabase plan for more connections
- Enable Vercel Edge Functions for faster responses
- Consider CDN for static assets

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs

For issues with this project, please open a GitHub issue.
