# Therapist Directory Design Guidelines

## Design Approach

**System Selected:** Custom Healthcare Design System with Material Design principles
**Rationale:** Healthcare directories require maximum trust, clarity, and accessibility. The design must prioritize findability, readability, and professional credibility while maintaining a calming, welcoming aesthetic that reduces anxiety for patients seeking mental health support.

## Color Palette

### Light Mode
- **Primary Brand**: 202 83% 41% (Calming teal-blue - trust, healthcare, professionalism)
- **Primary Hover**: 202 83% 35%
- **Secondary**: 158 64% 52% (Soft sage green - healing, growth, nature)
- **Background**: 0 0% 100% (Pure white)
- **Surface**: 210 20% 98% (Soft off-white for cards)
- **Text Primary**: 215 25% 27% (Dark blue-gray for excellent readability)
- **Text Secondary**: 215 15% 50%
- **Border**: 214 20% 90%
- **Success**: 142 76% 36% (Accepting new clients badges)
- **Warning**: 38 92% 50% (Waitlist status)
- **Error**: 0 84% 60%

### Dark Mode
- **Primary Brand**: 202 70% 55%
- **Primary Hover**: 202 70% 65%
- **Secondary**: 158 50% 45%
- **Background**: 222 47% 11%
- **Surface**: 217 33% 17%
- **Text Primary**: 210 40% 98%
- **Text Secondary**: 215 20% 65%
- **Border**: 217 33% 24%

## Typography

**Font Families:**
- **Primary (Interface)**: Inter (Google Fonts) - Clean, highly readable sans-serif
- **Headings**: Inter SemiBold/Bold
- **Body**: Inter Regular

**Scale & Hierarchy:**
- **H1 (Hero)**: 3rem (48px) font-bold, tracking-tight
- **H2 (Section Headers)**: 2.25rem (36px) font-semibold
- **H3 (Card Titles)**: 1.5rem (24px) font-semibold
- **H4 (Subsections)**: 1.25rem (20px) font-medium
- **Body Large**: 1.125rem (18px) - Therapist bios, important content
- **Body**: 1rem (16px) - Standard text
- **Small**: 0.875rem (14px) - Meta info, labels
- **Caption**: 0.75rem (12px) - Disclaimers, fine print

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 consistently
- **Component Internal**: p-4, p-6 (cards, buttons)
- **Section Padding**: py-12 md:py-20 lg:py-24
- **Element Spacing**: gap-4, gap-6, gap-8
- **Container Max-Width**: max-w-7xl for full layouts, max-w-4xl for content-focused pages

**Grid System:**
- **Search Results**: 1 column mobile, 2 columns tablet (md:), 3 columns desktop (lg:)
- **Dashboard**: Sidebar layout with fixed 280px sidebar on desktop
- **Forms**: Single column with max-w-2xl for optimal readability

## Component Library

### Navigation
- **Header**: Fixed top navigation with white/surface background, subtle shadow
  - Logo left, primary nav center, CTA buttons right
  - Mobile: Hamburger menu with slide-out drawer
  - Height: 72px desktop, 64px mobile
  
### Hero Section (Homepage)
- **Layout**: Full-width with background image (blurred therapy office or calming nature scene with gradient overlay 202 83% 41% at 70% opacity)
- **Content**: Centered, max-w-4xl
  - Large headline (text-5xl font-bold)
  - Subheadline (text-xl text-secondary)
  - Integrated search bar: Location input + Specialty dropdown + Search button
  - Search bar: bg-white, rounded-xl, shadow-lg, p-6
- **Height**: min-h-[600px] - not forced viewport

### Therapist Cards
- **Container**: bg-surface, rounded-xl, overflow-hidden, shadow-sm hover:shadow-md transition
- **Layout**: 
  - Profile photo: aspect-square, rounded-lg, 120x120px
  - Name + Credentials: font-semibold text-lg
  - Top 3 specialties: Pill badges with bg-primary/10 text-primary
  - Location: Icon + text-sm
  - Fee: Prominent text-lg font-medium
  - "Accepting New Clients" badge: bg-success text-white rounded-full px-3 py-1
  - CTA: "View Profile" button with variant="outline"

