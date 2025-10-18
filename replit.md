# TherapyConnect - Therapist Directory Application

## Overview
TherapyConnect is a HIPAA-exempt therapist directory web application that connects patients with verified, licensed mental health professionals. The platform allows therapists to create comprehensive profiles and patients to search and filter therapists based on location, specializations, insurance, and other criteria.

## Tech Stack
- **Frontend**: React 18 with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query v5)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

## Project Structure

### Frontend (`client/src/`)
- **pages/**: All application pages
  - `home.tsx`: Homepage with hero search and featured specialties
  - `therapist-search.tsx`: Search/filter page with comprehensive sidebar
  - `therapist-profile.tsx`: Detailed therapist profile with tabs
  - `login.tsx`: Therapist login page
  - `signup.tsx`: Therapist registration page
  - `therapist-dashboard.tsx`: Therapist dashboard overview
  - `profile-editor.tsx`: Multi-step profile creation/editing form
  - `admin-dashboard.tsx`: Admin panel for approving/rejecting profiles
  - `not-found.tsx`: 404 error page

- **components/**: Reusable UI components
  - `layout/header.tsx`: Main navigation header
  - `layout/footer.tsx`: Site footer
  - `ui/`: Shadcn UI components (Button, Card, Form, etc.)

### Backend (`server/`)
- `routes.ts`: API route definitions
- `storage.ts`: Storage interface and implementation
- `vite.ts`: Vite dev server configuration

### Shared (`shared/`)
- `schema.ts`: Database schemas, Zod validation schemas, TypeScript types, and constants

## Database Schema

### Tables

#### `therapists`
Stores therapist profile information including:
- Personal info (name, credentials, photo, pronouns, languages)
- Contact & location (email, phone, website, address, city, state, ZIP, coordinates)
- Licensing (license type/number/state, NPI, years in practice, education)
- Practice details (bio, therapeutic approach, session types, modalities)
- Specializations (top specialties, issues treated, communities served, age groups, therapy types)
- Fees & insurance (session fees, sliding scale, insurance accepted, payment methods)
- Availability (days, times, waitlist status, accepting new clients)
- Media (video intro URL, profile views, last login)
- Status tracking (profile_status: pending/approved/rejected/inactive)

#### `admin_users`
Stores admin user information:
- user_id (references users table)
- role (admin/super_admin)
- created_at

#### `users`
Stores authentication credentials:
- email
- password (hashed)
- role (therapist/admin)

## Features

### Patient-Facing Features
1. **Homepage**
   - Hero section with integrated search (location + specialty)
   - Featured specialties grid
   - "How It Works" section
   - Statistics display
   - Clear CTAs for patients and therapists

2. **Therapist Search**
   - Comprehensive filter sidebar (desktop) / sheet (mobile)
   - Filters include:
     - Location with radius slider (5-50 miles)
     - Price range slider ($0-$300)
     - Accepting new clients toggle
     - Specializations (checkboxes)
     - Session types (individual/couples/family/group)
     - Modalities (in-person/telehealth/phone)
     - Age groups
     - Insurance accepted
     - Communities served
   - Sort options (relevance, distance, price, recent)
   - Grid layout with therapist cards showing photo, name, credentials, specialties, location, fees
   - Responsive design with mobile filter drawer

3. **Therapist Profile Page**
   - Profile header with photo, name, credentials, location, experience
   - Contact button with modal showing email, phone, website
   - Tabbed content: About, Specialties, Qualifications, Fees & Insurance
   - Quick facts sidebar
   - Availability information

### Therapist Features
1. **Authentication**
   - Email/password signup and login
   - Secure authentication flow

2. **Dashboard**
   - Profile completion meter
   - Profile views counter
   - Profile status badge (pending/approved/rejected/inactive)
   - Quick actions (edit profile, view public profile)
   - Status-specific messages and guidance

3. **Profile Editor**
   - 5-step multi-step form:
     - Step 1: Basic Information (personal details, contact, location)
     - Step 2: Practice Details (bio, approach, specializations, therapy types)
     - Step 3: Licensing (credentials, education, verification)
     - Step 4: Fees & Logistics (pricing, insurance, availability)
     - Step 5: Review & Submit
   - Progress indicator showing current step
   - Save draft functionality
   - Multi-select badge interface for arrays (specialties, insurance, etc.)
   - Character counters for text areas
   - Comprehensive validation

### Admin Features
1. **Admin Dashboard**
   - Statistics overview (total therapists, approved, pending)
   - Tabbed interface:
     - Pending Approvals: Review and approve/reject new profiles
     - All Therapists: View all therapists with status
   - Therapist detail modal with full profile review
   - Approve/reject actions with instant updates

## Design System

### Colors (from design_guidelines.md)
- **Primary**: Calming teal-blue (HSL: 202 83% 41%) - trust, healthcare, professionalism
- **Secondary**: Soft sage green (HSL: 158 64% 52%) - healing, growth, nature
- **Background**: Pure white / Dark blue-gray (dark mode)
- **Success**: Green for "Accepting new clients" badges
- **Warning**: Yellow/orange for waitlist status

### Typography
- **Font**: Inter (Google Fonts)
- **Hierarchy**: Clear distinction between headings (48px/36px/24px) and body text (16px)
- **Weight**: Semibold for headings, Regular for body

### Components
- **Cards**: Subtle background with rounded corners, hover elevation
- **Buttons**: Primary (teal), Secondary (sage), Outline, Ghost variants
- **Badges**: Used for specialties, status indicators, tags
- **Forms**: Clean inputs with proper labels, descriptions, and validation messages
- **Spacing**: Consistent use of Tailwind spacing scale (4, 6, 8, 12, 16, 20, 24)

### Interactions
- Hover elevations on cards and buttons
- Smooth transitions
- Loading states with skeletons
- Responsive mobile-first design

## API Routes (To Be Implemented)

### Public Routes
- `GET /api/therapists` - Get all approved therapists with filters
- `GET /api/therapists/:id` - Get single therapist profile

### Authenticated Routes (Therapist)
- `POST /api/auth/signup` - Create therapist account
- `POST /api/auth/login` - Login
- `GET /api/therapist/profile` - Get own profile
- `POST /api/therapist/profile` - Create profile
- `PUT /api/therapist/profile/:id` - Update profile
- `POST /api/therapist/profile/submit` - Submit profile for review

### Admin Routes
- `GET /api/admin/therapists` - Get all therapists
- `GET /api/admin/therapists/pending` - Get pending therapists
- `POST /api/admin/therapists/:id/approve` - Approve therapist
- `POST /api/admin/therapists/:id/reject` - Reject therapist

## Environment Variables
- `DATABASE_URL`: Supabase PostgreSQL connection string
- `SESSION_SECRET`: Secret for session management

## Development Workflow
1. `npm run dev` - Starts both Vite dev server and Express backend
2. Frontend runs on port 5000 (proxied through Express)
3. Hot module replacement enabled for fast development

## Security & Compliance
- **HIPAA-Exempt Design**: No patient information is collected
- Therapist licensing verification required
- Admin approval workflow for all new profiles
- Secure password hashing
- Protected routes for authenticated users

## Current Status
✅ Task 1 Complete: Schema & Frontend
- Complete database schema defined with all required fields
- All React components built with exceptional attention to visual detail
- Responsive design implemented across all breakpoints
- Design tokens configured (colors, typography, spacing)
- Professional healthcare aesthetic achieved
- All pages follow design guidelines

✅ Task 2 Complete: Backend Implementation
- Database migrations created and pushed to Supabase
- Complete storage interface with all CRUD operations
- Authentication system with bcrypt password hashing
- Session management with express-session
- All API endpoints implemented:
  - Public routes for therapist search and profiles
  - Auth routes (signup, login, logout)
  - Therapist routes (profile CRUD, submit for review)
  - Admin routes (approve/reject, view all therapists)
- Comprehensive filtering logic for therapist search
- Admin user creation script

✅ Task 3 Complete: Integration & Polish
- Frontend integrated with backend APIs via TanStack Query
- All data fetching and mutations working
- Loading states with skeletons implemented
- Error handling across all features
- Application successfully running on port 5000
- Admin user created (admin@therapyconnect.com / admin123)

## Test Credentials
**Admin Account:**
- Email: admin@therapyconnect.com
- Password: admin123

## Notes
- The application uses the existing fullstack JavaScript template with Vite + Express
- All components use Shadcn UI for consistency
- TanStack Query is used for all data fetching
- Forms use React Hook Form with Zod validation
- The design follows the healthcare aesthetic specified in design_guidelines.md
