# KareMatch

A modern web platform connecting patients with qualified mental health professionals. KareMatch helps therapists build their professional online profiles, manage their availability, and accept appointment bookings from patients.

## Features

### For Patients
- **Advanced Search & Filtering**: Find therapists by specialty, insurance, location, language, age group, and more
- **Detailed Profiles**: View therapist credentials, specialties, approach, rates, and availability
- **Professional Verification**: All therapist profiles are admin-approved for quality assurance
- **Appointment Booking**: Book appointments directly from therapist profiles with instant confirmation or request/approval workflow
- **Calendar Integration**: View available time slots in real-time

### For Therapists
- **Profile Management**: Create and manage comprehensive professional profiles
- **Multi-Step Setup**: Easy 5-step profile creation wizard
- **Profile Analytics**: Track profile views and completion status
- **Dashboard**: Manage your information, credentials, and availability
- **Appointment Scheduling**:
  - Set weekly availability with custom time slots
  - Configure instant booking or request/approval mode
  - Manage all appointments (approve, reject, cancel)
  - Block time for vacations or breaks
  - Set buffer time between appointments
  - Configure advance booking windows

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
- **react-calendar** for appointment booking UI
- **date-fns** for date handling

### Backend
- **Node.js 20** with Express.js
- **TypeScript** throughout
- **PostgreSQL** database (Supabase)
- **Drizzle ORM** for type-safe database queries
- **bcryptjs** for password hashing
- **express-session** with **connect-pg-simple** for persistent sessions

### Additional Tools
- **Lucide React** for icons
- **Recharts** for analytics
- **Framer Motion** for animations

## Prerequisites