### Filter Sidebar (Search Page)
- **Desktop**: Sticky sidebar, w-80, max-h-screen overflow-y-auto
- **Mobile**: Collapsible drawer from bottom with "Filters" button
- **Sections**: Grouped with dividers
  - Location (zip + radius slider with value display)
  - Checkboxes: Use custom styled with primary color
  - Price slider: Dual-handle range with min/max labels
  - Toggle switches: For boolean filters (Accepting new clients)
- **Apply button**: Fixed at bottom, full-width, bg-primary

### Therapist Profile Page
- **Header Section**:
  - 2-column layout: Profile photo (200x200px, rounded-2xl) left, info right
  - Name (text-3xl font-bold), credentials (text-lg text-secondary)
  - Location, years in practice
  - Primary CTA: "Contact Therapist" button (bg-primary text-white)
- **Sidebar (Desktop)**: Quick facts card with key info (fees, insurance, availability)
- **Tab Navigation**: Underlined active state with primary color
- **Content Sections**: Generous whitespace, max-w-3xl for readability

### Forms (Multi-Step Profile Creation)
- **Progress Indicator**: Horizontal stepper at top showing 5 steps
  - Completed steps: bg-primary with checkmark
  - Current step: bg-primary with number
  - Future steps: bg-gray-200 with number
- **Form Fields**:
  - Labels: text-sm font-medium mb-2
  - Inputs: border-2 border-border focus:border-primary rounded-lg p-3
  - Text areas: min-h-32 with character counter bottom-right
  - Select dropdowns: Custom styled to match inputs
  - Tag inputs: Pills with × remove button, bg-primary/10
- **Photo Upload**: Drag-and-drop zone with preview, rounded-lg border-dashed
- **Navigation**: "Back" button (variant="outline"), "Continue" button (bg-primary), "Save Draft" link

### Admin Dashboard
- **Table View**: Striped rows, hover:bg-surface/50
- **Action Buttons**: Icon buttons with tooltips
- **Status Badges**: Color-coded (pending: yellow, approved: green, rejected: red)
- **Filters**: Top bar with search input and dropdown filters

### Badges & Pills
- **Specialty Tags**: bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm
- **Status Indicators**: Colored background with white text, rounded-full
- **Insurance Pills**: border border-border rounded-lg px-3 py-1

### Buttons
- **Primary**: bg-primary hover:bg-primary-hover text-white rounded-lg px-6 py-3 font-medium
- **Secondary**: bg-secondary hover:bg-secondary-hover text-white
- **Outline**: border-2 border-primary text-primary hover:bg-primary hover:text-white
- **Icon Buttons**: p-2 rounded-lg hover:bg-surface

### Loading States
- **Skeleton Screens**: Animated gradient placeholder matching component structure
- **Spinners**: Primary color, centered

## Images

### Hero Section
**Description**: Calming therapy office scene or serene natural landscape (soft-focus forest, meditation space, peaceful room with plants and natural light)
**Treatment**: Subtle blur with 70% opacity teal gradient overlay to ensure text readability
**Placement**: Full-width background spanning hero section

### Therapist Profile Photos
**Format**: Square (1:1 aspect ratio), minimum 400x400px
**Treatment**: Rounded corners (rounded-lg on cards, rounded-2xl on profile pages)
**Fallback**: Placeholder with initials on primary color background

### Section Backgrounds
**Optional decorative elements**: Subtle abstract shapes or gradients in background of key sections (features, CTA sections) - very light opacity to maintain professionalism

## Accessibility & UX

- **Focus States**: 2px primary color ring with offset
- **Keyboard Navigation**: Visible focus indicators on all interactive elements
- **Color Contrast**: WCAG AA compliant minimum 4.5:1 for body text
- **Form Validation**: Inline error messages with error color, icon, and descriptive text
- **Empty States**: Friendly illustrations with helpful guidance
- **Loading Indicators**: Clear feedback for all async operations

## Unique Design Elements

- **Trust Signals**: Verified badge icons next to approved therapist profiles
- **Warmth Through Imagery**: Use soft, rounded corners throughout (rounded-lg, rounded-xl) to create approachable feel
- **Gentle Shadows**: Subtle elevation (shadow-sm, shadow-md) - never harsh
- **Breathing Room**: Generous padding and margins - mental health requires calm, uncluttered interfaces
- **Progressive Disclosure**: Collapsible sections for detailed information to reduce cognitive load

This design creates a professional, trustworthy healthcare directory while maintaining warmth and accessibility - essential for users seeking mental health support.