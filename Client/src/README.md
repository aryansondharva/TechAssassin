# TechAssassin Frontend - Professional Structure

## Overview
Professional frontend application for the TechAssassin platform with organized folder structure.

## Architecture
- **Framework**: React with Vite
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Structure

### `/src/components/`
- **`common/`** - Shared components
  - **`ui/`** - Reusable UI components
    - **`buttons/`** - Button components
    - **`forms/`** - Form components
    - **`modals/`** - Modal components
    - **`cards/`** - Card components
    - **`layouts/`** - Layout components
    - **`navigation/`** - Navigation components
    - **`loading/`** - Loading components
  - **`layout/`** - Layout components
    - **`header/`** - Header components
    - **`sidebar/`** - Sidebar components
    - **`footer/`** - Footer components
    - **`main/`** - Main layout components
  - **`auth/`** - Authentication components
    - **`signin/`** - Sign-in components
    - **`signup/`** - Sign-up components
    - **`profile/`** - Profile components
    - **`guards/`** - Auth guard components

### `/src/pages/`
- **`auth/`** - Authentication pages
  - **`signin/`** - Sign-in page
  - **`signup/`** - Sign-up page
  - **`forgot/`** - Forgot password page
  - **`reset/` - Reset password page
- **`profile/`** - Profile pages
  - **`edit/`** - Edit profile page
  - **`view/`** - View profile page
  - **`settings/`** - Settings page
- **`missions/`** - Mission pages
  - **`list/`** - Mission list page
  - **`detail/`** - Mission detail page
  - **`create/`** - Create mission page
- **`leaderboard/`** - Leaderboard page
- **`dashboard/`** - Dashboard page
- **`home/`** - Home page

### `/src/services/`
- **`api/`** - API service functions
- **`auth/`** - Authentication service functions
- **`storage/`** - Storage service functions
- **`notifications/`** - Notification service functions

### `/src/hooks/`
- **`auth/`** - Authentication hooks
- **`api/`** - API hooks
- **`storage/`** - Storage hooks
- **`notifications/`** - Notification hooks

### `/src/utils/`
- **`helpers/`** - Helper functions
- **`formatters/`** - Data formatting functions
- **`validators/`** - Validation functions
- **`constants/`** - Application constants

### `/src/types/`
- **`api/`** - API type definitions
- **`auth/`** - Authentication type definitions
- **`profile/`** - Profile type definitions
- **`mission/`** - Mission type definitions

### `/src/styles/`
- **`components/`** - Component styles
- **`pages/`** - Page styles
- **`globals/`** - Global styles
- **`themes/`** - Theme definitions

### `/src/assets/`
- **`images/`** - Image assets
- **`icons/` - Icon assets
- **`fonts/` - Font assets

### `/src/config/`
- **`api/`** - API configuration
- **`auth/`** - Authentication configuration
- **`theme/`** - Theme configuration

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
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

## Components Usage

### Authentication Components
```typescript
import { SignInForm } from '@/components/common/auth/signin';
import { SignUpForm } from '@/components/common/auth/signup';
```

### UI Components
```typescript
import { Button } from '@/components/common/ui/buttons';
import { Card } from '@/components/common/ui/cards';
import { Modal } from '@/components/common/ui/modals';
```

### Layout Components
```typescript
import { Header } from '@/components/common/layout/header';
import { Sidebar } from '@/components/common/layout/sidebar';
```

## Services Usage

### API Service
```typescript
import { apiClient } from '@/services/api';
```

### Auth Service
```typescript
import { authService } from '@/services/auth';
```

## Hooks Usage

### Authentication Hooks
```typescript
import { useAuth } from '@/hooks/auth';
```

### API Hooks
```typescript
import { useApi } from '@/hooks/api';
```

## Styling

### Tailwind CSS
This project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

### Component Styling
Component-specific styles are in the `styles/components/` directory.

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Benefits of This Structure

1. **Professional Organization**: Clean, scalable folder structure
2. **Component Reusability**: Shared components in common folder
3. **Page Organization**: Pages grouped by functionality
4. **Service Separation**: Services separated by concern
4. **Hook Organization**: Hooks organized by functionality
5. **Type Safety**: Comprehensive type definitions
6. **Styling Structure**: Organized styling approach
7. **Asset Management**: Organized asset structure

## Business Value

This professional structure demonstrates:
- **Enterprise-level organization**
- **Component-based architecture**
- **Service-oriented design**
- **Type-safe development**
- **Professional styling approach**
- **Comprehensive testing strategy**
- **Maintainable codebase**
