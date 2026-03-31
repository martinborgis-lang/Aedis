# CLAUDE.md - Aedis Project Documentation

## 1. PROJECT OVERVIEW

**Aedis** is a comprehensive SaaS platform for French architects to manage construction project workflows with advanced automation. It implements a 3-layer access model with cutting-edge features:

1. **Architect Layer (Authenticated)**: Full project management, AI-powered DPGF import, PDF reports, reserves management, activity monitoring
2. **Client Layer (Token-based)**: Real-time portal with progress tracking, photo galleries, interactive timeline
3. **Artisan Layer (Per-task tokens)**: Task-specific access with photo upload, progress confirmation, automated notifications

### Target Market
- French architecture firms seeking digital transformation
- Construction project management with client transparency
- Artisan coordination with automated workflow
- Professional reporting and quality control (reserves)

### Key Differentiators
- **AI-powered DPGF import**: Automatic project setup from PDF documents
- **Professional PDF reporting**: Branded, detailed project reports
- **Reserves management**: Complete defect tracking system
- **Email automation**: Brevo integration for professional communication
- **3D visualization**: Pascal.app integration for model viewing
- **Immersive landing page**: Three.js blueprint animation

## 2. ARCHITECTURE

### Folder Structure
```
src/
├── app/                     # Next.js 14 App Router pages
│   ├── (auth)/
│   │   ├── auth/           # Authentication pages
│   │   └── dashboard/      # Architect dashboard with activity feed
│   ├── api/                # API routes
│   │   ├── projects/
│   │   │   └── import-dpgf/ # AI-powered DPGF import endpoints
│   │   ├── reports/        # PDF report generation & tracking
│   │   ├── reminders/      # Email notification system
│   │   ├── subscribe/      # Landing page email capture
│   │   └── cron/           # Scheduled tasks (reminder automation)
│   ├── portal/[token]/     # Client portal (token-based access)
│   ├── artisan/[token]/    # Artisan portal (task-specific tokens)
│   ├── projects/
│   │   ├── new/           # Create new project
│   │   ├── import/        # DPGF import workflow
│   │   │   └── preview/   # Import preview & validation
│   │   ├── [id]/          # Project detail view with reserves
│   │   └── [id]/planning/ # Gantt chart planning view
│   ├── page.tsx           # Immersive landing page with Three.js
│   └── globals.css        # Global styles + animations + theme system
├── components/             # Comprehensive React component library
│   ├── ui/                # shadcn/ui design system
│   │   ├── button.tsx     # Consistent button components
│   │   ├── card.tsx       # Card containers
│   │   ├── dialog.tsx     # Modal dialogs
│   │   ├── input.tsx      # Form inputs
│   │   ├── select.tsx     # Dropdown selects
│   │   └── ...           # Complete UI component system
│   ├── GanttChart.tsx     # Frappe-gantt wrapper
│   ├── PhotoUpload.tsx    # File upload with drag-drop
│   ├── PhotoLightbox.tsx  # Photo viewer modal
│   ├── StatusBadge.tsx    # Task/project status indicators
│   ├── ProjectPDFReport.tsx  # Professional PDF report generation
│   ├── ReservesList.tsx   # Complete reserves management system
│   ├── ActivityFeed.tsx   # Real-time activity monitoring
│   ├── ImportUploadZone.tsx # AI-powered DPGF import interface
│   ├── PascalViewer.tsx   # 3D model viewer integration
│   ├── BlueprintAnimation.tsx # Complex Three.js house animation
│   ├── AnimatedCard.tsx   # Scroll-triggered card animations
│   ├── AnimatedStat.tsx   # Counter animations with easing
│   ├── AnimatedTitle.tsx  # Title slide animations
│   ├── MiniGanttDemo.tsx  # Interactive Gantt chart demo
│   └── ReminderHistory.tsx # Email reminder tracking
├── hooks/
│   └── useScrollAnimation.ts # Intersection Observer animation hook
├── lib/
│   ├── supabase/          # Supabase client configuration
│   ├── types/
│   │   └── database.ts    # Complete type definitions + reserves types
│   ├── import/            # DPGF import processing logic
│   │   ├── types.ts       # Import-specific types
│   │   └── calculateDates.ts # Date calculation algorithms
│   ├── email.ts           # Brevo email service integration
│   └── utils.ts           # Utility functions
├── types/                 # Third-party type declarations
└── middleware.ts          # Supabase auth middleware
```

