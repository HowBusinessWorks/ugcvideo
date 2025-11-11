# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an OpenSaaS project built with the Wasp framework, consisting of three main components:
- `app/` - Main web application built with Wasp (React frontend, Node.js backend)
- `blog/` - Documentation/blog built with Astro and Starlight
- `e2e-tests/` - Playwright end-to-end tests

## Development Commands

### Main App (in `app/` directory)
```bash
# Start development server
wasp start

# Start database (run first, leave running)
wasp start db

# Database migrations (run after entity changes)
wasp db migrate-dev

# Build for production
wasp build

# Install new dependencies
npm install <package-name>
```

### Blog (in `blog/` directory)
```bash
# Development server
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

### E2E Tests (in `e2e-tests/` directory)
```bash
# Run tests locally with UI
npm run local:e2e:start

# CI test execution
npm run ci:e2e:start
```

## Architecture

### Wasp Framework Structure
- **Configuration**: `app/main.wasp` - Declarative app structure (routes, pages, auth, operations)
- **Database Schema**: `app/schema.prisma` - Prisma entities/models
- **Source Code**: `app/src/` - Feature-based organization

### Key Import Patterns
- **Wasp imports in .ts/.tsx**: Use `wasp/...` prefix (not `@wasp/...`)
  - `import { User } from 'wasp/entities'`
  - `import { useQuery } from 'wasp/client/operations'`
- **Wasp config imports**: Use `@src/` prefix in main.wasp
  - `component: import { HomePage } from "@src/client/HomePage.tsx"`
- **Internal imports**: Use relative paths within `src/`

### Feature Organization
- Group related code in `src/{featureName}/` directories
- Combine operations in `operations.ts` files within features
- Group config declarations in main.wasp using `//#region` comments

### Authentication & Payment Integration
- Built-in authentication with email/password support
- Stripe integration for payments
- Lemon Squeezy support for subscriptions

### UI Components
- ShadCN UI v2.3.0 components in `src/components/ui/`
- Tailwind CSS for styling
- When adding ShadCN components: use `npx shadcn@2.3.0 add <component>` and fix utils import path

## Common Patterns

### Actions vs Queries
- Use actions for data mutations, queries for reads
- Call actions directly with async/await (avoid useAction unless optimistic updates needed)
- All operations defined in main.wasp and implemented in server files

### Database Operations
- Define entities in schema.prisma
- Import enum values from `@prisma/client`
- Use Wasp operations for client-server communication

### File Upload
- S3 integration available in `src/file-upload/`
- Presigned URL patterns for secure uploads

### Testing
- Playwright tests in `e2e-tests/`
- Tests include Stripe webhook handling
- Database cleanup handled automatically in CI