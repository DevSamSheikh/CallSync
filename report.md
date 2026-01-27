# CallSync - Call Center CRM & Analytics Dashboard

## Overview
CallSync is a high-performance CRM and analytics dashboard designed for call centers to track agent productivity, manage finances, and visualize performance metrics in real-time.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Recharts, Wouter
- **Backend**: Express 5, Passport.js (Auth), tsx
- **Database**: PostgreSQL with Drizzle ORM
- **Processing**: PapaParse (CSV), date-fns

## Completed Features
### 1. Multi-Role Authentication & RBAC
- **Admin**: Full system control, user management, and global finance oversight.
- **DEO (Data Entry Operator)**: Data entry, CSV uploads, and agent management.
- **Agent**: Personal performance tracking and financial dashboard.
- **Security**: Session-based auth with Passport.js and protected frontend routes.

### 2. Live Financial Dashboard (Agent)
- **Real-time Attendance**: HH:MM:SS live timer that persists across refreshes.
- **Automated Fine System**: Automatic 500 PKR deduction for shifts under 9 hours (with 5-minute grace period).
- **Salary Tracking**: Monthly salary countdown and bonus/docking history.
- **Visual Stats**: Quick-glance cards for total earned, bonuses, and active session status.

### 3. Manage Finance (Admin)
- **Global Overview**: Aggregate stats for team-wide bonuses, docks, and worked hours.
- **Agent Drilldown**: Search and filter capabilities to monitor specific agent performance.
- **Data Integrity**: Unified dashboard design consistent with agent views.

### 4. Dynamic Agent Profiles (Admin Only)
- **Centralized Hub**: Access via Reports or Users preview actions.
- **Three-Tier View**:
  - **Overview**: Bar charts for call trends and pie charts for sales/transfer distribution.
  - **Financials**: Detailed attendance history, hours worked, and penalty remarks.
  - **Call Logs**: Comprehensive, searchable history of all agent activities.

### 5. Data Management
- **Reports**: Detailed logging with filtering by date, state, and location.
- **Bulk Upload**: CSV processing for high-volume record entry via PapaParse.
- **User Management**: Admin/DEO capability to create, edit, and delete accounts.

## Under Progress / Upcoming
- **Interactive Graphs**: Enhancing Recharts with more granular time-range filters (Weekly/Monthly/Yearly).
- **IP Tracking**: Logging and displaying agent login IPs for security auditing.
- **Real-time Notifications**: Toast alerts for successful sign-ins/outs and auto-fine triggers.

## Backend-First Future Enhancements
- **Advanced Exporting**: PDF generation for monthly agent performance certificates.
- **Automated Payroll**: Integration with payment gateways for direct salary processing.
- **Closer Performance Tracking**: Linking Fronter sales directly to Closer commission structures.

## Scalability & Productivity
- **Architecture**: Modular project structure separating shared schemas, backend storage, and frontend components.
- **Performance**: Optimized SQL queries via Drizzle ORM and TanStack Query for efficient data caching.
- **Productivity**: Built-in 3D UI effects and consistent shadcn patterns ensure a fast, intuitive user experience for non-technical users.
- **Scalability**: Horizontal scalability ready via stateless Express routes (session store in Postgres).