- **Node.js** 20 or higher
- **npm** or **yarn**
- **PostgreSQL** database (Supabase recommended)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mylaiviet/KareMatch.git
cd KareMatch
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
# On Mac/Linux/Windows Git Bash
openssl rand -base64 32
```

### 4. Set Up Database

#### Option A: Supabase (Recommended)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database > Connection String
4. Copy the URI connection string and add it to your `.env` file
5. Run migrations:

```bash
npm run db:push
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb KareMatch`
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
- Email: `admin@KareMatch.com`
- Password: `admin123`

**Important**: Change this password after first login in production!

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) with API on `http://localhost:5000`

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
KareMatch/
├── client/         # React frontend
├── server/         # Express backend
├── shared/         # Shared types and schemas
├── docs/           # All documentation (see docs/README.md)
├── scripts/        # Deployment and utility scripts
├── migrations/     # Database migrations
└── terraform/      # Infrastructure as code (if applicable)
```

See [docs/README.md](docs/README.md) for complete documentation index.

## API Endpoints

### Public Routes
- `GET /api/therapists` - Get all approved therapists (with filters)
- `GET /api/therapists/:id` - Get single therapist profile
- `GET /api/therapists/:id/available-slots?date=YYYY-MM-DD` - Get available time slots
- `POST /api/therapists/:id/book` - Book an appointment

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

#### Availability Management
- `GET /api/therapist/availability` - Get weekly availability
- `POST /api/therapist/availability` - Add availability slot
- `PUT /api/therapist/availability/:id` - Update availability
- `DELETE /api/therapist/availability/:id` - Delete availability

#### Booking Settings
- `GET /api/therapist/booking-settings` - Get booking preferences
- `PUT /api/therapist/booking-settings` - Update booking preferences

#### Appointments
- `GET /api/therapist/appointments` - Get all appointments (with status filter)
- `PUT /api/therapist/appointments/:id/approve` - Approve pending appointment
- `PUT /api/therapist/appointments/:id/reject` - Reject pending appointment
- `PUT /api/therapist/appointments/:id/cancel` - Cancel appointment

#### Blocked Time
- `GET /api/therapist/blocked-time` - Get blocked time slots
- `POST /api/therapist/blocked-time` - Add blocked time (vacation, etc.)
- `DELETE /api/therapist/blocked-time/:id` - Remove blocked time

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

**therapist_availability**
- Weekly availability schedule (day of week, time slots)

**appointments**
- Patient appointment bookings (with status tracking)

**therapist_booking_settings**
- Booking preferences (instant vs request mode, buffer time, etc.)

**blocked_time_slots**
- Blocked time for vacations, breaks, etc.

**session**
- Persistent session storage (auto-created by connect-pg-simple)

See `shared/schema.ts` for complete schema definitions.

## Deployment

### Production Deployment on Render.com

This application is production-ready and deployed on Render. For detailed deployment instructions and troubleshooting, see [SCHEDULING_DEPLOYMENT_GUIDE.md](SCHEDULING_DEPLOYMENT_GUIDE.md).

**Live URL**: https://KareMatch-1ec4.onrender.com

#### Quick Deploy Checklist

1. **Set up PostgreSQL database** (Supabase recommended)
2. **Set environment variables** in Render:
   ```env
   DATABASE_URL=postgresql://...
   SESSION_SECRET=<generate-with-openssl-rand-base64-32>
   NODE_ENV=production
   ```
3. **Build Command**: `npm run build`
4. **Start Command**: `npm run start`
5. **Deploy** - Render auto-deploys on git push

#### Critical Production Requirements

**Session Management** (see SCHEDULING_DEPLOYMENT_GUIDE.md for details):
- ✅ PostgreSQL session store (`connect-pg-simple`)
- ✅ Trust proxy setting (`app.set("trust proxy", 1)`)
- ✅ SameSite cookie attribute (`sameSite: "none"` for production)

**Local Development**:
- ✅ Vite API proxy configuration (forwards `/api` to Express)

### Environment Variables for Production

```env
DATABASE_URL=postgresql://...      # Production database URL (Supabase)
SESSION_SECRET=<secure-random>     # Generate new for production!
NODE_ENV=production
PORT=5000                         # Render provides this automatically
```

**Security Notes:**
- Never commit `.env` to version control (already in `.gitignore`)
- Generate a new `SESSION_SECRET` for production
- Change default admin password immediately
- HTTPS is provided automatically by Render

## Development Status

### ✅ Completed Features (Production Ready)

#### Phase 1: Core Platform
- ✅ User authentication (signup, login, logout)
- ✅ Therapist profile creation (5-step wizard)
- ✅ Advanced search & filtering
- ✅ Admin approval workflow
- ✅ Therapist dashboard
- ✅ Profile analytics
- ✅ Responsive design

#### Phase 2: Appointment Scheduling System
- ✅ Database schema (4 new tables)
- ✅ Backend API (16 scheduling endpoints)
- ✅ Therapist availability management
- ✅ Booking settings (instant vs request mode)
- ✅ Appointment management (approve/reject/cancel)
- ✅ Patient booking calendar
- ✅ Time slot availability calculation
- ✅ Blocked time management
- ✅ Session persistence (PostgreSQL)
- ✅ Production deployment (Render)

### 🚧 In Progress / Next Steps

#### Phase 3: Email Notifications (Planned)
- ⏳ Email verification during signup
- ⏳ Password reset functionality
- ⏳ Appointment confirmation emails
- ⏳ Reminder emails (24 hours before appointment)
- ⏳ Profile approval/rejection notifications
- ⏳ Cancellation notifications

#### Phase 4: Calendar Sync (Optional)
- ⏳ Google Calendar integration
- ⏳ Outlook Calendar integration
- ⏳ Two-way sync (KareMatch ↔ External calendars)
- ⏳ Automatic availability updates

#### Phase 5: Enhanced Features (Future)
- ⏳ Video consultation integration
- ⏳ Reviews and ratings system
- ⏳ Insurance verification
- ⏳ Payment processing
- ⏳ Therapist messaging system
- ⏳ Advanced analytics dashboard

## Documentation

- **README.md** (this file) - Project overview and setup
- **SCHEDULING_DEPLOYMENT_GUIDE.md** - Complete scheduling system deployment guide
  - System architecture
  - Database schema details
  - All deployment issues encountered and solutions
  - Local development setup
  - Production deployment checklist
  - Common errors and fixes
  - Testing procedures

## Key Learnings & Best Practices

### Session Management in Production
1. **Always use persistent session storage** (PostgreSQL, Redis, etc.)
2. **Configure trust proxy** for reverse proxy environments (Render, Vercel, etc.)
3. **Set proper cookie attributes** (`sameSite: "none"` with `secure: true` for HTTPS)

### Local Development
1. **Use Vite proxy** to forward API requests from frontend dev server to backend
2. **Keep MemoryStore** for development (faster, simpler)
3. **Use environment variables** for different configs

### Deployment
1. **Generate secure SESSION_SECRET** (min 32 characters)
2. **Set NODE_ENV=production** in hosting platform
3. **Test session persistence** after deployment
4. **Clear browser cookies** when testing auth changes

## AWS Deployment (Production-Ready)

KareMatch includes a complete AWS infrastructure setup for production deployment.

### Quick Start

```bash
# 1. Setup AWS infrastructure (VPC, RDS, ECS, etc.)
npm run aws:setup