### Routing Conventions

**Public Routes**
- `/` - Immersive landing page with Three.js blueprint animation, scroll animations
- `/auth` - Supabase authentication (login/signup)

**Architect Routes (Protected)**
- `/dashboard` - Project overview with activity feed, stats, reserves summary
- `/projects/new` - Create new project form with traditional input
- `/projects/import/preview` - DPGF import preview with AI-extracted data validation
- `/projects/[id]` - Comprehensive project detail: tasks, photos, reserves, settings, PDF reports
- `/projects/[id]/planning` - Full interactive Gantt chart view

**Token-based Access**
- `/portal/[token]` - Client read-only portal with real-time progress, photo galleries
- `/artisan/[token]` - Artisan task-specific interface with photo upload, progress confirmation

**API Routes**
- `/api/projects/import-dpgf` - AI-powered DPGF document analysis endpoint
- `/api/projects/import-dpgf/create` - Create project from imported DPGF data
- `/api/reports/send` - Generate and email PDF project reports
- `/api/reports/track/[token]` - Track email open rates for reports
- `/api/reminders/reserve` - Send reserve assignment notifications
- `/api/cron/reminders` - Automated task overdue reminders
- `/api/subscribe` - Landing page email subscription capture

## 3. TECHNOLOGY STACK

### Core Framework
- **Next.js 14** with App Router and API routes
- **TypeScript** for type safety across client and server
- **React 18** with hooks, modern patterns, and animations

### Database & Backend
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- Row Level Security for multi-tenant data isolation
- Real-time subscriptions for collaborative features
- **Additional tables**: reserves, activity_feed for enhanced functionality

### UI & Styling
- **Tailwind CSS** with comprehensive design system and custom animations
- **shadcn/ui** complete component library for consistent UX
- **Lucide React** icons throughout the application
- **Syne + Inter** font pairing for professional typography
- CSS variables for theming with dark/light mode support
- Custom keyframe animations for scroll-triggered effects

### Advanced Libraries
- **@react-pdf/renderer** for professional PDF report generation
- **Three.js** (r128) for complex 3D blueprint animation system
- **frappe-gantt** for interactive Gantt charts
- **uuid** for secure token generation
- **Brevo API** for professional email automation
- **Pascal.app** integration for 3D model viewing

### AI & Automation
- **Custom AI DPGF processing** for automated project import
- **Date calculation algorithms** for intelligent project planning
- **Email automation system** with reminder scheduling
- **Scroll-triggered animations** with Intersection Observer API

### Development & Quality
- **ESLint** with Next.js config and TypeScript rules
- **PostCSS** for advanced CSS processing
- **TypeScript** strict mode with comprehensive type definitions
- **Performance optimization** with dynamic imports and code splitting

## DATABASE SCHEMA — État réel au 31 mars 2026

### Supabase Storage Buckets
| Bucket    | Public | Usage                              |
|-----------|--------|------------------------------------|
| photos    | true   | Photos tâches et réserves          |
| reports   | true   | Rapports PDF générés               |
| documents | false  | Documents privés artisans          |
| models    | true   | Modèles 3D + plans PDF (futur)     |

---

### Tables

**projects**
| Colonne           | Type         | Nullable | Défaut                  |
|-------------------|--------------|----------|-------------------------|
| id                | uuid         | NO       | gen_random_uuid()       |
| name              | text         | NO       |                         |
| address           | text         | NO       |                         |
| client_name       | text         | NO       |                         |
| client_email      | text         | YES      |                         |
| client_phone      | text         | YES      |                         |
| description       | text         | YES      |                         |
| start_date        | date         | YES      |                         |
| estimated_end_date| date         | YES      |                         |
| status            | project_status (enum) | YES | 'active'             |
| portal_token      | text         | NO       | UNIQUE                  |
| portal_enabled    | boolean      | YES      | false                   |
| user_id           | uuid         | NO       | FK → auth.users         |
| budget            | numeric      | YES      |                         |
| created_at        | timestamptz  | YES      | now()                   |
| updated_at        | timestamptz  | YES      | now()                   |

