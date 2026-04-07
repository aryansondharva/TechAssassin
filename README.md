# Tech Assassin - Community Platform

<div align="center">

<img src="./Client/public/favicon.ico" alt="TechAssassin Logo" width="120" height="120" />

<h3> The elite digital stronghold for Tech Assassins</h3>
<p><em>Dismantling monoliths, mastering frameworks, and claiming the digital throne</em></p>

[Features](#features) | [Quick Start](#quick-start) | [Documentation](#documentation) | [Tech Stack](#tech-stack) | [Contributing](#contributing)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Tech Assassin is a centralized community hub designed for elite developers, hackers, and digital operatives. It serves as a Command Center where high-performance individuals synchronize on tactical missions, track global rankings, and collaborate on complex technical challenges. The platform bridges the gap between web and mobile, providing a unified ecosystem for career growth and technical excellence.

### Key Highlights

- Strategic Hub: Real-time dashboard featuring tactical synchronization and live network status.
- Performance Ranking: Dynamic leaderboard with performance trends, honor badges, and technical assessments.
- Operative Ecosystem: Direct visibility into the architects and field operatives behind major project missions.
- Mission Board: Discovery and deployment into upcoming tactical hackathons and engineering sprints.
- Secure Identity: Robust Supabase Auth integration with JWT security for operative credentialing.
- Tactical Design: A professional, cinematic dark-mode interface optimized for high-focus engineering environments.

---

## Features

### Tactical Intelligence
- Command Center (Dashboard)
  - Real-time network synchronization for active operatives.
  - Tactical metrics tracking (Active members, Completed missions, Bounty pool).
  - Activity feed documenting mission milestones and achievements.
  
- Global Rankings
  - Dynamic performance tracking with trend indicators.
  - Honor badges based on technical assessment scores.
  - Direct profile access for high-ranking platform members.

- Architect Showcase
  - Interactive avatar facepiles for mission contributors.
  - Role-based identification for system architects and leads.
  - Direct GitHub telemetry integration for active developers.

### For Operatives
- Identity Profile
  - Secure credentialing and session management via Supabase.
  - Detailed operative dossiers featuring professional links and skill matrices.
  - Portfolio showcase for platform contributions.

- Mission Discovery
  - Browser for upcoming, live, and archived tactical hackathons.
  - Advanced filtering by mission type and technical requirements.
  - Access to detailed briefings and rules of engagement.

- Mission Deployment
  - Seamless enrollment process for community missions.
  - Real-time status tracking (Confirmed, Waitlist, Finalized).
  - Deployment indicators showing current operative counts per mission.

### For High Command (Admin)
- Operation Management
  - Interface for creating and deploying new community missions.
  - Management tools for operative allocation and mission timelines.
  - Coordination of rewards and prize distribution.

- Intelligence Distribution
  - Global announcement broadcasting system.
  - Provisioning of learning resources and tactical documentation.
  - Logistics management for sponsors and partners.

---

## Tech Stack

### Frontend (Web)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI Library |
| TypeScript | 5.8 | Type Safety |
| Vite | 5.4 | Build Tool |
| React Router | 6.3 | Client-side Routing |
| Tailwind CSS | 3.4 | Styling Framework |
| Shadcn/UI | Latest | UI Component System |
| Tanstack Query | 5.8 | Data Fetching & Sync |
| Framer Motion | 12.3 | Interface Animations |

### Mobile (Android)

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native (Expo) | 52.0 | Mobile Framework |
| Reanimated | 3.x | Optimized Animations |
| Lucide Native | Latest | Vector Iconography |
| Expo Notifications | Latest | Real-time Push Messages |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2 | API Architecture |
| TypeScript | 5.0 | Server-side Type Safety |
| PostgreSQL | 15.0 | Relational Database |
| Supabase | Latest | Authentication & DB Management |
| Zod | 4.3 | Schema Validation |
| Resend | Latest | Email Notification Service |
| Vitest | 4.0 | Testing Framework |

---

## Architecture

```
+------------------------------------------------------------+
|                         Frontend (React)                   |
|  +--------------+  +--------------+  +--------------+      |
|  |   Pages      |  |  Components  |  |   Services   |      |
|  |  - Community |  |  - Navbar    |  |  - API Client|      |
|  |  - Dashboard |  |  - Comms Hub |  |  - Auth      |      |
|  |  - Profile   |  |  - Facepile  |  |  - Community |      |
|  +--------------+  +--------------+  +--------------+      |
+------------------------+-----------------------------------+
                         | HTTP/REST API
+------------------------+-----------------------------------+
|                    Backend (Next.js API)                   |
|  +--------------+  +--------------+  +--------------+      |
|  |  API Routes  |  |  Middleware  |  |  Validation  |      |
|  |  - Auth      |  |  - CORS      |  |  - Zod       |      |
|  |  - Events    |  |  - Auth      |  |  - Schemas   |      |
|  |  - Profile   |  |  - Error     |  |              |      |
|  +--------------+  +--------------+  +--------------+      |
+------------------------+-----------------------------------+
                         |
        +----------------+----------------+
        |                |                |
+-------+--------+ +-----+-----+ +--------+-------+
|   PostgreSQL   | | Supabase  | |  Resend Email  |
|   Database     | |   Auth    | |    Service     |
+----------------+ +-----------+ +----------------+
```

### Database Schema

- auth.users (Supabase Identity Management)
- public.profiles (User Dossiers)
- public.events (Mission Tracking)
- public.registrations (Mission Enrollment)
- public.leaderboard (Performance Metrics)
- public.announcements (Platform Broadcasts)
- public.resources (Intel & Materials)

---

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL 15.x or higher
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/techassassin/community.git
cd community
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install web client dependencies:
```bash
cd ../Client
npm install
```

4. Install mobile dependencies:
```bash
cd ../Mobile
npm install
```

---

## Configuration

### Backend Environment

Create a `backend/.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://user:password@localhost:5432/techassassin
JWT_SECRET=your_secure_jwt_secret
RESEND_API_KEY=your_resend_api_key
PORT=3001
```

### Web Client Environment

Create a `Client/.env.local` file:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Database Setup

1. Create a PostgreSQL database named `techassassin`.
2. Execute the schema initialization script:
```bash
psql -U postgres -d techassassin -f SQL/COMPLETE_DATABASE_SETUP.sql
```
3. Run migrations via Supabase if applicable to your environment.

---

## Development

Run both the backend and frontend simultaneously for a full-stack experience:

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Web Client):
```bash
cd Client
npm run dev
```

Terminal 3 (Mobile):
```bash
cd Mobile
npx expo start
```

---

## Testing

The platform utilizes Vitest for both backend and frontend unit testing.

```bash
# Backend tests
cd backend
npm test

# Client tests
cd Client
npm test
```

---

## Deployment

The platform is designed for seamless deployment on Vercel (Web & API) and Expo Application Services (Mobile).

1. Connect your repository to Vercel.
2. Configure the root directory for both `backend` (as a standalone API) and `Client`.
3. Set the required environment variables in the Vercel dashboard.
4. For mobile, use `eas build -p android` to generate the production APK.

---

## Contributing

We strictly follow a structured contribution model:

1. Fork the repository.
2. Create a specific feature branch.
3. Ensure all code passes linting and tests.
4. Submit a Pull Request with a detailed briefing of changes.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

Copyright (c) 2026 TechAssassin Team.
