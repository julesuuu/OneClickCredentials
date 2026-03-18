# OneClickCredentials - Project Context

## Project Overview

**OneClickCredentials** is a Next.js 16 web application that provides a fast and secure way for users to request academic credentials online. The platform supports online payments and cash-on-pickup options.

### Core Technologies

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4 with shadcn/ui components (Radix Nova style)
- **Authentication:** better-auth with MongoDB adapter
- **Database:** MongoDB (via better-auth adapter)
- **Email:** Resend for transactional emails (2FA, notifications)
- **Icons:** Lucide React
- **Theming:** next-themes for dark/light mode support

### Architecture

The application follows Next.js App Router conventions with the following structure:

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (application)/      # Authenticated app sections (dashboard, documents, requests, etc.)
│   ├── (legal)/            # Legal pages
│   ├── account/            # Account management
│   ├── api/                # API routes (auth endpoints)
│   ├── auth/               # Authentication pages
│   └── pages/              # Additional pages
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── providers/          # Context providers
│   └── app-sidebar.tsx     # Main navigation sidebar
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
│   ├── auth.ts             # better-auth configuration
│   ├── auth-client.ts      # Auth client setup
│   ├── mongodb.ts          # MongoDB connection utilities
│   └── utils.ts            # General utilities (cn helper)
└── next-app/               # Next.js specific configurations
```

### Key Features

- **Authentication:** Email/password and social login (Google, GitHub) via better-auth
- **Two-Factor Authentication (2FA):** Email-based OTP via Resend
- **Dashboard:** User dashboard for managing requests
- **Document Requests:** System for requesting academic documents
- **Appointments:** Scheduling functionality
- **Settings:** User settings management
- **Responsive UI:** Built with shadcn/ui components and Tailwind CSS

## Building and Running

### Prerequisites

- Node.js 20+ (as per `@types/node: ^20`)
- MongoDB instance
- Environment variables configured (see `.env*` in `.gitignore`)

### Environment Variables Required

The following environment variables are required (based on `src/lib/auth.ts` and `src/lib/mongodb.ts`):

```
MONGODB_URI=<mongodb_connection_string>
BETTER_AUTH_URL=<auth_base_url>
BETTER_AUTH_SECRET=<auth_secret>
RESEND_API_KEY=<resend_api_key>
GOOGLE_CLIENT_ID=<google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<google_oauth_client_secret>
GITHUB_CLIENT_ID=<github_oauth_client_id>
GITHUB_CLIENT_SECRET=<github_oauth_client_secret>
```

### Development

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Development Conventions

### Code Style

- **Strict TypeScript:** `strict: true` in `tsconfig.json`
- **Module System:** ESNext with bundler module resolution
- **Path Aliases:** `@/*` maps to `./src/*`
- **ESLint:** Configured with `eslint-config-next` including TypeScript rules

### Component Patterns

- **shadcn/ui:** Uses Radix Nova style with Lucide icons
- **Class Merging:** Use `cn()` utility from `@/lib/utils` for combining Tailwind classes
- **Server Components:** App Router with React Server Components enabled (`"rsc": true`)

### Authentication Flow

- Sessions managed by better-auth with MongoDB persistence
- Middleware in `proxy.ts` handles route protection (e.g., `/dashboard`)
- 2FA implemented via email OTP using Resend
- Auth endpoints exposed at `/api/auth/[...all]`

### Database

- MongoDB connection is cached globally in development for HMR compatibility
- Database access via `getDatabase()` or `getDb()` from `@/lib/mongodb`
- better-auth MongoDB adapter handles user/session storage

### Testing

No test framework is currently configured in the project. Consider adding:

- Jest or Vitest for unit tests
- Playwright or Cypress for E2E tests

### Git

- Standard Next.js `.gitignore` applied
- Ignores: `.next/`, `node_modules/`, `.env*`, `build/`, `out/`

## Key Files Reference

| File                               | Purpose                                |
| ---------------------------------- | -------------------------------------- |
| `src/lib/auth.ts`                  | better-auth configuration with plugins |
| `src/lib/mongodb.ts`               | MongoDB connection management          |
| `src/app/layout.tsx`               | Root layout with theme provider        |
| `src/app/(application)/layout.tsx` | Authenticated app layout with sidebar  |
| `proxy.ts`                         | Middleware for route protection        |
| `components.json`                  | shadcn/ui configuration                |
| `next.config.ts`                   | Next.js configuration (Turbopack)      |