**tasks**
| Colonne        | Type           | Nullable | Défaut               |
|----------------|----------------|----------|----------------------|
| id             | uuid           | NO       | gen_random_uuid()    |
| project_id     | uuid           | YES      | FK → projects        |
| name           | text           | NO       |                      |
| description    | text           | YES      |                      |
| status         | task_status (enum) | YES  | 'pending'            |
| start_date     | date           | NO       |                      |
| end_date       | date           | NO       |                      |
| progress       | integer        | YES      | 0                    |
| sort_order     | integer        | YES      | 0                    |
| trade          | text           | YES      |                      |
| lot            | text           | YES      |                      |
| dependencies   | uuid[]         | YES      | '{}'                 |
| budget         | numeric        | YES      |                      |
| budget_prevu   | numeric        | YES      | 0                    |
| budget_depense | numeric        | YES      | 0                    |
| assignee_id    | uuid           | YES      | FK → auth.users      |
| created_at     | timestamptz    | YES      | now()                |
| updated_at     | timestamptz    | YES      | now()                |

**photos**
| Colonne     | Type        | Nullable | Défaut            |
|-------------|-------------|----------|-------------------|
| id          | uuid        | NO       | gen_random_uuid() |
| task_id     | uuid        | YES      | FK → tasks        |
| project_id  | uuid        | YES      | FK → projects     |
| url         | text        | NO       |                   |
| caption     | text        | YES      |                   |
| uploaded_by | text        | YES      |                   |
| created_at  | timestamptz | YES      | now()             |

**reserves**
| Colonne            | Type        | Nullable | Défaut            |
|--------------------|-------------|----------|-------------------|
| id                 | uuid        | NO       | gen_random_uuid() |
| project_id         | uuid        | NO       | FK → projects     |
| title              | text        | NO       |                   |
| description        | text        | YES      |                   |
| photo_url          | text        | YES      |                   |
| resolved_photo_url | text        | YES      |                   |
| assigned_to        | uuid        | YES      | FK → auth.users   |
| lot                | text        | YES      |                   |
| priority           | text        | YES      | 'medium'          |
| status             | text        | YES      | 'open'            |
| resolved_at        | timestamptz | YES      |                   |
| created_at         | timestamptz | YES      | now()             |
| updated_at         | timestamptz | YES      | now()             |



**artisan_tokens**
| Colonne      | Type        | Nullable | Défaut            |
|--------------|-------------|----------|-------------------|
| id           | uuid        | NO       | gen_random_uuid() |
| project_id   | uuid        | YES      | FK → projects     |
| task_id      | uuid        | YES      | FK → tasks        |
| artisan_name | text        | NO       |                   |
| token        | text        | NO       | UNIQUE            |
| phone        | text        | YES      |                   |
| created_at   | timestamptz | YES      | now()             |



**artisan_documents**
| Colonne          | Type        | Nullable | Défaut            |
|------------------|-------------|----------|-------------------|
| id               | uuid        | NO       | gen_random_uuid() |
| project_id       | uuid        | NO       | FK → projects     |
| artisan_token_id | uuid        | YES      | FK → artisan_tokens |
| artisan_name     | text        | NO       |                   |
| type             | text        | NO       |                   |
| label            | text        | YES      |                   |
| file_url         | text        | NO       |                   |
| status           | text        | YES      | 'pending'         |
| expiry_date      | date        | YES      |                   |
| uploaded_by      | text        | YES      | 'artisan'         |
| created_at       | timestamptz | YES      | now()             |
| updated_at       | timestamptz | YES      | now()             |

