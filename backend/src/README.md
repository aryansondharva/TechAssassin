# TechAssassin Backend - Professional Structure

## Overview
Professional backend API for the TechAssassin platform with organized folder structure.

## Architecture
- **Framework**: Next.js 14 with App Router
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript

## Structure

### `/src/app/`
- **`api/`** - API routes
  - **`auth/`** - Authentication endpoints (signin, signup, signout, refresh)
  - **`profile/`** - User profile management
  - **`missions/`** - Mission management
  - **`skills/`** - Skills management
  - **`leaderboard/`** - Leaderboard functionality
  - **`notifications/`** - Notification system
  - **`health/`** - Health check endpoint

### `/src/lib/`
- **`auth/`** - Authentication logic
  - **`middleware/`** - Authentication middleware
  - **`validators/`** - Auth validation functions
  - **`guards/`** - Route guards
- **`supabase/`** - Supabase client configurations
  - **`client/`** - Client-side Supabase client
  - **`server/`** - Server-side Supabase client
  - **`admin/`** - Admin operations
  - **`types/`** - Supabase type definitions
- **`database/`** - Database operations
  - **`migrations/`** - Migration scripts
  - **`seeds/`** - Seed data scripts
  - **`queries/`** - Database queries
  - **`types/`** - Database type definitions
- **`utils/`** - Utility functions
  - **`helpers/`** - Helper functions
  - **`formatters/`** - Data formatting
  - **`validators/`** - Validation functions
  - **`constants/`** - Application constants
- **`errors/`** - Error handling
  - **`handlers/`** - Error handlers
  - **`types/`** - Error type definitions
  - **`middleware/`** - Error middleware
- **`storage/`** - File storage
  - **`cleanup/`** - Storage cleanup
  - **`upload/`** - File upload
  - **`types/`** - Storage types

### `/src/components/`
- **`ui/`** - Reusable UI components
  - **`forms/`** - Form components
  - **`buttons/`** - Button components
  - **`modals/`** - Modal components
  - **`cards/`** - Card components
  - **`layouts/`** - Layout components
  - **`navigation/`** - Navigation components
  - **`loading/`** - Loading components
- **`auth/`** - Authentication components
  - **`signin/`** - Sign-in components
  - **`signup/`** - Sign-up components
  - **`profile/`** - Profile components
  - **`guards/`** - Auth guard components
- **`profile/`** - Profile components
  - **`edit/`** - Edit profile components
  - **`view/`** - View profile components
  - **`settings/`** - Settings components
  - **`avatar/`** - Avatar components

### `/src/hooks/`
- **`auth/`** - Authentication hooks
- **`api/`** - API hooks
- **`database/`** - Database hooks
- **`storage/`** - Storage hooks
- **`notifications/`** - Notification hooks

### `/src/types/`
- **`api/`** - API type definitions
- **`database/`** - Database type definitions
- **`auth/`** - Authentication type definitions
- **`profile/`** - Profile type definitions
- **`mission/`** - Mission type definitions

### `/src/tests/`
- **`unit/`** - Unit tests
  - **`auth/`** - Auth unit tests
  - **`api/`** - API unit tests
  - **`database/`** - Database unit tests
  - **`utils/`** - Utility unit tests
- **`integration/`** - Integration tests
  - **`api/`** - API integration tests
  - **`auth/`** - Auth integration tests
  - **`database/`** - Database integration tests
- **`e2e/`** - End-to-end tests
  - **`auth/`** - Auth e2e tests
  - **`profile/`** - Profile e2e tests
  - **`missions/`** - Mission e2e tests
- **`fixtures/`** - Test fixtures
- **`mocks/`** - Test mocks
- **`helpers/`** - Test helpers

### `/src/scripts/`
- **`migrations/`** - Migration scripts
- **`seeds/`** - Seed scripts
- **`cleanup/`** - Cleanup scripts
- **`backup/`** - Backup scripts
- **`deploy/`** - Deployment scripts

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Environment Variables
See `.env.local.example` for required variables.

## API Documentation
See `docs/api/` for detailed API documentation.

## Testing
```bash
npm run test
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Deployment
See `docs/deployment/` for deployment guides.

## Benefits of This Structure

1. **Professional Organization**: Clean, scalable folder structure
2. **Separation of Concerns**: Each folder has a specific purpose
3. **Easy Maintenance**: Related files are grouped together
4. **Scalability**: Structure supports growth
5. **Developer Experience**: Easy to navigate and understand
6. **Testing Support**: Dedicated test folders for each module
7. **Documentation**: Comprehensive documentation structure

## Business Value

This professional structure demonstrates:
- **Enterprise-level organization**
- **Scalable architecture**
- **Maintainable codebase**
- **Professional development practices**
- **Comprehensive testing strategy**
- **Clear documentation**
