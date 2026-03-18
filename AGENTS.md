# Agent Development Guidelines for OneClickCredentials

## Project Overview
OneClickCredentials is a Next.js 16 application built with TypeScript, Tailwind CSS, and shadcn/ui components. The app enables users to request school credentials online with payment integration and real-time tracking. The application uses Better Auth for authentication and MongoDB as the database.

## Build/Lint/Test Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Test Commands
This project currently does not have explicit unit or integration tests configured. The application relies on manual testing and Next.js's built-in development checks. For future test implementation:
```bash
# Potential setup for running tests
npm install -D jest @testing-library/react @testing-library/jest-dom jsdom
# Run tests once available
npm test
# Run a single test file once available
npm test path/to/test-file.test.tsx
```

## Code Style Guidelines

### Imports
- Use absolute imports with `@/*` alias for paths: `import { Component } from "@/components/ui/component"`
- Group imports in this order: external libraries, next/react imports, internal imports (`@/`)
- Use destructuring for named imports: `import { Button, Card } from "@/components/ui"`
- Import types separately when needed: `import type { Metadata } from "next"`

### Formatting
- Follow Prettier defaults (inferred from project setup)
- Use 2 space indentation
- Use double quotes for JSX attributes, single quotes for JS strings
- Max line length of 80-100 characters
- Use semicolons consistently
- Prefer arrow functions for component definitions
- Use trailing commas in object/array literals

### TypeScript Usage
- Use strict mode (enabled in tsconfig.json)
- Prefer interfaces over types for object shapes
- Use `React.ReactNode` for children props
- Use `React.FC` or explicit function signatures for component definitions
- Leverage utility types where appropriate
- Use discriminated unions for complex conditional types
- Leverage TypeScript's strict null checks

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile`, `DocumentRequestForm`)
- Functions: camelCase (e.g., `handleRequestSubmit`, `validateForm`)
- Variables: camelCase (e.g., `documentType`, `requestStatus`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`)
- Files: kebab-case (e.g., `user-profile.tsx`, `form-validation.ts`)
- Directories: kebab-case or camelCase (e.g., `api-helpers`, `utils`)

### Error Handling
- Handle async operations with try/catch blocks
- Use Next.js error boundaries for component-level errors
- Display user-friendly error messages with toast notifications (using sonner)
- Log errors appropriately for debugging
- Validate inputs at API boundaries
- Use proper TypeScript error types

### Component Patterns
- Leverage shadcn/ui components for consistent UI
- Use compound component patterns for complex UI elements (Accordion, Table)
- Implement proper accessibility attributes (aria-* labels, semantic HTML)
- Use `cn()` utility for dynamic class merging
- Separate concerns with custom hooks
- Follow Next.js App Router patterns for layouts and routing

### Styling
- Use Tailwind CSS utility classes
- Leverage `cn()` helper for conditional class names
- Use CSS variables defined in the theme
- Maintain consistent spacing with Tailwind scale
- Follow mobile-first responsive design principles
- Use dark mode variants where appropriate

### Security
- Sanitize user inputs before processing
- Use Next.js built-in protections against XSS
- Validate file uploads properly
- Protect sensitive API routes with authentication
- Store secrets in environment variables only

### Performance
- Leverage Next.js Image optimization
- Use lazy loading for non-critical components
- Optimize bundle size with code splitting
- Use React.memo for components that render frequently
- Optimize database queries and cache where appropriate

### Environment Configuration
- Use `.env.local` for local environment variables
- Use `.env.production` for production environment variables
- Define all environment variables in `.env.example` as reference
- Never commit actual environment values to the repository

## Authentication & Database
- Authentication: Better Auth (`@daveyplate/better-auth-ui`, `better-auth`)
- Database: MongoDB (`@better-auth/mongo-adapter`)
- Authentication client: `authClient` from `@/lib/auth-client`

## File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (application)/     # Main application routes
│   ├── (legal)/          # Legal pages
│   ├── account/          # Account-related pages
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   └── ...
├── components/           # Reusable React components
│   ├── ui/              # Shadcn/ui components
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and client-side helpers
└── next-app/             # Additional Next.js configuration files
```

## Git Workflow
- Use feature branches for development
- Follow conventional commits for meaningful commit messages
- Ensure all changes pass linting before committing
- Keep commits focused on a single responsibility
- Create pull requests for code review before merging to main