**reports**
| Colonne    | Type        | Nullable | Défaut            |
|------------|-------------|----------|-------------------|
| id         | uuid        | NO       | gen_random_uuid() |
| project_id | uuid        | NO       | FK → projects     |
| pdf_url    | text        | YES      |                   |
| filename   | text        | YES      |                   |
| notes      | text        | YES      |                   |
| sent_to    | jsonb       | YES      | '[]'              |
| sent_count | integer     | YES      | 0                 |
| created_at | timestamptz | YES      | now()             |

**report_recipients**
| Colonne         | Type        | Nullable | Défaut                    |
|-----------------|-------------|----------|---------------------------|
| id              | uuid        | NO       | gen_random_uuid()         |
| report_id       | uuid        | NO       | FK → reports              |
| project_id      | uuid        | NO       | FK → projects             |
| recipient_email | text        | NO       |                           |
| recipient_name  | text        | YES      |                           |
| tracking_token  | text        | YES      | UNIQUE, gen_random_uuid() |
| sent_at         | timestamptz | YES      | now()                     |
| opened_at       | timestamptz | YES      |                           |
| open_count      | integer     | YES      | 0                         |
| last_opened_at  | timestamptz | YES      |                           |

**reminders**
| Colonne             | Type        | Nullable | Défaut            |
|---------------------|-------------|----------|-------------------|
| id                  | uuid        | NO       | gen_random_uuid() |
| project_id          | uuid        | NO       | FK → projects     |
| task_id             | uuid        | YES      | FK → tasks        |
| type                | text        | NO       |                   |
| recipient_email     | text        | NO       |                   |
| recipient_name      | text        | YES      |                   |
| trigger_days_before | integer     | YES      | 2                 |
| scheduled_at        | timestamptz | YES      |                   |
| sent_at             | timestamptz | YES      |                   |
| status              | text        | YES      | 'pending'         |
| subject             | text        | YES      |                   |
| body                | text        | YES      |                   |
| created_by          | uuid        | YES      | FK → auth.users   |
| created_at          | timestamptz | YES      | now()             |

**budget_history**
| Colonne       | Type        | Nullable | Défaut            |
|---------------|-------------|----------|-------------------|
| id            | uuid        | NO       | gen_random_uuid() |
| project_id    | uuid        | NO       | FK → projects     |
| task_id       | uuid        | YES      | FK → tasks        |
| type          | text        | NO       |                   |
| amount_before | numeric     | YES      |                   |
| amount_after  | numeric     | YES      |                   |
| note          | text        | YES      |                   |
| created_by    | uuid        | YES      | FK → auth.users   |
| created_at    | timestamptz | YES      | now()             |

**activity_feed**
| Colonne      | Type        | Nullable | Défaut            |
|--------------|-------------|----------|-------------------|
| id           | uuid        | NO       | gen_random_uuid() |
| project_id   | uuid        | NO       | FK → projects     |
| project_name | text        | YES      |                   |
| type         | text        | NO       |                   |
| actor_name   | text        | YES      |                   |
| actor_type   | text        | YES      |                   |
| description  | text        | NO       |                   |
| entity_id    | uuid        | YES      |                   |
| entity_type  | text        | YES      |                   |
| created_at   | timestamptz | YES      | now()             |

**project_imports**
| Colonne           | Type        | Nullable | Défaut            |
|-------------------|-------------|----------|-------------------|
| id                | uuid        | NO       | gen_random_uuid() |
| project_id        | uuid        | YES      | FK → projects     |
| original_filename | text        | YES      |                   |
| contractor_name   | text        | YES      |                   |
| total_lots        | integer     | YES      |                   |
| total_tasks       | integer     | YES      |                   |
| total_budget_ht   | numeric     | YES      |                   |
| ai_notes          | text        | YES      |                   |
| confidence        | text        | YES      |                   |
| duration_source   | text        | YES      |                   |
| import_date       | timestamptz | YES      | now()             |
| created_at        | timestamptz | YES      | now()             |

