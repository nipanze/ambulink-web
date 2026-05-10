# 🚑 AmbuLink

> **Smart Ambulance Booking System — Reducing Emergency Response Time Across Uganda**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Flutter](https://img.shields.io/badge/Flutter-Android-blue?style=flat-square&logo=flutter)](https://flutter.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📌 Overview

AmbuLink is a three-component digital emergency response platform that connects patients, institutions, highway users, and remote communities across Uganda with the nearest available registered ambulance driver — in real time.

Developed by students at **Kampala International University**, AmbuLink addresses a critical national public health gap: the complete absence of a coordinated, digital ambulance dispatch system in Uganda. Every year, hundreds of preventable deaths occur because no one could find an ambulance in time. AmbuLink exists to change that.

> *"This is not just a software project — it is a response to a national health emergency challenge, designed by Ugandan students for the benefit of Ugandan communities."*

---

## 📸 Screenshots

### Landing Page / SOS Interface
<!-- SCREENSHOT: System Login / Landing Page — user-facing login and SOS request interface -->
> *Screenshot placeholder — add `/docs/screenshots/landing-page.png`*

---

### Real-Time Ambulance Tracking Map
<!-- SCREENSHOT: Live GPS map showing driver location en route to patient -->
> *Screenshot placeholder — add `/docs/screenshots/tracking-map.png`*

---

### Admin Dashboard
<!-- SCREENSHOT: Admin Dashboard — live booking overview with driver map and analytics -->
> *Screenshot placeholder — add `/docs/screenshots/admin-dashboard.png`*

---

### Driver Mobile App
<!-- SCREENSHOT: Driver Home Screen — availability toggle and incoming request notification -->
> *Screenshot placeholder — add `/docs/screenshots/driver-app-home.png`*

---

## 🌍 Who AmbuLink Serves

| Context | Description |
|---|---|
| 🏙️ **Urban** | Kampala, Entebbe, Jinja, Mbarara, Gulu, Mbale |
| 🛣️ **Highways** | Kampala–Jinja, Kampala–Masaka, Kampala–Gulu, Kampala–Mbarara |
| 🏢 **Institutions** | Banks, hotels, factories, markets, schools, sports facilities, government offices |
| 🌾 **Remote Areas** | Karamoja, Bundibugyo, Kasese, and other underserved districts |

---

## ✨ Key Features

- **One-Tap SOS Emergency Booking** — GPS-detected location, instant driver dispatch
- **Automated Nearest-Driver Matching** — Haversine algorithm, <180ms match time
- **Real-Time GPS Tracking** — Live ambulance location from dispatch to arrival
- **Scheduled Bookings** — Future-date transport with admin assignment
- **Institutional Emergency Portal** — Priority dispatch for registered organisations
- **Highway Accident Reporting** — GPS pin-drop for road corridor incidents
- **Driver Mobile App (Android)** — Flutter app with FCM notifications and Google Maps navigation
- **Admin Dashboard** — Analytics, driver management, audit logs, and reporting
- **Role-Based Access Control** — Patients, drivers, institutional reps, and admins
- **Push Notification System** — Firebase Cloud Messaging for all booking events

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | Next.js 14 (App Router), React, TypeScript |
| Styling | Tailwind CSS, Shadcn UI |
| Backend / API | Next.js API Routes, Node.js Runtime |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth |
| Real-Time | Supabase Realtime |
| Storage | Supabase Storage |
| Driver App | Flutter (Android) |
| Maps | Google Maps API |
| Notifications | Firebase Cloud Messaging (FCM) |
| Hosting | Vercel + GitHub CI/CD |
| Version Control | Git, GitHub |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI
- Flutter SDK (for driver app)
- Google Maps API Key
- Firebase project (for FCM)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/ambulink.git
cd ambulink
```

### 2. Install Web App Dependencies

```bash
cd web
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in `/web`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key
FCM_SERVER_KEY=your_firebase_server_key
```

### 4. Start Local Supabase Stack

```bash
supabase start
supabase db push
supabase db seed
```

### 5. Run the Web Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Run the Driver App

```bash
cd driver-app
flutter pub get
flutter run
```

---

## 🔑 Demo Credentials

> ⚠️ For evaluation and demonstration only. Change all passwords before any production deployment.

| Role | Email | Password |
|---|---|---|
| Admin | admin@ambulance.ug | ambulance@2026 |
| Driver 1 (Urban) | driver1@ambulance.ug | ambulance@2026 |
| Driver 2 (Highway) | driver2@ambulance.ug | ambulance@2026 |
| Patient / User | user@ambulance.ug | ambulance@2026 |
| Institutional Rep | institution@ambulance.ug | ambulance@2026 |

---

## 📁 Project Structure

```
ambulink/
├── web/                        # Next.js 14 web application
│   ├── app/                    # App Router pages and layouts
│   │   ├── (auth)/             # Login, register
│   │   ├── dashboard/          # User dashboard + SOS
│   │   ├── bookings/           # Booking management
│   │   ├── track/              # Real-time tracking map
│   │   ├── institution/        # Institutional portal
│   │   └── admin/              # Admin dashboard
│   ├── components/             # Shared UI components
│   ├── lib/                    # Utilities, Supabase client, algorithms
│   └── api/                    # Next.js API routes
├── driver-app/                 # Flutter Android application
│   ├── lib/
│   │   ├── screens/            # App screens
│   │   ├── services/           # GPS, FCM, API services
│   │   └── models/             # Data models
├── supabase/
│   ├── migrations/             # Database schema migrations
│   ├── seed.sql                # Demo seed data
│   └── functions/              # Edge functions (if applicable)
└── docs/
    ├── screenshots/            # UI screenshots
    └── diagrams/               # Architecture and flow diagrams
```

---

## 🔐 Security

- **Row-Level Security (RLS)** enforced at database layer on all tables
- **Role-Based Access Control (RBAC)** on every API route
- **Supabase Auth** with encrypted session tokens
- **Environment secrets** stored in Vercel encrypted variables — never committed to the repository
- **Audit logs** tracking all booking and admin actions
- **GPS spoofing detection** at API layer

---

## 🧪 Testing Summary

| Test Type | Tests | Passed | Result |
|---|---|---|---|
| Unit Testing | 44 | 44 | ✅ PASS |
| Integration Testing | All modules | All | ✅ PASS |
| Security Testing | 7 scenarios | 7 | ✅ PASS |
| Performance Testing | 6 scenarios | 6 | ✅ PASS |
| UAT (30 participants) | 5 dimensions | Avg 4.5/5 | ✅ PASS |

---

## 📊 Performance Benchmarks

| Scenario | Result | Target |
|---|---|---|
| SOS to driver notification (10 concurrent) | 2.4s | < 5s |
| Dashboard page load | 1.3s | < 3s |
| Real-time driver location refresh | < 1s | < 2s |
| Nearest-driver algorithm (50 drivers) | 180ms | < 500ms |
| Production deployment time | < 40s | — |

---

## 🗺️ Roadmap

- [ ] USSD / SMS fallback booking for areas without mobile data
- [ ] iOS version of driver mobile application
- [ ] AI-powered demand forecasting and driver pre-positioning
- [ ] Vehicle telematics integration (fuel, mechanical status)
- [ ] Insurance and billing module
- [ ] Multi-country support (East Africa expansion)
- [ ] Offline-first progressive web app (PWA) mode

---

## 👨‍💻 Team

| Name | Student ID |
|---|---|
| Tumusiime Mahad | 2023-08-20137 |
| Mugisha Abdul | 2023-08-21509 |
| Kato Ashraf | 2023-08-19539 |

**Academic Supervisor:** Mr. Tumwebaze Wilson
**Institution:** Kampala International University — School of Mathematics and Computing
**Degree:** Bachelor of Information Technology, 2026

---

## 📄 License

This project is submitted in partial fulfilment of the requirements for the Bachelor of Information Technology degree at Kampala International University. All rights reserved © 2026 AmbuLink Team.

---

<p align="center">
  Built in Uganda 🇺🇬 · For Uganda · By Ugandans
</p>
