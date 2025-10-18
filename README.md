# TherapyConnect

A modern web platform connecting patients with qualified mental health professionals. TherapyConnect helps therapists build their professional online profiles and allows patients to find the right therapist based on specialty, insurance, language, and more.

## Features

### For Patients
- **Advanced Search & Filtering**: Find therapists by specialty, insurance, location, language, age group, and more
- **Detailed Profiles**: View therapist credentials, specialties, approach, rates, and availability
- **Professional Verification**: All therapist profiles are admin-approved for quality assurance

### For Therapists
- **Profile Management**: Create and manage comprehensive professional profiles
- **Multi-Step Setup**: Easy 5-step profile creation wizard
- **Profile Analytics**: Track profile views and completion status
- **Dashboard**: Manage your information, credentials, and availability

### For Administrators
- **Approval Workflow**: Review and approve/reject therapist profiles
- **Quality Control**: Ensure all listed therapists meet platform standards
- **Admin Dashboard**: Manage pending and active therapist listings

## Tech Stack

### Frontend
- **React 18.3** with TypeScript
- **Vite 5.4** for fast builds and HMR
- **Tailwind CSS 3.4** for styling
- **Shadcn UI** component library (Radix UI based)
- **TanStack Query** for data fetching and caching
- **React Hook Form** with Zod validation
- **Wouter** for routing

### Backend
- **Node.js 20** with Express.js
- **TypeScript** throughout
- **PostgreSQL** database
- **Drizzle ORM** for type-safe database queries
- **bcryptjs** for password hashing
- **express-session** for authentication

### Additional Tools
- **Lucide React** for icons
- **date-fns** for date handling
- **Recharts** for analytics
- **Framer Motion** for animations

## Prerequisites

- **Node.js** 20 or higher
- **npm** or **yarn**
- **PostgreSQL** database (Supabase recommended)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/therapyconnect.git
cd therapyconnect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secure-random-secret-here
NODE_ENV=development
PORT=5000
```

**To generate a secure SESSION_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any random string generator
```

### 4. Set Up Database

#### Option A: Supabase (Recommended)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database > Connection String
4. Copy the connection string and add it to your `.env` file
5. Run migrations:

```bash
npm run db:push
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb therapyconnect`
3. Update `DATABASE_URL` in `.env`
4. Run migrations:

```bash
npm run db:push
```

### 5. Create Admin Account (Optional)

```bash
npx tsx scripts/create-admin.ts
```

This creates an admin user:
- Email: `admin@therapyconnect.com`
- Password: `admin123`

**Important**: Change this password after first login in production!

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Build frontend and backend for production
npm start            # Start production server

# Database
npm run db:push      # Apply database migrations
npm run db:studio    # Open Drizzle Studio (database GUI)

# Type Checking
npm run check        # Run TypeScript type checking
```

## Project Structure

```
therapyconnect/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components (10 pages)
│   │   ├── components/    # UI components (49+ components)
│   │   ├── lib/           # Utilities and configurations
│   │   ├── hooks/         # Custom React hooks
│   │   ├── App.tsx        # Main router
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API endpoints (24 routes)
│   ├── storage.ts        # Database operations
│   ├── db.ts             # Database connection
│   └── vite.ts           # Vite dev server setup
├── shared/               # Shared code between client/server
│   └── schema.ts         # Database schemas, types, validators
├── migrations/           # Database migration files
├── scripts/              # Utility scripts
└── dist/                 # Production build output (generated)
```

## API Endpoints

### Public Routes
- `GET /api/therapists` - Get all approved therapists (with filters)
- `GET /api/therapists/:id` - Get single therapist profile

### Authentication
- `POST /api/auth/signup` - Register new therapist account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

### Therapist Routes (Protected)
- `GET /api/therapist/profile` - Get own profile
- `POST /api/therapist/profile` - Create/update profile
- `POST /api/therapist/submit` - Submit profile for approval
- `DELETE /api/therapist/profile` - Delete profile

### Admin Routes (Protected)
- `GET /api/admin/therapists` - Get all therapists
- `GET /api/admin/therapists/pending` - Get pending approvals
- `POST /api/admin/therapists/:id/approve` - Approve therapist
- `POST /api/admin/therapists/:id/reject` - Reject therapist

## Database Schema

### Tables

**users**
- Therapist accounts (credentials, status)

**therapists**
- Professional profiles (bio, specialties, credentials, etc.)

**admin_users**
- Administrator accounts

See `migrations/0000_nasty_smiling_tiger.sql` for full schema.

## Deployment

### Recommended Platforms

This is a full-stack application that requires:
1. Node.js runtime for the Express backend
2. PostgreSQL database
3. Static file hosting for the frontend

**Recommended Options:**

#### 1. Replit (Easiest - Already Configured)
- Configuration already included in `.replit`
- Automatic builds and deployments
- Built-in database options

#### 2. Railway.app
1. Connect your GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically on push

#### 3. Render.com
1. Create a new Web Service
2. Add PostgreSQL database
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

#### 4. DigitalOcean App Platform
- Full control over deployment
- Managed PostgreSQL available
- Auto-deploy from GitHub

### Deployment Checklist

- [ ] Set up production PostgreSQL database
- [ ] Set environment variables in hosting platform:
  - `DATABASE_URL`
  - `SESSION_SECRET` (generate new secure key!)
  - `NODE_ENV=production`
- [ ] Run database migrations: `npm run db:push`
- [ ] Create admin account: `npx tsx scripts/create-admin.ts`
- [ ] Test the application
- [ ] Update admin password from default

### Environment Variables for Production

```env
DATABASE_URL=postgresql://...      # Production database URL
SESSION_SECRET=<secure-random>     # Generate new for production!
NODE_ENV=production
PORT=5000
```

**Security Notes:**
- Never commit `.env` to version control (already in `.gitignore`)
- Generate a new `SESSION_SECRET` for production
- Change default admin password immediately
- Use HTTPS in production (most platforms provide this automatically)

## Development Notes

### Design System

The application uses a healthcare-focused design system:
- Primary color: Teal (#14B8A6)
- Professional, accessible UI
- Responsive design (mobile-first)
- Consistent spacing and typography

See `design_guidelines.md` for complete design specifications.

### Code Quality

- **TypeScript**: Full type safety throughout
- **ESLint**: Code linting configured
- **Type Checking**: Run `npm run check` before commits
- **No TODOs**: All features are complete

## Features Roadmap

Current version is production-ready with core features. Future enhancements could include:

- Email verification during signup
- Password reset functionality
- Email notifications for profile status changes
- Advanced analytics for therapists
- Patient appointment booking system
- Video consultation integration
- Reviews and ratings system
- Insurance verification

## Support

For issues or questions:
1. Check existing documentation
2. Review API endpoint documentation above
3. Check database schema in `migrations/`
4. Create an issue on GitHub

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

---

**Built with** ❤️ **for mental health professionals and the patients they serve**