**lot_duration_benchmarks**
| Colonne            | Type        | Nullable | Défaut            |
|--------------------|-------------|----------|-------------------|
| id                 | uuid        | NO       | gen_random_uuid() |
| lot_type           | text        | NO       |                   |
| budget_min         | numeric     | YES      |                   |
| budget_max         | numeric     | YES      |                   |
| project_size       | text        | YES      |                   |
| duration_days_p25  | integer     | YES      |                   |
| duration_days_p50  | integer     | YES      |                   |
| duration_days_p75  | integer     | YES      |                   |
| sample_count       | integer     | YES      | 0                 |
| created_at         | timestamptz | YES      | now()             |

**visits** ⭐ NEW — Module 1
| Colonne    | Type        | Nullable | Défaut                    |
|------------|-------------|----------|---------------------------|
| id         | uuid        | NO       | gen_random_uuid()         |
| project_id | uuid        | NO       | FK → projects ON DELETE CASCADE |
| user_id    | uuid        | YES      | FK → auth.users           |
| date       | date        | NO       |                           |
| object     | text        | YES      |                           |
| phase      | text        | YES      | 'suivi_chantier'          |
| zone       | text        | YES      |                           |
| notes      | text        | YES      |                           |
| created_at | timestamptz | YES      | now()                     |
| updated_at | timestamptz | YES      | now()                     |

Valeurs phase : 'suivi_chantier' | 'opr' | 'reception' | 'livraison'

**visit_attendees** ⭐ NEW — Module 1
| Colonne    | Type        | Nullable | Défaut                    |
|------------|-------------|----------|---------------------------|
| id         | uuid        | NO       | gen_random_uuid()         |
| visit_id   | uuid        | NO       | FK → visits ON DELETE CASCADE |
| name       | text        | NO       |                           |
| company    | text        | YES      |                           |
| role       | text        | YES      |                           |
| status     | text        | YES      | 'convoque'                |
| penalty    | boolean     | YES      | false                     |
| created_at | timestamptz | YES      | now()                     |

Valeurs status : 'present' | 'absent' | 'excuse' | 'absent_non_excuse' | 'convoque'

---

### Relations clés
- projects → tasks (1:many)
- projects → reserves (1:many)
- projects → visits (1:many) ⭐ NEW
- projects → activity_feed (1:many)
- projects → reports (1:many)
- projects → reminders (1:many)
- projects → artisan_tokens (1:many)
- projects → artisan_documents (1:many)
- projects → budget_history (1:many)
- tasks → photos (1:many)
- tasks ← artisan_tokens (many:1)
- tasks → budget_history (1:many)
- tasks → reminders (1:many)
- reports → report_recipients (1:many)
- visits → visit_attendees (1:many) ⭐ NEW

---

### RLS — Pattern uniforme du projet
Toutes les tables protégées suivent ce pattern :
```sql
project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
```
Exceptions notables :
- artisan_tokens : SELECT public (accès par valeur du token)
- photos : SELECT public si portal_enabled = true
- tasks : SELECT public si portal_enabled = true, UPDATE public via artisan_tokens
- visit_attendees : accès via JOIN visits → projects → user_id
- activity_feed : INSERT public (anyone can insert)
- lot_duration_benchmarks : SELECT public, INSERT public

---

### Tables prévues — Prochaines migrations
(Module 2) reserves : +visit_id, +number, +type, +chapter, +sub_chapter, +plan_id, +plan_x, +plan_y ; +table reserve_status_history
(Module 3) +project_zones, +project_plans
(Module 4) +report_templates
(Module 5) +service_orders
## 5. KEY CONCEPTS

### 3-Layer Access Model

**Architect (Authenticated via Supabase Auth)**
- **Project Management**: Full CRUD on projects, tasks, photos, reserves
- **AI-Powered Import**: Upload DPGF documents for automatic project creation
- **PDF Reporting**: Generate professional project reports with one click
- **Reserves Management**: Create, assign, and track defect resolution
- **Email Automation**: Automated reminders and notifications via Brevo
- **Activity Monitoring**: Real-time feed of all project activities
- **Portal Control**: Enable/disable client access, manage artisan tokens
- **Dashboard**: Comprehensive overview with stats, activity feed, reserves summary

