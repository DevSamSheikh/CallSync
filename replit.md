# CallSync - Call Center Agent CRM & Analytics Dashboard

## Overview

CallSync is a call center CRM and analytics dashboard built for tracking agent performance through visual analytics and detailed reports. The application supports three user roles (Admin, DEO, Agent) with role-based access control, allowing agents to view their performance metrics while administrators and data entry operators can manage users and enter/upload call records.

The tech stack consists of a React frontend with Tailwind CSS and shadcn/ui components, an Express.js backend, PostgreSQL database with Drizzle ORM, and Passport.js for session-based authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected route wrappers
- **State Management**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Charts**: Recharts for data visualization (bar, line, pie charts)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **File Parsing**: PapaParse for CSV upload processing

### Backend Architecture
- **Runtime**: Node.js with Express.js 5
- **API Structure**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for type-safe request/response validation
- **Authentication**: Passport.js with LocalStrategy and express-session using PostgreSQL session store (connect-pg-simple)
- **Database Access**: Drizzle ORM with PostgreSQL

### Data Storage
- **Database**: PostgreSQL accessed via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines tables (users, reports) with Drizzle's pgTable
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Authentication & Authorization
- **Method**: Session-based authentication with Passport LocalStrategy
- **Session**: 30-day cookie expiration, stored in PostgreSQL
- **Roles**: Three-tier RBAC (admin, deo, agent)
  - Admin: Full access to all features
  - DEO (Data Entry Operator): Can add records, upload CSV, create agent IDs
  - Agent: View-only access to their own performance data

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── hooks/        # Custom React hooks (auth, reports, analytics)
│       ├── pages/        # Route page components
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── auth.ts       # Passport configuration
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   └── storage.ts    # Database access layer
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle table definitions
│   └── routes.ts     # API route definitions with Zod schemas
└── migrations/       # Drizzle migration files
```

### Build System
- **Development**: tsx for TypeScript execution, Vite dev server with HMR
- **Production**: Custom build script using esbuild for server, Vite for client
- **Output**: Server bundles to `dist/index.cjs`, client to `dist/public`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication Services
- **Passport.js**: Authentication middleware with LocalStrategy
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### UI Component Libraries
- **shadcn/ui**: Pre-built accessible components based on Radix UI primitives
- **Radix UI**: Low-level UI primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library

### Data Processing
- **PapaParse**: CSV parsing for bulk data upload
- **date-fns**: Date formatting and manipulation
- **Recharts**: Chart library for analytics visualization

### Validation
- **Zod**: Schema validation for API requests/responses
- **drizzle-zod**: Generate Zod schemas from Drizzle table definitions