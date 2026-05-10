# AmbuLink — Ecosystem, Architecture, Backend & Applications

> Technical deep-dive into the AmbuLink platform: how every component fits together, communicates, and scales.

---

## Table of Contents

1. [Ecosystem Overview](#1-ecosystem-overview)
2. [System Architecture](#2-system-architecture)
3. [Component Map](#3-component-map)
4. [Backend — Supabase & API Layer](#4-backend--supabase--api-layer)
5. [Web Application — Next.js](#5-web-application--nextjs)
6. [Driver Mobile Application — Flutter](#6-driver-mobile-application--flutter)
7. [Real-Time Engine](#7-real-time-engine)
8. [Nearest-Driver Matching Algorithm](#8-nearest-driver-matching-algorithm)
9. [Notification System](#9-notification-system)
10. [Database Schema](#10-database-schema)
11. [API Routes Reference](#11-api-routes-reference)
12. [Security Architecture](#12-security-architecture)
13. [Deployment Infrastructure](#13-deployment-infrastructure)
14. [Data Flow Diagrams](#14-data-flow-diagrams)

---

## 1. Ecosystem Overview

AmbuLink is a **three-component digital platform** designed as a unified emergency response ecosystem. Each component is independently deployable but tightly integrated through a shared Supabase backend and a shared TypeScript type system.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AmbuLink Ecosystem                           │
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│   │  Web App     │    │  Driver App  │    │   Admin Dashboard    │  │
│   │  (Next.js)   │    │  (Flutter)   │    │   (Next.js /admin)   │  │
│   └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
│          │                   │                        │              │
│          └───────────────────┴────────────────────────┘              │
│                              │                                       │
│                    ┌─────────▼──────────┐                            │
│                    │  Next.js API Layer │                            │
│                    │  (Business Logic,  │                            │
│                    │   RBAC, Matching)  │                            │
│                    └─────────┬──────────┘                            │
│                              │                                       │
│          ┌───────────────────┼───────────────────┐                   │
│          │                   │                   │                   │
│  ┌───────▼──────┐  ┌────────▼───────┐  ┌────────▼───────┐           │
│  │  Supabase    │  │  Supabase      │  │  Firebase      │           │
│  │  PostgreSQL  │  │  Realtime      │  │  Cloud Msg     │           │
│  │  + Auth      │  │  (GPS Updates) │  │  (FCM Alerts)  │           │
│  └──────────────┘  └────────────────┘  └────────────────┘           │
│                                                                     │
│                    ┌───────────────────┐                             │
│                    │  Google Maps API  │                             │
│                    │  (Navigation +    │                             │
│                    │   Places)         │                             │
│                    └───────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

AmbuLink follows a **three-tier architecture** deployed on Vercel's global edge network.

### Architecture Diagram

<!-- SCREENSHOT: System Architecture Diagram — Three-Tier Layer (Presentation / Application / Database) -->
> *Screenshot placeholder — add `/docs/screenshots/architecture-diagram.png`*

---

### Tier 1 — Presentation Layer

| Component | Technology | Purpose |
|---|---|---|
| Web Application | Next.js 14 (App Router) | User booking, SOS, tracking, institutional portal |
| Admin Dashboard | Next.js 14 `/admin` routes | Monitoring, management, analytics |
| Driver Mobile App | Flutter (Android) | Request handling, GPS broadcasting, navigation |

### Tier 2 — Application Layer

| Component | Technology | Purpose |
|---|---|---|
| API Routes | Next.js API Routes (TypeScript) | Business logic, RBAC enforcement |
| Matching Engine | Custom Haversine Algorithm | Nearest-driver computation |
| Notification Dispatcher | Firebase Admin SDK | FCM push alert routing |
| Auth Middleware | Supabase Auth + JWT | Session validation on every request |

### Tier 3 — Data Layer

| Component | Technology | Purpose |
|---|---|---|
| Primary Database | Supabase PostgreSQL 15 | All persistent data storage |
| Real-Time Engine | Supabase Realtime | Live driver location + booking status |
| Object Storage | Supabase Storage | Driver documents, vehicle images |
| Row-Level Security | Supabase RLS Policies | Data isolation between user roles |

---

## 3. Component Map

```
ambulink/
│
├── web/                                # Next.js 14 Web Application
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # User home + SOS button
│   │   │   └── track/[bookingId]/     # Live tracking map
│   │   ├── bookings/
│   │   │   ├── emergency/page.tsx     # Emergency SOS flow
│   │   │   └── scheduled/page.tsx     # Scheduled booking form
│   │   ├── institution/
│   │   │   └── portal/page.tsx        # Institutional priority portal
│   │   └── admin/
│   │       ├── dashboard/page.tsx     # Admin overview + map
│   │       ├── drivers/page.tsx       # Driver management
│   │       ├── bookings/page.tsx      # All bookings table
│   │       ├── institutions/page.tsx  # Institution approval
│   │       └── reports/page.tsx       # Analytics + export
│   │
│   ├── components/
│   │   ├── sos-button/               # One-tap SOS component
│   │   ├── tracking-map/             # Google Maps live tracking
│   │   ├── booking-form/             # Emergency + scheduled forms
│   │   ├── driver-card/              # Driver info + ETA display
│   │   └── status-badge/             # Booking state badge
│   │
│   ├── lib/
│   │   ├── supabase/                 # Supabase client (server + browser)
│   │   ├── matching/                 # Haversine nearest-driver algorithm
│   │   ├── notifications/            # FCM dispatch helpers
│   │   └── types/                    # Shared TypeScript types
│   │
│   └── app/api/                      # Next.js API Routes
│       ├── auth/
│       ├── bookings/
│       ├── drivers/
│       ├── hospitals/
│       ├── institutions/
│       ├── notifications/
│       └── admin/
│
├── driver-app/                        # Flutter Android Application
│   └── lib/
│       ├── screens/
│       │   ├── home_screen.dart       # Availability toggle + requests
│       │   ├── booking_screen.dart    # Incoming request detail
│       │   └── navigation_screen.dart # Google Maps routing
│       ├── services/
│       │   ├── location_service.dart  # Background GPS broadcasting
│       │   ├── fcm_service.dart       # Push notification handling
│       │   └── api_service.dart       # HTTP client for API routes
│       └── models/
│           ├── booking.dart
│           └── driver.dart
│
└── supabase/
    ├── migrations/                    # Versioned SQL schema migrations
    ├── seed.sql                       # Demo data + default credentials
    └── config.toml                    # Local Supabase CLI config
```

---

## 4. Backend — Supabase & API Layer

### 4.1 Database Overview

The AmbuLink backend is powered by **Supabase (PostgreSQL 15)** providing:

- Persistent relational storage for all bookings, users, and driver data
- **Row-Level Security (RLS)** ensuring strict data isolation between roles
- **Database Triggers** automating booking state transitions
- **Supabase Realtime** for live GPS and booking status subscriptions

### 4.2 Core Database Tables

| Table | Description |
|---|---|
| `users` | All registered accounts: patients, institutional reps, admins |
| `drivers` | Driver profiles: vehicle info, coverage zone, verification status |
| `driver_locations` | Real-time GPS coordinates, updated every 5 seconds |
| `coverage_zones` | Geographic polygons defining each driver's service area |
| `bookings` | All booking records — emergency and scheduled |
| `hospitals` | Registered hospital directory with GPS coordinates |
| `institutions` | Registered organisations (banks, factories, hotels, etc.) |
| `notifications` | Push notification records for users and drivers |
| `trip_history` | Completed trip records with timestamps and GPS snapshots |
| `feedback` | Post-trip ratings and comments |
| `audit_logs` | System-wide activity log for all booking and admin actions |

### 4.3 Database Triggers

| Trigger | Event | Purpose |
|---|---|---|
| `trg_booking_driver_assign` | `INSERT` on `bookings` | Auto-queries nearest online driver |
| `trg_driver_status_on_assign` | Booking accepted | Sets driver status → `assigned` |
| `trg_driver_status_on_complete` | Trip completed | Returns driver status → `online` |
| `trg_trip_history_on_complete` | Booking status = `completed` | Inserts final trip record |
| `trg_notification_on_assign` | Driver assigned | Fires FCM push to user |
| `trg_notification_on_arrival` | Driver marks `at_scene` | Fires FCM arrival alert to user |

### 4.4 Row-Level Security Policy Summary

```sql
-- Users can only read/write their own booking records
CREATE POLICY "Users access own bookings"
ON bookings FOR ALL
USING (auth.uid() = user_id);

-- Drivers can only see bookings assigned to them
CREATE POLICY "Drivers access assigned bookings"
ON bookings FOR SELECT
USING (auth.uid() = driver_id);

-- Only admins have unrestricted access
CREATE POLICY "Admin full access"
ON bookings FOR ALL
USING (get_user_role(auth.uid()) = 'admin');
```

### 4.5 API Layer

All business logic runs through **Next.js API Routes** on the server side. Every route:

1. Validates the Supabase session token
2. Checks the user's role against the required permission
3. Executes the database operation
4. Returns a typed JSON response

No client-side code ever has direct write access to sensitive tables.

---

## 5. Web Application — Next.js

### 5.1 Emergency SOS Booking Flow

<!-- SCREENSHOT: User Emergency Booking Interface — one-tap SOS screen with GPS location detection -->
> *Screenshot placeholder — add `/docs/screenshots/sos-screen.png`*

---

1. User taps the **SOS button** on the dashboard
2. Browser Geolocation API captures the user's GPS coordinates
3. `POST /api/bookings/emergency` is called with coordinates
4. API runs the **Haversine nearest-driver algorithm** against all online drivers
5. Closest driver receives an **FCM push notification** with booking details
6. User sees the driver's name, vehicle, and **live location on map** within 3 seconds
7. Booking status transitions: `requested → assigned → en_route → at_scene → transporting → completed`

### 5.2 Scheduled Booking Flow

<!-- SCREENSHOT: Scheduled Booking Interface — date/time picker and hospital chooser -->
> *Screenshot placeholder — add `/docs/screenshots/scheduled-booking.png`*

---

1. User selects future date, time, and pickup location (Google Maps Places Autocomplete)
2. User selects destination hospital from directory or enters custom destination
3. Booking stored in `bookings` table with status `pending_assignment`
4. Booking appears on **Admin Dashboard** for driver assignment
5. Admin assigns a driver → driver receives FCM notification
6. Driver arrives at scheduled time

### 5.3 Institutional Emergency Portal

<!-- SCREENSHOT: Institutional Emergency Portal — priority booking interface -->
> *Screenshot placeholder — add `/docs/screenshots/institutional-portal.png`*

---

- Registered organisations access a dedicated portal with their verified address **pre-populated**
- Submissions are flagged as **priority bookings** in the dispatch queue
- Institutional reps can view their complete booking history and export safety reports

### 5.4 Admin Dashboard

<!-- SCREENSHOT: Admin Dashboard — live booking overview with driver map and analytics -->
> *Screenshot placeholder — add `/docs/screenshots/admin-dashboard-full.png`*

---

Key admin capabilities:

- **Live map** showing all online drivers and active bookings simultaneously
- **Booking management table** with real-time status updates
- **Driver verification and management** — approve, suspend, or edit driver profiles
- **Institution approval** — review and activate institutional accounts
- **Analytics module** — response time trends, bookings by region, peak demand periods
- **Audit log viewer** — tamper-proof record of all system actions
- **Report generation** — exportable operational reports

---

## 6. Driver Mobile Application — Flutter

### 6.1 Overview

The driver app is built in **Flutter** targeting Android devices, designed to run reliably on low-end smartphones with limited RAM and intermittent connectivity.

### 6.2 Key Screens

<!-- SCREENSHOT: Driver Mobile App — Home Screen showing availability toggle -->
> *Screenshot placeholder — add `/docs/screenshots/driver-home.png`*

---

<!-- SCREENSHOT: Driver Navigation Interface — Google Maps routing to patient -->
> *Screenshot placeholder — add `/docs/screenshots/driver-navigation.png`*

---

### 6.3 GPS Broadcasting

The driver app runs a **background location service** that broadcasts GPS coordinates to the `driver_locations` table every 5 seconds when the driver is online:

```dart
// Location broadcast loop — every 5 seconds
Timer.periodic(Duration(seconds: 5), (timer) async {
  if (!isOnline) return;
  final position = await Geolocator.getCurrentPosition();
  await apiService.updateDriverLocation(
    latitude: position.latitude,
    longitude: position.longitude,
  );
});
```

### 6.4 Incoming Request Handling

- Incoming booking triggers a **full-screen FCM notification** with 30-second accept/decline timer
- Accepted requests immediately launch **Google Maps navigation** to patient location
- Driver status transitions are synced to Supabase in real time

---

## 7. Real-Time Engine

AmbuLink uses **Supabase Realtime** (built on PostgreSQL logical replication + WebSockets) for two live data streams:

### 7.1 Driver Location Stream

```typescript
// Subscribe to real-time driver location updates on the tracking map
const channel = supabase
  .channel('driver-location')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'driver_locations',
    filter: `driver_id=eq.${driverId}`,
  }, (payload) => {
    updateMapMarker(payload.new.latitude, payload.new.longitude);
  })
  .subscribe();
```

### 7.2 Booking Status Stream

```typescript
// Subscribe to real-time booking status changes
const channel = supabase
  .channel('booking-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'bookings',
    filter: `id=eq.${bookingId}`,
  }, (payload) => {
    updateBookingStatus(payload.new.status);
  })
  .subscribe();
```

---

## 8. Nearest-Driver Matching Algorithm

The matching algorithm uses the **Haversine formula** to compute the great-circle distance between the patient's GPS coordinates and all currently online drivers, selecting the closest available one.

```typescript
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearestDriver(userLat: number, userLon: number) {
  const { data: drivers } = await supabase
    .from('driver_locations')
    .select('driver_id, latitude, longitude')
    .eq('is_online', true);

  return drivers
    ?.map(d => ({
      ...d,
      distance: haversineDistance(userLat, userLon, d.latitude, d.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}
```

**Performance:** Match computation for 50 concurrent online drivers completes in **< 180ms**.

---

## 9. Notification System

AmbuLink uses **Firebase Cloud Messaging (FCM)** for all push notifications.

### Notification Events

| Event | Recipient | Message |
|---|---|---|
| Emergency booking created | Nearest driver | New emergency request — patient location + distance |
| Driver assigned | Patient/User | [Driver name] is on the way — ETA: X minutes |
| Driver at scene | Patient/User | Your ambulance has arrived |
| Trip completed | Patient/User | Trip complete — rate your experience |
| Scheduled booking confirmed | User | Your booking is confirmed for [date/time] |
| Scheduled booking assigned | Driver | New assignment for [date/time] |

### FCM Integration

```typescript
// Send FCM notification via Firebase Admin SDK
await admin.messaging().send({
  token: recipientFcmToken,
  notification: {
    title: notificationTitle,
    body: notificationBody,
  },
  data: {
    bookingId: booking.id,
    type: notificationType,
  },
  android: {
    priority: 'high',
  },
});
```

---

## 10. Database Schema

### Core Booking Tables — ERD

<!-- SCREENSHOT: ERD — Core Booking Tables (all tables with primary keys, foreign keys, Crow's Foot notation) -->
> *Screenshot placeholder — add `/docs/screenshots/erd-core.png`*

---

### Driver and Location Tables — ERD

<!-- SCREENSHOT: ERD — Driver and Location Tables (with real-time location table and coverage zone relationships) -->
> *Screenshot placeholder — add `/docs/screenshots/erd-driver.png`*

---

### Booking Status State Machine

```
requested
    │
    ▼
assigned  ←── (rejected → re-queued → requested)
    │
    ▼
en_route
    │
    ▼
at_scene
    │
    ▼
transporting
    │
    ▼
completed
```

Each transition is recorded in `trip_history` with a UTC timestamp and GPS coordinates.

---

## 11. API Routes Reference

| Method | Route | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | User authentication |
| GET | `/api/auth/me` | Yes | Current session user |
| POST | `/api/bookings/emergency` | User | Create emergency SOS booking |
| POST | `/api/bookings/scheduled` | User | Create scheduled booking |
| GET | `/api/bookings` | Yes | List bookings (role-filtered) |
| POST | `/api/bookings/[id]/accept` | Driver | Driver accepts booking |
| POST | `/api/bookings/[id]/complete` | Driver | Driver marks trip complete |
| GET | `/api/drivers/nearest` | System | Find nearest online driver |
| POST | `/api/drivers/location` | Driver | Update driver GPS coordinates |
| GET | `/api/hospitals` | Yes | List registered hospitals |
| GET | `/api/admin/dashboard` | Admin | Analytics and booking overview |
| POST | `/api/institutions/booking` | Institution | Institutional priority booking |
| GET | `/api/notifications` | Yes | Get user notifications |

---

## 12. Security Architecture

### Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| Patient / User | Own bookings, tracking, trip history, feedback |
| Institutional Rep | Institutional bookings and history for their organisation only |
| Driver | Assigned bookings, own location, own trip history and earnings |
| Admin | Full system access, all data, audit logs, reports |

### Security Controls

- **JWT Validation** on every API request via Supabase Auth middleware
- **RLS Policies** enforce data isolation at PostgreSQL level — independent of application logic
- **RBAC Middleware** checks user role on every protected API route
- **No direct database access** from client applications — all writes via API routes
- **Environment secrets** stored in Vercel encrypted environment variables, never in code
- **Audit logs** are append-only — no UI route exists to edit or delete them
- **GPS spoofing detection** flags statistically impossible location jumps at API layer
- **Institutional account verification** required before portal access is granted

---

## 13. Deployment Infrastructure

### Deployment Diagram

<!-- SCREENSHOT: Vercel and Supabase Deployment Dashboard — build status, deployment time, domain assignments -->
> *Screenshot placeholder — add `/docs/screenshots/deployment-dashboard.png`*

---

### Deployment Stack

| Service | Provider | Purpose |
|---|---|---|
| Web App Hosting | Vercel (Edge Network) | Next.js production deployment |
| CI/CD Pipeline | GitHub → Vercel | Auto-deploy on push to `main` |
| Database | Supabase Cloud | PostgreSQL + Auth + Realtime + Storage |
| Database Backups | Supabase | Automated daily backups + point-in-time recovery |
| Push Notifications | Firebase Cloud Messaging | FCM delivery to all platforms |
| Maps | Google Cloud | Maps, Places Autocomplete, Directions API |

### CI/CD Flow

```
Developer pushes to main branch on GitHub
    │
    ▼
GitHub triggers Vercel deployment webhook
    │
    ▼
Vercel builds Next.js application (< 40 seconds)
    │
    ▼
Build artifacts deployed to Vercel Edge Network
    │
    ▼
Production environment live at ambulink.ug
```

### Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# Firebase
FCM_SERVER_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

---

## 14. Data Flow Diagrams

### Context Diagram (Level 0 DFD)

<!-- SCREENSHOT: System Context Diagram — system boundary with all external entities (User, Driver, Admin, Hospital) -->
> *Screenshot placeholder — add `/docs/screenshots/dfd-level0.png`*

---

### Level 1 DFD — Booking Module

<!-- SCREENSHOT: Level 1 DFD — Booking Module (User Mgmt, Request Handling, Driver Matching, Tracking, Trip Completion) -->
> *Screenshot placeholder — add `/docs/screenshots/dfd-level1-booking.png`*

---

### Level 1 DFD — Driver Dispatch Module

<!-- SCREENSHOT: Level 1 DFD — Driver Dispatch Module (Driver Reg, Availability, Request Receipt, Navigation, Trip Report) -->
> *Screenshot placeholder — add `/docs/screenshots/dfd-level1-driver.png`*

---

### Level 2 DFD — Emergency Booking Subprocess

<!-- SCREENSHOT: Level 2 DFD — Emergency Booking Subprocess (all stage transitions and notification data flows) -->
> *Screenshot placeholder — add `/docs/screenshots/dfd-level2-emergency.png`*

---

*AmbuLink — Built at Kampala International University, Uganda 🇺🇬 · © 2026*
