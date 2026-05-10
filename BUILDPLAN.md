# AmbuLink — Build Plan

> End-to-end development roadmap for the Smart Ambulance Booking System.
> Covers environment setup, phased implementation, testing strategy, and deployment.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Summary](#2-tech-stack-summary)
3. [Development Phases](#3-development-phases)
4. [Phase 1 — Environment & Foundation](#phase-1--environment--foundation)
5. [Phase 2 — Authentication & User Management](#phase-2--authentication--user-management)
6. [Phase 3 — Core Booking Engine](#phase-3--core-booking-engine)
7. [Phase 4 — Real-Time Tracking & Matching](#phase-4--real-time-tracking--matching)
8. [Phase 5 — Driver Mobile Application](#phase-5--driver-mobile-application)
9. [Phase 6 — Institutional Portal & Highway Module](#phase-6--institutional-portal--highway-module)
10. [Phase 7 — Admin Dashboard & Analytics](#phase-7--admin-dashboard--analytics)
11. [Phase 8 — Notifications & Alerts](#phase-8--notifications--alerts)
12. [Phase 9 — Testing & QA](#phase-9--testing--qa)
13. [Phase 10 — Deployment & Go-Live](#phase-10--deployment--go-live)
14. [Future Phases](#future-phases)
15. [Milestones & Timeline Summary](#milestones--timeline-summary)

---

## 1. Project Overview

**Project Name:** AmbuLink — Smart Ambulance Booking System
**Team:** Tumusiime Mahad · Mugisha Abdul · Kato Ashraf
**Institution:** Kampala International University
**Supervisor:** Mr. Tumwebaze Wilson
**Target Completion:** 2026

### Goal

Build a production-ready three-component platform that reduces emergency ambulance response time across Uganda by connecting patients, institutions, highway users, and remote communities with the nearest available driver in real time.

### Components

| Component | Technology | Status |
|---|---|---|
| Web Application (Users + Admin) | Next.js 14, TypeScript, Tailwind CSS | 🟢 Complete |
| Driver Mobile App | Flutter (Android) | 🟢 Complete |
| Backend & Database | Supabase (PostgreSQL 15) | 🟢 Complete |

---

## 2. Tech Stack Summary

| Layer | Tool | Version |
|---|---|---|
| Web Framework | Next.js | 14 (App Router) |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS + Shadcn UI | Latest |
| Database | Supabase (PostgreSQL) | 15 |
| Auth | Supabase Auth | Latest |
| Real-Time | Supabase Realtime | Latest |
| Mobile App | Flutter | Latest stable |
| Maps | Google Maps API | Latest |
| Notifications | Firebase Cloud Messaging | Latest |
| Hosting | Vercel | Latest |
| CI/CD | GitHub Actions → Vercel | — |

---

## 3. Development Phases

The project followed the **Agile Software Development Methodology**, structured into iterative phases with continuous stakeholder feedback loops.

```
Phase 1: Environment & Foundation
    ↓
Phase 2: Authentication & User Management
    ↓
Phase 3: Core Booking Engine
    ↓
Phase 4: Real-Time Tracking & Matching
    ↓
Phase 5: Driver Mobile Application
    ↓
Phase 6: Institutional Portal & Highway Module
    ↓
Phase 7: Admin Dashboard & Analytics
    ↓
Phase 8: Notifications & Alerts
    ↓
Phase 9: Testing & QA
    ↓
Phase 10: Deployment & Go-Live
```

---

## Phase 1 — Environment & Foundation

### Objectives
Set up all development tools, repository structure, local database stack, and shared type definitions before writing any feature code.

### Tasks

- [ ] Initialise Git repository and create GitHub project with branch protection on `main`
- [ ] Scaffold Next.js 14 project with App Router and TypeScript
- [ ] Configure Tailwind CSS and Shadcn UI component library
- [ ] Install and configure Supabase CLI (`supabase init`, `supabase start`)
- [ ] Scaffold Flutter project for the driver app (`flutter create driver_app`)
- [ ] Set up shared TypeScript types package (`/lib/types/`)
- [ ] Create initial `.env.local` with all required environment variable keys (empty values)
- [ ] Configure ESLint, Prettier, and TypeScript strict mode
- [ ] Create initial folder structure for all modules (see Component Map)
- [ ] Write base Supabase migration for initial schema skeleton
- [ ] Commit and verify local development environment is fully functional

### Screenshot Placeholders

<!-- SCREENSHOT: VS Code workspace with AmbuLink project structure open -->
> *Screenshot placeholder — add `/docs/screenshots/dev-environment.png`*

---

### Deliverables
- Working local Next.js dev server
- Local Supabase stack running (`supabase start`)
- Flutter project running on Android emulator
- Initial schema migration applied

---

## Phase 2 — Authentication & User Management

### Objectives
Implement unified authentication across all three components with role-based access from the start.

### Tasks

**Database**
- [ ] Create `users` table with `role` ENUM (`patient`, `driver`, `institution_rep`, `admin`)
- [ ] Write RLS policies: users can read/write only their own records
- [ ] Create admin bypass policy for full access
- [ ] Write seed data with one account per role (demo credentials)

**Web Application**
- [ ] Build `/login` page with email + password form
- [ ] Build `/register` page with role selection
- [ ] Implement Supabase Auth sign-in and sign-up flows
- [ ] Create auth middleware (`middleware.ts`) to protect all non-public routes
- [ ] Implement role check helper: `getUserRole(session)`
- [ ] Build post-login redirect logic (patient → `/dashboard`, driver → driver app, admin → `/admin`)

**API Routes**
- [ ] `POST /api/auth/login` — validate credentials, return session
- [ ] `GET /api/auth/me` — return current user with role
- [ ] Implement RBAC middleware wrapper for all subsequent API routes

**Flutter Driver App**
- [ ] Implement login screen with email + password
- [ ] Store session token securely using `flutter_secure_storage`
- [ ] Implement session refresh on app resume

### Screenshot Placeholders

<!-- SCREENSHOT: Login page — clean email/password UI with AmbuLink branding -->
> *Screenshot placeholder — add `/docs/screenshots/login-page.png`*

<!-- SCREENSHOT: Register page — form with role selector -->
> *Screenshot placeholder — add `/docs/screenshots/register-page.png`*

---

### Deliverables
- Working login and registration across web and Flutter
- Role-based routing and route protection active
- Demo seed accounts functional

---

## Phase 3 — Core Booking Engine

### Objectives
Build the full emergency SOS and scheduled booking workflow, including the data model, API layer, and user-facing interfaces.

### Tasks

**Database**
- [ ] Create `hospitals` table with GPS coordinates and facility details
- [ ] Create `bookings` table with full status state machine (`requested`, `assigned`, `en_route`, `at_scene`, `transporting`, `completed`, `cancelled`)
- [ ] Create `trip_history` table for completed booking records
- [ ] Write RLS policies for bookings (user sees own, driver sees assigned, admin sees all)
- [ ] Implement `trg_booking_driver_assign` database trigger for auto-matching on INSERT

**API Routes**
- [ ] `POST /api/bookings/emergency` — validate GPS input, trigger matching, create booking
- [ ] `POST /api/bookings/scheduled` — validate future date/time, store pending booking
- [ ] `GET /api/bookings` — list bookings filtered by role
- [ ] `GET /api/hospitals` — return hospital directory with GPS coordinates
- [ ] `POST /api/bookings/[id]/cancel` — cancel booking with reason

**Web Application**
- [ ] Build SOS button component (full-screen, one-tap, prominent red design)
- [ ] Implement browser Geolocation API capture on SOS activation
- [ ] Build emergency booking confirmation screen (driver ETA + details)
- [ ] Build scheduled booking form (date picker, time picker, Google Maps Places Autocomplete for pickup, hospital selector)
- [ ] Build booking history page with status badges
- [ ] Implement real-time booking status updates (Supabase Realtime subscription)

### Screenshot Placeholders

<!-- SCREENSHOT: SOS screen — one-tap emergency button with GPS detection active -->
> *Screenshot placeholder — add `/docs/screenshots/sos-active.png`*

<!-- SCREENSHOT: Booking confirmation screen — driver assigned, ETA showing -->
> *Screenshot placeholder — add `/docs/screenshots/booking-confirmed.png`*

<!-- SCREENSHOT: Scheduled booking form — date/time picker and hospital chooser -->
> *Screenshot placeholder — add `/docs/screenshots/scheduled-form.png`*

---

### Deliverables
- Emergency SOS booking creates a record and triggers matching
- Scheduled booking stored and visible on admin dashboard
- User can view booking status in real time

---

## Phase 4 — Real-Time Tracking & Matching

### Objectives
Implement the Haversine nearest-driver matching algorithm and the live GPS tracking map.

### Tasks

**Database**
- [ ] Create `driver_locations` table (driver_id, latitude, longitude, updated_at, is_online)
- [ ] Create index on `is_online` + `updated_at` for fast online driver queries
- [ ] Enable Supabase Realtime on `driver_locations` and `bookings` tables

**Matching Engine**
- [ ] Implement `haversineDistance(lat1, lon1, lat2, lon2): number`
- [ ] Implement `findNearestDriver(userLat, userLon): Promise<Driver>`
- [ ] Add coverage zone filter: only match drivers whose zone covers the user's area
- [ ] Write unit tests for matching algorithm (edge cases: no drivers online, driver at same coordinates)

**API Routes**
- [ ] `GET /api/drivers/nearest` — compute and return nearest online driver
- [ ] `POST /api/drivers/location` — update driver GPS position (driver auth required)

**Web Application**
- [ ] Integrate Google Maps JavaScript API in tracking map component
- [ ] Render user location marker and driver location marker
- [ ] Subscribe to `driver_locations` Supabase Realtime channel and update marker position live
- [ ] Display driver name, vehicle type, distance, and ETA in info panel below map
- [ ] Auto-pan map to keep both markers in view as driver moves

### Screenshot Placeholders

<!-- SCREENSHOT: Real-time tracking map — driver marker moving toward patient location -->
> *Screenshot placeholder — add `/docs/screenshots/tracking-live.png`*

<!-- SCREENSHOT: Tracking map — driver arrived marker state -->
> *Screenshot placeholder — add `/docs/screenshots/tracking-arrived.png`*

---

### Deliverables
- Haversine algorithm matches nearest driver in < 200ms for 50 concurrent drivers
- Live map updates driver position in < 1 second
- Matching algorithm unit tests passing

---

## Phase 5 — Driver Mobile Application

### Objectives
Build the complete Flutter driver app with GPS broadcasting, request handling, and navigation.

### Tasks

**Flutter App**
- [ ] Build Home Screen: availability toggle (Online/Offline), recent requests list
- [ ] Implement background GPS service using `geolocator` package — broadcasts every 5 seconds when online
- [ ] Integrate FCM using `firebase_messaging` package for incoming booking alerts
- [ ] Build full-screen incoming request notification with 30-second accept/decline timer
- [ ] Build Booking Screen: patient details, distance, accept/decline buttons
- [ ] Build Navigation Screen: launch Google Maps with directions to patient location
- [ ] Build Trip completion screen with status update button
- [ ] Build trip history screen
- [ ] Implement coverage zone setting in driver profile

**API Integration**
- [ ] `POST /api/drivers/location` — called every 5 seconds from background service
- [ ] `POST /api/bookings/[id]/accept` — called on accept tap
- [ ] `POST /api/bookings/[id]/complete` — called on trip completion

**Testing**
- [ ] Test on Android emulator: low-end device simulation (1GB RAM, Android 9)
- [ ] Test GPS accuracy in different simulated environments
- [ ] Test FCM notification delivery with app in foreground, background, and terminated state

### Screenshot Placeholders

<!-- SCREENSHOT: Driver app — Home Screen with online toggle and availability status -->
> *Screenshot placeholder — add `/docs/screenshots/driver-home.png`*

<!-- SCREENSHOT: Driver app — Full-screen incoming request with timer -->
> *Screenshot placeholder — add `/docs/screenshots/driver-incoming-request.png`*

<!-- SCREENSHOT: Driver app — Navigation screen with Google Maps routing -->
> *Screenshot placeholder — add `/docs/screenshots/driver-navigation.png`*

<!-- SCREENSHOT: Driver app — Trip history list -->
> *Screenshot placeholder — add `/docs/screenshots/driver-trip-history.png`*

---

### Deliverables
- Driver app runs on Android with background GPS
- Incoming requests received via FCM and accepted within 30-second window
- Google Maps navigation launches correctly
- All driver status transitions synced to Supabase in real time

---

## Phase 6 — Institutional Portal & Highway Module

### Objectives
Build the dedicated portal for registered organisations and the highway accident reporting feature.

### Tasks

**Database**
- [ ] Create `institutions` table (name, type ENUM, address, GPS, verified, contact)
- [ ] Add `institution_id` foreign key to `bookings` table
- [ ] Add `is_priority` flag on `bookings` for institutional requests
- [ ] Write RLS policy: institutional reps see only their organisation's bookings

**Institutional Portal**
- [ ] Build institution registration and admin-approval flow
- [ ] Build institutional dashboard with pre-filled location on emergency form
- [ ] Implement priority flag on institutional bookings (appears first in admin dispatch queue)
- [ ] Build institutional booking history and export to CSV

**Highway Accident Reporting**
- [ ] Build highway reporting interface with Google Maps pin-drop
- [ ] Allow location submission via GPS coordinates or landmark description
- [ ] Tag highway bookings with road corridor label (Kampala-Jinja, Kampala-Masaka, etc.)
- [ ] Display highway incidents on admin live map with distinct marker type

### Screenshot Placeholders

<!-- SCREENSHOT: Institutional portal — emergency request form with pre-filled address -->
> *Screenshot placeholder — add `/docs/screenshots/institution-portal.png`*

<!-- SCREENSHOT: Highway reporting — map with pin-drop for accident location -->
> *Screenshot placeholder — add `/docs/screenshots/highway-report.png`*

<!-- SCREENSHOT: Admin map — highway incident markers displayed -->
> *Screenshot placeholder — add `/docs/screenshots/admin-highway-map.png`*

---

### Deliverables
- Institutional accounts can log in and submit priority bookings
- Highway pin-drop reports stored and visible on admin map
- Institutional booking history exportable

---

## Phase 7 — Admin Dashboard & Analytics

### Objectives
Build the comprehensive admin command centre with live monitoring, driver management, and analytics.

### Tasks

**Admin Dashboard**
- [ ] Build overview page with live stats cards (active bookings, online drivers, today's completed trips)
- [ ] Integrate live Google Maps showing all online drivers and active bookings simultaneously
- [ ] Build all-bookings table with real-time status updates, filtering, and sorting
- [ ] Build driver management table: view, verify, suspend, and edit driver profiles
- [ ] Build coverage zone management: assign and edit geographic zones per driver
- [ ] Build institution approval queue: review pending institutions and activate or reject
- [ ] Build audit log viewer: paginated, read-only, tamper-proof

**Analytics Module**
- [ ] Average ambulance response time by region (daily, weekly, monthly)
- [ ] Bookings count by type (emergency, scheduled, institutional, highway)
- [ ] Driver utilisation rate per driver and fleet-wide
- [ ] Peak demand heatmap by time of day and day of week
- [ ] Geographic coverage gap map (areas with no online drivers)
- [ ] Report generation: export filtered data as PDF or CSV

### Screenshot Placeholders

<!-- SCREENSHOT: Admin dashboard overview — stats cards, live driver map -->
> *Screenshot placeholder — add `/docs/screenshots/admin-overview.png`*

<!-- SCREENSHOT: Admin driver management table — verification status, coverage zone -->
> *Screenshot placeholder — add `/docs/screenshots/admin-drivers.png`*

<!-- SCREENSHOT: Admin analytics — response time chart and booking breakdown -->
> *Screenshot placeholder — add `/docs/screenshots/admin-analytics.png`*

<!-- SCREENSHOT: Admin audit log — append-only activity feed -->
> *Screenshot placeholder — add `/docs/screenshots/admin-audit-log.png`*

---

### Deliverables
- Admin can monitor all active bookings and drivers live
- Driver verification workflow complete
- Analytics charts rendering with real data
- Report export functional (PDF + CSV)

---

## Phase 8 — Notifications & Alerts

### Objectives
Implement the full push notification system across web and mobile for all booking lifecycle events.

### Tasks

**Firebase Setup**
- [ ] Create Firebase project and configure Android app for Flutter driver app
- [ ] Configure Firebase Admin SDK in Next.js backend
- [ ] Store FCM server key in Vercel environment variables

**FCM Integration**
- [ ] Implement `sendNotification(recipientToken, title, body, data)` helper
- [ ] Wire `trg_notification_on_assign` trigger to call FCM dispatch API route
- [ ] Wire `trg_notification_on_arrival` trigger to call FCM dispatch API route
- [ ] Send FCM notification to driver on new booking assignment
- [ ] Send FCM notification to driver on scheduled booking 30 minutes before pickup
- [ ] Send FCM notification to user when driver is assigned (with ETA)
- [ ] Send FCM notification to user when driver marks `at_scene`
- [ ] Send FCM notification to admin on new institutional booking
- [ ] Implement in-app notification bell with unread count badge

**Flutter App**
- [ ] Handle FCM in foreground (custom in-app alert overlay)
- [ ] Handle FCM in background (system notification → opens app to booking screen)
- [ ] Handle FCM when app is terminated (system notification → cold start to booking screen)

### Screenshot Placeholders

<!-- SCREENSHOT: FCM notification on Android — incoming emergency request -->
> *Screenshot placeholder — add `/docs/screenshots/fcm-notification-android.png`*

<!-- SCREENSHOT: In-app notification bell — unread count badge -->
> *Screenshot placeholder — add `/docs/screenshots/notification-bell.png`*

---

### Deliverables
- All 6 notification events firing correctly
- FCM delivery confirmed in all three app states (foreground, background, terminated)
- In-app notification feed functional

---

## Phase 9 — Testing & QA

### Objectives
Systematically validate every system component against functional and non-functional requirements.

### Tasks

**Unit Testing** (Target: 44 tests, 0 failures)

| Module | Tests |
|---|---|
| Authentication & RBAC | 7 |
| Emergency SOS Booking | 8 |
| Nearest-Driver Matching | 6 |
| Scheduled Booking | 5 |
| Institutional Portal | 5 |
| Driver App API | 8 |
| Admin Dashboard | 5 |

**Integration Testing**
- [ ] SOS booking → nearest-driver match → FCM notification end-to-end
- [ ] Driver acceptance → booking status transition → user real-time update
- [ ] Driver location update → map marker refresh
- [ ] Scheduled booking → admin assignment → driver notification
- [ ] Institutional priority booking → priority flag in dispatch queue
- [ ] Trip completion → trip_history insert → driver status reset

**Security Testing**

| Test | Expected |
|---|---|
| User accessing admin routes | 401 Unauthorized |
| Unauthenticated API access | 401 Unauthorized |
| Driver accessing another driver's data | Empty result set |
| GPS location spoofing | Request flagged |
| Session token expiry | Session invalidated |
| Unverified institution booking | Access denied |
| Audit log edit attempt | No route exists |

**Performance Testing**

| Scenario | Target |
|---|---|
| SOS to driver notification (10 concurrent) | < 5 seconds |
| Dashboard page load | < 3 seconds |
| Real-time location map refresh | < 2 seconds |
| Nearest-driver algorithm (50 drivers) | < 500ms |
| Production deployment | < 40 seconds |

**User Acceptance Testing (UAT)**
- [ ] Recruit 30 participants across all stakeholder groups
- [ ] Prepare predefined task scripts for each user role
- [ ] Collect Likert scale ratings (1–5) across 5 dimensions:
  - Ease of Use
  - Functionality Completeness
  - System Performance
  - Security Confidence
  - Overall Satisfaction
- [ ] Document all qualitative feedback for system refinement

### Screenshot Placeholders

<!-- SCREENSHOT: UAT satisfaction ratings — bar chart by dimension and stakeholder group -->
> *Screenshot placeholder — add `/docs/screenshots/uat-results-chart.png`*

<!-- SCREENSHOT: Unit test runner — all 44 tests passing -->
> *Screenshot placeholder — add `/docs/screenshots/unit-tests-pass.png`*

---

### Deliverables
- All 44 unit tests passing
- All integration and security tests passing
- UAT average score ≥ 4.5/5
- Testing results documented in final report tables

---

## Phase 10 — Deployment & Go-Live

### Objectives
Deploy the full system to production infrastructure and confirm all components are functioning in the live environment.

### Tasks

**Supabase Production**
- [ ] Create Supabase production project (separate from local dev)
- [ ] Run all migrations against production database
- [ ] Configure production RLS policies
- [ ] Set up automated daily backup schedule
- [ ] Enable point-in-time recovery

**Vercel Deployment**
- [ ] Connect GitHub repository to Vercel project
- [ ] Configure all environment variables in Vercel encrypted environment
- [ ] Set up production domain (`ambulink.ug` or equivalent)
- [ ] Enable branch protection: only `main` deploys to production
- [ ] Confirm production build completes in < 40 seconds
- [ ] Run smoke tests against production URL

**Flutter App Release**
- [ ] Build production APK with `flutter build apk --release`
- [ ] Sign APK with production keystore
- [ ] Distribute to test devices for final validation
- [ ] Prepare Play Store listing (for future public release)

**Go-Live Checklist**
- [ ] All environment secrets confirmed in Vercel (no placeholder values)
- [ ] Supabase production database seeded with demo accounts
- [ ] Google Maps API key restricted to production domain only
- [ ] FCM server key confirmed active in production
- [ ] End-to-end SOS flow tested on production environment
- [ ] Admin dashboard loading and displaying real-time data
- [ ] Driver app connecting to production Supabase project
- [ ] All three demo accounts tested and functional

### Screenshot Placeholders

<!-- SCREENSHOT: Vercel production deployment — successful build and live domain -->
> *Screenshot placeholder — add `/docs/screenshots/vercel-production.png`*

<!-- SCREENSHOT: Supabase production dashboard — database connected and healthy -->
> *Screenshot placeholder — add `/docs/screenshots/supabase-production.png`*

---

### Deliverables
- Web application live on production domain
- Supabase production database operational with backups enabled
- Flutter APK built and distributable
- All go-live checks signed off

---

## Future Phases

| Phase | Feature | Priority |
|---|---|---|
| F1 | USSD / SMS fallback booking for areas without mobile data | High |
| F2 | iOS version of driver mobile application | High |
| F3 | AI-powered demand forecasting and driver pre-positioning | Medium |
| F4 | Vehicle telematics integration (fuel, mechanical status, driver behaviour) | Medium |
| F5 | Insurance and billing module | Medium |
| F6 | Multi-country support (East Africa expansion) | Low |
| F7 | Offline-first PWA mode for low-connectivity areas | Low |
| F8 | Machine learning dispatch optimisation | Low |

---

## Milestones & Timeline Summary

| Phase | Milestone | Status |
|---|---|---|
| 1 | Development environment configured | ✅ Complete |
| 2 | Auth and user management live | ✅ Complete |
| 3 | Core booking engine functional | ✅ Complete |
| 4 | Real-time tracking and matching live | ✅ Complete |
| 5 | Driver mobile app complete | ✅ Complete |
| 6 | Institutional portal and highway module live | ✅ Complete |
| 7 | Admin dashboard and analytics complete | ✅ Complete |
| 8 | Notification system fully wired | ✅ Complete |
| 9 | All testing phases passed | ✅ Complete |
| 10 | System deployed to production | ✅ Complete |
| F1 | USSD/SMS fallback | 🔵 Planned |
| F2 | iOS driver app | 🔵 Planned |
| F3 | AI demand forecasting | 🔵 Planned |

---

*AmbuLink Build Plan — Kampala International University · © 2026*
*Prepared by: Tumusiime Mahad · Mugisha Abdul · Kato Ashraf*
