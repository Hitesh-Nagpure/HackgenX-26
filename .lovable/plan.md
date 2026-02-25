

# Nagar Niti — Next Phase Implementation Plan

## Current State

The project already has a solid V1 frontend with:
- Landing page with hero, stats, and feature cards
- Complaint submission form (category, priority, description, location, photo placeholder)
- Complaint history page with status badges
- Admin dashboard with bar/pie charts, filters, and status management
- Teal/emerald design system with Space Grotesk headings and framer-motion animations
- 8 sample complaints as mock data

Everything runs on local state with mock data. There is no backend, no authentication, no database, and no AI integration.

---

## What Needs to Be Built (Prioritized)

This is a large project. I recommend building it in phases rather than all at once. Here is the full roadmap broken into incremental steps.

### Phase 1 — Backend & Database (Lovable Cloud)

Enable Lovable Cloud to get a managed database, authentication, and edge functions. This replaces the need for a separate Node.js/Express or FastAPI backend.

**What gets built:**
- Database tables: `users`, `complaints`, `worker_assignments`, `activity_logs`
- Row-Level Security (RLS) policies so citizens only see their own complaints and admins see all
- Auth with signup/login pages and protected routes
- Replace all mock data with real database reads/writes
- File storage for photo evidence uploads

### Phase 2 — Auth & Protected Routes

- Login and Register pages for citizens
- Admin login (role-based: `citizen` vs `admin`)
- Auth context/provider wrapping the app
- Protected route wrappers: citizens see their pages, admins see the dashboard
- Redirect unauthenticated users to login

### Phase 3 — AI-Powered Features (Lovable AI)

Use Lovable AI (gateway to Gemini/GPT) via edge functions for:

- **Text classification**: Auto-categorize complaint from description text
- **Priority prediction**: Auto-assign priority based on description urgency
- **Duplicate detection**: Compare new complaint text against existing complaints and flag potential duplicates before submission
- **Image classification**: Analyze uploaded photo to suggest category

Each AI feature gets its own edge function. The complaint form calls these on submission.

### Phase 4 — Enhanced Admin Dashboard

- Worker assignment panel (assign complaints to workers from a dropdown)
- Worker performance analytics (resolution time, complaints handled)
- Heatmap visualization using complaint lat/lng coordinates
- Date range filters for daily/weekly analytics
- Export data to CSV

### Phase 5 — Notifications & Real-Time

- In-app notification bell with unread count
- Toast notifications on status changes
- Real-time subscription so admin dashboard updates live when new complaints arrive

---

## Technical Details

### Database Schema (Phase 1)

```text
profiles
├── id (uuid, FK to auth.users)
├── role (text: 'citizen' | 'admin' | 'worker')
├── full_name (text)
├── phone (text)
└── created_at (timestamptz)

complaints
├── id (uuid, PK)
├── user_id (uuid, FK to profiles)
├── category (text)
├── description (text)
├── priority (text: high/medium/low)
├── status (text: pending/in_progress/resolved)
├── location_lat (float)
├── location_lng (float)
├── location_address (text)
├── image_url (text, nullable)
├── assigned_to (uuid, FK to profiles, nullable)
├── ai_category_suggestion (text, nullable)
├── ai_priority_suggestion (text, nullable)
├── duplicate_of (uuid, FK to complaints, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)

activity_logs
├── id (uuid, PK)
├── complaint_id (uuid, FK)
├── action (text)
├── performed_by (uuid, FK to profiles)
└── created_at (timestamptz)
```

### New Pages/Components

| File | Purpose |
|------|---------|
| `src/pages/Login.tsx` | Citizen & admin login |
| `src/pages/Register.tsx` | Citizen signup |
| `src/components/AuthProvider.tsx` | Auth context with role detection |
| `src/components/ProtectedRoute.tsx` | Route guard by role |
| `src/pages/ComplaintDetail.tsx` | Single complaint view with timeline |
| `src/components/WorkerAssignment.tsx` | Admin worker assignment panel |
| `src/components/ComplaintHeatmap.tsx` | Map visualization of complaint density |

### AI Edge Functions

| Function | Input | Output |
|----------|-------|--------|
| `classify-complaint` | description text | category + priority suggestion |
| `check-duplicate` | description text | list of similar complaint IDs with similarity scores |
| `classify-image` | image URL | suggested category from photo |

All use Lovable AI gateway (`google/gemini-3-flash-preview`) with tool calling for structured output.

---

## Recommended Next Step

**Phase 1 is the foundation.** I recommend starting by enabling Lovable Cloud, setting up the database schema with RLS, and adding authentication. This makes everything else possible.

Would you like me to start with Phase 1 (enable Cloud + database + auth)?