**Client (Portal Token Access)**
- **Real-time Progress**: Live project timeline with photo galleries
- **Interactive Timeline**: Browse task progression with visual indicators
- **Photo Galleries**: View all project photos organized by tasks
- **No Authentication**: Simple token-based access via shareable URL
- **Professional Experience**: Branded interface matching architect's identity

**Artisan (Task-specific Token Access)**
- **Task-Focused Interface**: Access only assigned tasks via unique tokens
- **Progress Confirmation**: Mark tasks completed with photo documentation
- **Photo Upload**: Drag-drop interface for progress documentation
- **Email Notifications**: Automated reminders for overdue tasks
- **Reserve Resolution**: Respond to assigned defects with photos and notes
- **Mobile-Optimized**: Interface designed for on-site mobile usage

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
- **Supabase Storage** with public bucket and CDN delivery
- **Multi-context Storage**: Organized by project/task/reserves hierarchy
- **Format Support**: JPEG, PNG, HEIC with automatic optimization
- **Upload Limits**: 10MB file size with progress indicators
- **Lightbox Viewer**: Professional photo browsing with navigation
- **Metadata Tracking**: Upload timestamp, actor identification, captions

### ⭐ AI-Powered DPGF Import System
- **Document Analysis**: PDF parsing with AI extraction of lots, budgets, deadlines
- **Intelligent Planning**: Automatic task creation with dependencies and scheduling
- **Preview & Validation**: Review extracted data before project creation
- **Progress Indicators**: Real-time feedback during 20-second processing
- **Error Handling**: Comprehensive validation and user feedback
- **Workflow Integration**: Seamless transition from import to project management

### ⭐ Professional PDF Reports
- **Branded Design**: Custom styling with architect's color scheme (#FF7A3D)
- **Comprehensive Data**: Project info, task details, progress statistics, timeline
- **Photo Integration**: Task photos embedded in reports
- **Professional Layout**: Multi-page reports with headers, sections, and footers
- **One-Click Generation**: Instant PDF creation with @react-pdf/renderer
- **Email Distribution**: Direct sending to clients with tracking

### ⭐ Reserves Management System
- **Complete Lifecycle**: Create, assign, track, and resolve construction defects
- **Priority Matrix**: Critical, High, Medium, Low with visual indicators
- **Status Workflow**: Open → In Progress → Resolved with timestamp tracking
- **Photo Documentation**: Before/after photos for issue verification
- **Artisan Assignment**: Direct assignment with email notifications
- **Resolution Tracking**: Notes, timestamps, and completion verification

### ⭐ Email Automation System
- **Brevo Integration**: Professional email service with templates
- **Automated Reminders**: Task overdue notifications with smart scheduling
- **Reserve Notifications**: Assignment alerts with priority indicators
- **Report Distribution**: PDF reports sent with open tracking
- **Template System**: Branded email templates with CTA buttons
- **Delivery Tracking**: Monitor email opens and engagement

### ⭐ Activity Feed & Monitoring
- **Real-time Updates**: Live activity stream across all projects
- **Action Types**: Photo uploads, task completions, reserve events
- **Actor Attribution**: Track actions by architect, artisan, or client
- **Timeline View**: Chronological project activity with timestamps
- **Dashboard Integration**: Central monitoring for all projects
- **Performance Insights**: Activity patterns and engagement metrics

## 6. ENVIRONMENT VARIABLES

```bash
# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Email Service (required for automation)
BREVO_API_KEY=your-brevo-api-key

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Optional: Third-party Integrations
PASCAL_API_KEY=your-pascal-integration-key
```

### Environment Setup Notes
- **BREVO_API_KEY**: Required for email automation (reminders, reports, notifications)
- **Supabase Storage**: Ensure public bucket permissions for photo uploads
- **Domain Configuration**: Update NEXTAUTH_URL for production deployment
- **Pascal Integration**: Optional for advanced 3D model viewing features

## 7. CURRENT STATUS & KNOWN ISSUES

