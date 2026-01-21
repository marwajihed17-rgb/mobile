# PAA Solutions SaaS Platform

A modern, Arabic-first SaaS platform for managing customer data across multiple telecom projects (Salam and Mobily). Built with Next.js 14, Supabase, and optimized for RTL (Right-to-Left) layouts.

## 🌟 Features

- **Multi-Project Management**: Separate workflows for Salam (7 fields) and Mobily (13 fields) projects
- **Role-Based Access Control**: Three user roles (User, Admin, Super Admin) with granular permissions
- **Arabic-First Design**: Fully RTL-optimized with Arabic typography and cultural considerations
- **Real-Time Statistics**: Dashboard with daily and total customer counts per project
- **Automated Form Filling**: AI-powered form validation and duplicate detection
- **Hijri Calendar Support**: Both Gregorian and Hijri date inputs for Mobily project
- **Secure Authentication**: Email/username login with Supabase authentication
- **Admin Panel**: Comprehensive user management and data viewing capabilities

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Features Overview](#features-overview)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server components
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom RTL configuration

### Backend
- **Supabase** - PostgreSQL database + Authentication + Storage
- **Supabase SSR** - Server-side rendering support

### UI/UX
- **Lucide React** - Icon library
- **Custom Arabic Fonts** - Tajawal and Cairo from Google Fonts
- **Dark Theme** - Optimized color palette for dark backgrounds

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd design-cellular
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**

   Run the main migration file in your Supabase SQL Editor:
   ```bash
   # The migration file is located at:
   supabase/migrations/final_database_fix.sql
   ```

   Or use the cleaned schema:
   ```bash
   supabase/schema.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. Create your first admin user using the admin creation script:
   ```bash
   node scripts/create-predefined-users.js
   ```

2. Log in with your admin credentials at `/login`

3. Start creating users and managing projects!

## 📁 Project Structure

```
design-cellular/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication pages
│   │   │   ├── login/           # Login page
│   │   │   ├── signup/          # Signup page
│   │   │   └── forgot-password/ # Password reset
│   │   ├── (protected)/         # Protected routes
│   │   │   ├── dashboard/       # User dashboard
│   │   │   ├── admin/           # Admin panel
│   │   │   ├── salam/           # Salam project forms
│   │   │   ├── mobily/          # Mobily project forms
│   │   │   └── profile/         # User profile
│   │   ├── api/                 # API routes
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   │   ├── ui/                  # UI primitives
│   │   └── layout/              # Layout components
│   ├── lib/                     # Utilities & libraries
│   │   ├── agents/              # Form filling automation
│   │   └── supabase/            # Supabase clients
│   └── types/                   # TypeScript definitions
│
├── supabase/                     # Supabase configuration
│   ├── migrations/              # Database migrations
│   │   ├── archive/             # Old/unused migrations
│   │   ├── final_database_fix.sql  # Recommended migration
│   │   └── README.md            # Migration documentation
│   └── schema.sql               # Clean database schema
│
├── docs/                        # Documentation
│   ├── setup/                   # Setup guides
│   ├── guides/                  # Feature guides
│   ├── troubleshooting/         # Problem solving
│   └── reference/               # Technical reference
│
├── scripts/                     # Helper scripts
├── examples/                    # Example files
├── public/                      # Static assets
└── README.md                    # This file
```

## 🔑 Environment Variables

Create a `.env.local` file in the root directory with these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change for production
```

> **⚠️ Security Note**: Never commit `.env.local` to version control. Use `.env.example` as a template.

## 💾 Database Setup

### Tables

The application uses the following main tables:

1. **profiles** - User profiles with role-based access
2. **user_settings** - User preferences
3. **salam_customers** - Salam project customer data (7 fields)
4. **mobily_customers** - Mobily project customer data (13 fields)
5. **audit_logs** - System audit trail

### Migrations

All migrations are located in `supabase/migrations/`. For fresh database setup:

1. Use `final_database_fix.sql` for a complete setup, or
2. Use `schema.sql` for a clean schema

For detailed migration information, see [supabase/migrations/README.md](supabase/migrations/README.md)

## ✨ Features Overview

### User Dashboard
- View recent entries (last 5 per project)
- Quick access to Salam and Mobily forms
- Delete own entries
- Project statistics

### Admin Panel
- **Dashboard Tab**: Daily and total statistics for both projects
- **Salam Tab**: View all Salam customers with search/filter
- **Mobily Tab**: View all Mobily customers with search/filter
- **Settings Tab**: Create and manage users

### Salam Project (7 Fields)
- Name
- Identity Number
- Phone Number
- SIM Number
- Device Number
- Nationality
- Register Number

### Mobily Project (13 Fields)
All Salam fields plus:
- Birth Date (with Hijri/Gregorian calendar)
- Identity Expiry Date (with calendar type)
- Package
- Email
- City
- District

### Form Validation
- Automatic duplicate detection for identity numbers and SIM numbers
- Field-level validation
- Real-time feedback
- Unique constraints per project

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Setup Guides](docs/setup/)** - Getting started and deployment
- **[Feature Guides](docs/guides/)** - Using specific features
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions
- **[Reference](docs/reference/)** - Technical documentation

See [docs/README.md](docs/README.md) for a complete documentation index.

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

For detailed deployment instructions, see [docs/setup/DEPLOYMENT.md](docs/setup/DEPLOYMENT.md)

### Environment Variables for Production

Make sure to update these for production:
- `NEXT_PUBLIC_APP_URL` - Your production URL
- All Supabase credentials should be from your production Supabase project

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure authentication with Supabase
- Environment variables for sensitive data
- HTTPS enforced in production

## 🧪 Testing

Run type checking:
```bash
npm run type-check
```

Run linting:
```bash
npm run lint
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For issues, questions, or support:
1. Check the [documentation](docs/README.md)
2. Review [troubleshooting guides](docs/troubleshooting/)
3. Contact the development team

## 🎯 Roadmap

- [ ] Export data to Excel/CSV
- [ ] Advanced reporting and analytics
- [ ] Bulk import functionality
- [ ] Mobile app version
- [ ] Email notifications
- [ ] API for third-party integrations

## 👥 Team

Developed by PAA Solutions

---

**Built with ❤️ using Next.js and Supabase**
