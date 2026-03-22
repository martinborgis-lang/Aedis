# CLAUDE.md - Aedis Project Documentation

## 1. PROJECT OVERVIEW

**Aedis** is a SaaS platform for French architects to manage construction project workflows. It implements a 3-layer access model:

1. **Architect Layer (Authenticated)**: Full project management, task creation, progress tracking, Gantt charts
2. **Client Layer (Token-based)**: Read-only portal to view project progress, photos, timeline
3. **Artisan Layer (Per-task tokens)**: Task-specific access to mark tasks done and upload photos

### Target Market
- French architecture firms
- Construction project management
- Client transparency and communication
- Artisan coordination and progress tracking

## 2. ARCHITECTURE

### Folder Structure
```
src/
├── app/                     # Next.js 14 App Router pages
│   ├── (auth)/
│   │   ├── auth/           # Authentication pages
│   │   └── dashboard/      # Architect dashboard
│   ├── portal/[token]/     # Client portal (token-based access)
│   ├── artisan/[token]/    # Artisan portal (task-specific tokens)
│   ├── projects/
│   │   ├── new/           # Create new project
│   │   ├── [id]/          # Project detail view
│   │   └── [id]/planning/ # Gantt chart planning view
│   └── globals.css        # Global Tailwind styles
├── components/             # Shared React components
│   ├── GanttChart.tsx     # Frappe-gantt wrapper
│   ├── PhotoUpload.tsx    # File upload with drag-drop
│   ├── PhotoLightbox.tsx  # Photo viewer modal
│   └── StatusBadge.tsx    # Task/project status indicators
├── lib/
│   ├── supabase/          # Supabase client configuration
│   └── types/             # TypeScript type definitions
├── types/                 # Third-party type declarations
└── middleware.ts          # Supabase auth middleware
```

### Routing Conventions
- `/` - Landing page with features overview
- `/auth` - Supabase auth (login/signup)
- `/dashboard` - Architect project list with stats
- `/projects/new` - Create new project form
- `/projects/[id]` - Project detail with tasks, photos, settings
- `/projects/[id]/planning` - Full Gantt chart view
- `/portal/[token]` - Client read-only portal
- `/artisan/[token]` - Artisan task-specific interface

## 3. TECHNOLOGY STACK

### Core Framework
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **React 18** with hooks and modern patterns

### Database & Backend
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- Row Level Security for multi-tenant data isolation
- Real-time subscriptions for collaborative features

### UI & Styling
- **Tailwind CSS** with custom design system
- **Lucide React** icons
- **Inter** font from Google Fonts
- Custom CSS variables for theming

### Specialized Libraries
- **frappe-gantt** for interactive Gantt charts
- **uuid** for token generation
- Dynamic imports for code splitting

### Development
- **ESLint** with Next.js config
- **PostCSS** for CSS processing
- **TypeScript** strict mode

## 4. DATABASE SCHEMA

### Tables Overview

**projects**
- Core project information
- Portal token for client access
- User association (architect ownership)
- Status: active, completed, archived

**tasks**
- Project breakdown with Gantt data
- Start/end dates, progress percentage
- Status workflow: pending → in_progress → completed
- Trade categorization and dependencies

**photos**
- Task-associated image storage
- Supabase storage integration
- Upload metadata (who, when, caption)

**artisan_tokens**
- Per-task unique access tokens
- Named artisan associations
- Project and task scope limitation

### Key Relationships
- projects → tasks (1:many)
- tasks → photos (1:many)
- projects ← artisan_tokens (many:1)
- tasks ← artisan_tokens (many:1)

### Row Level Security (RLS)
- **projects**: Users access only their own projects; public read via portal_enabled
- **tasks**: Inherited from project ownership; public read for portal access
- **photos**: Follow task access patterns; INSERT allowed for portals and tokens
- **artisan_tokens**: User CRUD for owned projects; public SELECT by token value

## 5. KEY CONCEPTS

### 3-Layer Access Model

**Architect (Authenticated via Supabase Auth)**
- Full CRUD on projects, tasks, photos
- Project settings and portal management
- Artisan token generation and management
- Dashboard with project overview and stats

**Client (Portal Token Access)**
- View project details and progress
- Browse task timeline and photos
- No authentication required, just portal token
- Read-only access when portal_enabled=true