# 2. Build and push Docker image
npm run aws:build

# 3. Deploy backend and frontend
npm run aws:deploy
```

### Architecture

- **ECS Fargate**: Containerized backend (auto-scaling)
- **RDS PostgreSQL**: Managed database with automated backups
- **Application Load Balancer**: HTTPS termination and routing
- **S3 + CloudFront**: Global CDN for frontend
- **Secrets Manager**: Secure credential storage
- **CloudWatch**: Logging and monitoring

**Features**:
- ✅ HIPAA-compliant (encryption at rest and in transit)
- ✅ Multi-AZ high availability
- ✅ Auto-scaling based on load
- ✅ Zero-downtime deployments
- ✅ Automated backups and disaster recovery

### Documentation

- **[AWS Deployment Guide](docs/AWS-DEPLOYMENT.md)**: Complete deployment instructions
- **[AWS Architecture](docs/AWS-ARCHITECTURE.md)**: Technical architecture details
- **[Migration Plan](AWS-MIGRATION-PLAN-MAP.md)**: Implementation roadmap
- **[Progress Tracker](AWS-MIGRATION-PROGRESS.md)**: Migration status

### Available Scripts

```bash
npm run aws:setup           # Create AWS infrastructure with Terraform
npm run aws:build           # Build and push Docker image to ECR
npm run aws:deploy:backend  # Deploy backend to ECS
npm run aws:deploy:frontend # Deploy frontend to S3/CloudFront
npm run aws:deploy          # Full deployment (backend + frontend)

npm run docker:build        # Build Docker image locally
npm run docker:compose:up   # Test with Docker Compose
npm run docker:compose:down # Stop Docker Compose
```

### Cost Estimate

- **Development**: ~$50-100/month (single-AZ, t4g.micro)
- **Production**: ~$200-300/month (multi-AZ, autoscaling)

See [cost breakdown](docs/AWS-DEPLOYMENT.md#cost-optimization) for details.

---

## Support

For issues or questions:
1. Check [SCHEDULING_DEPLOYMENT_GUIDE.md](SCHEDULING_DEPLOYMENT_GUIDE.md) for deployment issues
2. Check [AWS Deployment Guide](docs/AWS-DEPLOYMENT.md) for AWS-specific issues
3. Review API endpoint documentation above
4. Check database schema in `shared/schema.ts`
5. Create an issue on GitHub

## License

MIT License

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run check` to verify types
5. Submit a pull request

---

**Built with** ❤️ **for mental health professionals and the patients they serve**

**Live Demo**: https://KareMatch-1ec4.onrender.com
