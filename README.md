# Tech Assassin - Community Platform

<div align="center">

<img src="./Client/public/favicon.ico" alt="TechAssassin Logo" width="80" height="80" />

<h3> The elite digital stronghold for Tech Assassins</h3>
<p><em>Dismantling monoliths, mastering frameworks, and claiming the digital throne</em></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Tech Stack](#tech-stack) • [Contributing](#contributing)

</div>

---

## Welcome to the Command Center

Tech Assassin is a high-performance community infrastructure designed for elite developers, security researchers, and systems architects. It serves as a unified ecosystem where field operatives synchronize on mission-critical sprints, track professional progression via an advanced gamification engine, and collaborate on dismantling technical monoliths.

The platform provides a seamless experience across web and mobile, ensuring operatives stay connected to the network through real-time notifications, presence tracking, and tactical dashboards.

---

## System Overview

### Core Architecture
The platform is built on a distributed architecture leveraging high-concurrency technologies:
- Frontend (Web): A high-fidelity interface built with React 18.3 and Vite 5.4, utilizing Framer Motion 12.3 for cinematic animations.
- Mobile (Android): A native-performing application built with Expo 52, featuring hardware-accelerated animations via Reanimated 3.
- Backend (API): A robust Next.js 14.2 server architecture providing a unified RESTful interface with integrated Zod validation.
- Data Layer: PostgreSQL 15 with Supabase-managed authentication and real-time database synchronization.

### Technical Depth
- Materialized Views: Utilizing PostgreSQL materialized views for high-performance ranking calculations and trend analysis.
- Real-time Synchronization: Advanced presence tracking and activity monitoring via dedicated SQL-level activity streams.
- Security Infrastructure: Integrated Row-Level Security (RLS) and JWT-based session management for mission-critical data protection.

---

## Features

### Tacticial Hub & Command Center
- Unified Dashboard: Real-time network status, mission milestones, and operative telemetry.
- Mission Board: Discovery and deployment into upcoming tactical hackathons and sprints.
- Real-time Comms: Encrypted intelligence feeds and tactical broadcasts.

### Advanced Gamification Engine
- Experience (XP) Tracking: Dynamic XP allocation based on mission complexity and contribution quality.
- Rank Progression: Hierarchical progression system from Junior Operative to Lead Architect.
- Streaks & Consistency: Continuous deployment rewards and activity streaks to maintain operative focus.
- Honor Badges: Cryptographically verifiable badges for mastery in specific technical domains.

### Global Intelligence & Rankings
- Unified Leaderboard: High-performance ranking system with up/down trend indicators.
- Operative Dossiers: Comprehensive profiles showcasing skill matrices, GitHub telemetry, and mission history.
- Architect Facepiles: Interactive visualization of mission lead contributors and field architects.

---

## Tech Stack

### Frontend (Web)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | Core UI library |
| TypeScript | 5.8 | Type-safe development |
| Vite | 5.4 | High-performance build tool |
| Framer Motion | 12.3 | Cinematic 60fps animations |
| Tailwind CSS | 3.4 | Utility-first styling |
| TanStack Query | 5.8 | Server-state management |
| Shadcn/UI | Latest | Standardized UI component system |

### Mobile (Android)
| Technology | Version | Purpose |
|------------|---------|---------|
| Expo | 52.0 | Mobile development framework |
| Reanimated | 3.x | Fluid, hardware-accelerated animations |
| Lucide Native | Latest | Technical iconography |
| Expo Push | Latest | Real-time mission notifications |

### Backend & Data
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2 | Server-side execution and API routing |
| Supabase | Latest | Real-time database and identity management |
| PostgreSQL | 15.0 | Relational data persistence |
| Zod | 4.3 | Runtime schema validation |
| Resend | Latest | Automated intelligence dispatch (Email) |

---

## API Reference

### Intelligence & Data
- GET /api/leaderboard - Retrieve top-ranking operatives with performance trends.
- GET /api/profile/[id] - Access detailed operative dossier and skill matrix.
- GET /api/events - List active and upcoming tactical missions.

### Gamification & Progression
- GET /api/gamification/xp - Current experience points and leveling status.
- GET /api/gamification/badges - Earned honors and professional credentials.
- GET /api/gamification/streaks - Monitoring continuous operative activity.

### Authentication & Secure Operations
- POST /api/auth/signin - Credential verification and session initialization.
- POST /api/auth/signup - New operative registration and dossier creation.
- GET /api/health - Real-time system status and network connectivity.

---

## Quick Start

### Prerequisites
- Node.js 18.x or 20.x (LTS recommended)
- PostgreSQL 15+ (Local or Managed)
- Git

### Installation
1. Clone the operative repository:
```bash
git clone https://github.com/aryansondharva/TechAssassin.git
cd TechAssassin
```

2. Initialize backend infrastructure:
```bash
cd backend
npm install
```

3. Initialize client interface:
```bash
cd ../Client
npm install
```

### Configuration
1. Setup environment variables in `backend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_api_link
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
DATABASE_URL=postgresql://user:pass@host:5432/techassassin
JWT_SECRET=minimum_32_character_security_key
```

### Database Deployment
Initialize the database layer by executing the following scripts in order:
1. SQL/20260326000001_create_realtime_presence_activity.sql
2. SQL/create_leaderboard_materialized_view.sql
3. SQL/optimize_badge_criteria_indexes.sql

---

## Development & Testing

Run the environment using dedicated terminals:

Backend Terminal:
```bash
cd backend
npm run dev
```

Web Terminal:
```bash
cd Client
npm run dev
```

Mobile Terminal:
```bash
cd Mobile
npx expo start
```

Testing Suite (Vitest):
```bash
cd backend
npm test
```

---

## Deployment Strategy
Web and API components are optimized for deployment on Vercel. Database migrations should be applied to production using the SQL scripts located in the /SQL directory. Mobile builds are managed via Expo Application Services (EAS).

---

## License
Licensed under the MIT License. Copyright (c) 2026 TechAssassin.