**Artisan (Task-specific Token Access)**
- Access specific task via unique token
- Mark tasks as completed (update progress to 100%)
- Upload progress photos with drag-drop
- Minimal interface focused on task execution

### Portal Tokens
- UUID-based tokens stored in projects.portal_token
- Enable/disable via projects.portal_enabled boolean
- Share-friendly URLs: `/portal/[token]`
- No expiration, manually managed by architect

### Artisan Tokens
- Per-task unique tokens in artisan_tokens table
- Generated on-demand by architect
- Include artisan name for identification
- Scoped access: one token = one task
- URLs: `/artisan/[token]`

### Task Workflow
1. **pending** (0% progress) - Newly created
2. **in_progress** (1-99% progress) - Work started
3. **completed** (100% progress) - Task finished

### Photo Management
- Supabase Storage with public bucket
- Organized by project/task hierarchy
- Support for JPEG, PNG, HEIC formats
- 10MB file size limit
- Lightbox viewer for photo browsing

## 6. ENVIRONMENT VARIABLES

```bash
# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Next.js (auto-generated)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
```

## 7. CURRENT BUGS & KNOWN ISSUES

### Critical Bugs
1. **frappe-gantt ChunkLoadError**: Dynamic import fails in production build
   - Solution: Replace with `next/dynamic` + `ssr: false`

2. **Artisan photo upload flow**: Missing "Envoyer" button confirmation
   - Files are staged but no clear send action
   - Solution: Add Send button + success feedback

3. **Client portal photo visibility**: Artisan-uploaded photos not showing in client portal
   - RLS policy issue or photo association problem
   - Photos uploaded via artisan tokens should appear in client timeline

4. **Supabase storage anon policy**: Anonymous uploads may be blocked
   - Storage RLS needs anon INSERT permissions for photos bucket
   - Critical for both client portal and artisan uploads

### Minor Issues
- Demo data hardcoded in components (acceptable for MVP)
- No error boundaries for production resilience
- Photo upload progress indicators could be improved
- Mobile responsiveness needs testing

## 8. DEVELOPMENT COMMANDS

```bash
# Development
npm run dev          # Start development server (localhost:3000)

# Production Build
npm run build        # Create optimized production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint checks
```

### Database Setup
1. Create Supabase project
2. Run `supabase-schema.sql`
3. Configure storage bucket policies
4. Set environment variables

## 9. CODING CONVENTIONS

### TypeScript Patterns
- Strict type definitions in `src/lib/types/database.ts`
- Interface-based component props
- Enum usage for status and trade types

### React Patterns
- Functional components with hooks
- `useCallback` and `useMemo` for performance
- Client components marked with `"use client"`
- Server components for data fetching

### Supabase Integration
- Client creation via `createClient()` helper
- RLS-aware queries with user context
- Storage operations with error handling
- Real-time subscriptions where needed

### UI/UX Patterns
- Tailwind utility-first styling
- Consistent spacing and typography scale
- Loading states with spinners
- Error states with user-friendly messages
- Responsive design mobile-first

### File Organization
- Page components in `app/` directory
- Shared components in `components/`
- Business logic in custom hooks
- Type definitions centralized

## 10. FEATURE ROADMAP

### P0 (MVP Complete) ✅
- [x] User authentication (Supabase Auth)
- [x] Project CRUD operations
- [x] Task management with Gantt charts
- [x] Photo upload and gallery
- [x] Client portal access
- [x] Artisan task access
- [x] Basic responsive design

### P1 (Current Sprint) 🚧
- [ ] **Bug Fixes**: frappe-gantt, artisan upload flow, photo visibility, storage policies
- [ ] **PDF Reports**: Generate project progress reports with @react-pdf/renderer
- [ ] **Réserves Management**: Punch list system for construction defects
- [ ] **UI Redesign**: shadcn/ui components with orange accent (#E8650A)

### P2 (Next Phase) 📋
- [ ] Real-time collaboration features
- [ ] Advanced project templates
- [ ] Email notifications via Brevo
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced reporting and analytics

### P3 (Future) 🔮
- [ ] Integration with CAD software
- [ ] AI-powered project insights
- [ ] Multi-company workspace support
- [ ] Advanced workflow automation
- [ ] API for third-party integrations

---

**Last Updated**: March 2026
**Version**: MVP v0.1.0
**Status**: Development Phase - P1 Sprint