### 🟢 Recently Resolved
- ✅ **frappe-gantt ChunkLoadError**: Resolved with proper dynamic imports
- ✅ **UI Design System**: Completed shadcn/ui integration with consistent styling
- ✅ **Landing Page**: Fully redesigned with Three.js animation and scroll effects
- ✅ **PDF Reports**: Professional report generation system implemented
- ✅ **Reserves Management**: Complete defect tracking system operational
- ✅ **Email Automation**: Brevo integration with template system working

### 🟡 Current Minor Issues
1. **Mobile Responsiveness**: Landing page animations need mobile optimization
2. **Email Rate Limiting**: Brevo API calls need rate limiting for high volume
3. **DPGF Import Accuracy**: AI extraction may need fine-tuning for complex documents
4. **Three.js Performance**: Blueprint animation could be optimized for slower devices
5. **Storage Cleanup**: Orphaned photos from deleted projects need garbage collection

### 🟠 Enhancement Opportunities
1. **Error Boundaries**: Production error handling for React components
2. **Offline Support**: PWA capabilities for artisan mobile usage
3. **Performance Monitoring**: Real-time metrics for application performance
4. **Accessibility**: WCAG compliance for inclusive design
5. **Internationalization**: Multi-language support beyond French

### 🔧 Technical Debt
- Some demo data still hardcoded in components (acceptable for MVP)
- TypeScript strict mode enforcement across all components
- Unit test coverage for critical business logic
- API documentation for third-party integrations

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

### ✅ P0 (MVP Complete - ACHIEVED)
- [x] User authentication (Supabase Auth)
- [x] Project CRUD operations with enhanced metadata
- [x] Task management with interactive Gantt charts
- [x] Professional photo upload and galleries
- [x] Client portal with real-time progress tracking
- [x] Artisan task access with mobile optimization
- [x] Responsive design across all interfaces

### ✅ P1 (Advanced Features - COMPLETED)
- [x] **AI-Powered DPGF Import**: Automatic project creation from PDF documents
- [x] **Professional PDF Reports**: Branded, comprehensive project reporting
- [x] **Reserves Management**: Complete defect tracking and resolution system
- [x] **Email Automation**: Brevo integration with smart notifications
- [x] **UI Design System**: shadcn/ui components with #FF7A3D accent theme
- [x] **Activity Monitoring**: Real-time feed across all project activities
- [x] **Landing Page Redesign**: Immersive Three.js blueprint animation
- [x] **3D Model Integration**: Pascal.app viewer for architectural models

### 🚧 P2 (Optimization & Scale - CURRENT)
- [ ] **Mobile PWA**: Offline-capable progressive web app for artisans
- [ ] **Performance Optimization**: Three.js animation optimization for mobile devices
- [ ] **Advanced Analytics**: Project timeline analysis and performance insights
- [ ] **Multi-language Support**: English and additional European languages
- [ ] **API Documentation**: Public API for third-party integrations
- [ ] **Automated Testing**: Comprehensive test suite for critical workflows

### 📋 P3 (Enterprise Features - NEXT)
- [ ] **Multi-company Workspace**: Agency and contractor collaboration platform
- [ ] **Advanced CAD Integration**: Direct import from Revit, AutoCAD, SketchUp
- [ ] **AI Project Insights**: Predictive analytics for timeline and budget
- [ ] **Advanced Workflow Automation**: Custom triggers and actions
- [ ] **White-label Solutions**: Branded instances for large architecture firms
- [ ] **Enterprise SSO**: Active Directory and SAML integration

### 🔮 P4 (Innovation - FUTURE)
- [ ] **AR/VR Integration**: On-site augmented reality project visualization
- [ ] **IoT Site Monitoring**: Real-time construction site data integration
- [ ] **Blockchain Verification**: Immutable project milestone verification
- [ ] **AI Design Assistant**: Intelligent project planning recommendations
- [ ] **Drone Integration**: Aerial progress documentation automation

---

**Last Updated**: March 2026
**Version**: v1.0.0 (Advanced Features Complete)
**Status**: Production Ready - P2 Optimization Phase
**Next Milestone**: Mobile PWA & Performance Optimization (Q2 2026)