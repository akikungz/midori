# Midori — FITM Cloud Frontend

> **Version:** 0.1.0  
> **Application:** FITM Cloud Platform  
> **Framework:** Next.js 16.1.6 (React 19)  
> **Language:** TypeScript 5.9.3

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Features & Modules](#5-features--modules)
6. [Role-Based Access Control](#6-role-based-access-control)
7. [API Integration](#7-api-integration)
8. [Authentication](#8-authentication)
9. [Observability Stack](#9-observability-stack)
10. [Environment Variables](#10-environment-variables)
11. [Development Setup](#11-development-setup)
12. [Build & Deployment](#12-build--deployment)
13. [Code Quality](#13-code-quality)
14. [Dependency Versions](#14-dependency-versions)

---

## 1. Project Overview

**Midori** is the web frontend for **FITM Cloud**, a cluster-based virtual machine (VM) platform supporting teaching and research activities at King Mongkut's University of Technology North Bangkok (KMUTNB), Faculty of Information Technology and Management (FITM), Department of Information Technology.

The platform allows students, instructors, and administrators to:
- Request and manage Linux virtual machines for academic courses.
- Monitor instance lifecycle (provisioning → active → promoted / expired).
- Manage SSH keys, reverse proxies, and file storage.
- Administer courses, semesters, and instructors (admin role only).

The application is a Next.js App Router frontend that communicates with two backend services:
- **momoi** — main API server (instances, requests, academic data).
- **arisu** — authentication server (session management via `better-auth`).

---

## 2. Architecture

```
Browser
  └── Midori (Next.js 16, port 3000)
        ├── /api/auth/*  ──proxy──► arisu (better-auth, port 3001)
        └── /api/*       ──proxy──► momoi (REST API, port 3000)
```

- In **development**, Next.js rewrites proxy `/api/auth/*` to `AUTH_API_URL` and `/api/*` (except `/api/metrics`) to `SERVER_API_URL`.
- In **production**, routing is handled externally (e.g., reverse proxy / ingress). No rewrites are active.
- `/api/metrics` is handled internally by Midori itself and exposes Prometheus metrics.

### Server vs. Client Rendering

| Layer           | Pattern                                                                             |
| --------------- | ----------------------------------------------------------------------------------- |
| Page components | React Server Components (RSC) — fetch data server-side, redirect if unauthenticated |
| Dashboard UI    | Client Components — interactive, use TanStack Query hooks                           |
| Auth check      | `getServerSession()` in RSC → redirect to `/login` if null                          |

---

## 3. Technology Stack

### Core

| Package      | Version | Purpose                                            |
| ------------ | ------- | -------------------------------------------------- |
| `next`       | ^16.1.6 | App framework (App Router, RSC, standalone output) |
| `react`      | ^19.2.4 | UI rendering                                       |
| `react-dom`  | ^19.2.4 | DOM rendering                                      |
| `typescript` | ^5.9.3  | Static typing                                      |

### UI & Styling

| Package                    | Version  | Purpose                           |
| -------------------------- | -------- | --------------------------------- |
| `tailwindcss`              | ^4.2.1   | Utility-first CSS                 |
| `@tailwindcss/postcss`     | ^4.2.1   | PostCSS integration               |
| `tw-animate-css`           | ^1.4.0   | CSS animations                    |
| `radix-ui`                 | ^1.4.3   | Accessible headless UI primitives |
| `lucide-react`             | ^0.559.0 | Icon library                      |
| `class-variance-authority` | ^0.7.1   | Component variant utility         |
| `clsx`                     | ^2.1.1   | Conditional class names           |
| `tailwind-merge`           | ^3.5.0   | Tailwind class deduplication      |
| `next-themes`              | ^0.4.6   | Dark/light theme switching        |
| `react-day-picker`         | ^9.14.0  | Date picker component             |
| `sonner`                   | ^2.0.7   | Toast notifications               |

### Data Fetching & State

| Package                 | Version  | Purpose                                              |
| ----------------------- | -------- | ---------------------------------------------------- |
| `@tanstack/react-query` | ^5.90.21 | Server-state caching and synchronization             |
| `openapi-fetch`         | ^0.15.2  | Type-safe fetch client generated from OpenAPI schema |
| `openapi-react-query`   | ^0.5.4   | React Query bindings for openapi-fetch               |

### Authentication

| Package       | Version | Purpose                                                   |
| ------------- | ------- | --------------------------------------------------------- |
| `better-auth` | ^1.5.3  | Session-based auth client (Google OAuth + email/password) |

### Validation

| Package | Version | Purpose                                     |
| ------- | ------- | ------------------------------------------- |
| `zod`   | ^4.3.6  | Runtime schema validation (env vars, forms) |

### Date Utilities

| Package    | Version | Purpose                          |
| ---------- | ------- | -------------------------------- |
| `date-fns` | ^4.1.0  | Date formatting and manipulation |

### Observability

| Package                                   | Version  | Purpose                      |
| ----------------------------------------- | -------- | ---------------------------- |
| `@opentelemetry/api`                      | ^1.9.0   | OTel API (spans, context)    |
| `@opentelemetry/sdk-node`                 | ^0.208.0 | Node.js OTel SDK             |
| `@opentelemetry/sdk-trace-node`           | ^2.6.0   | Trace SDK for Node.js        |
| `@opentelemetry/exporter-trace-otlp-http` | ^0.208.0 | OTLP HTTP trace exporter     |
| `@opentelemetry/resources`                | ^2.6.0   | OTel resource attributes     |
| `@opentelemetry/semantic-conventions`     | ^1.40.0  | Standardized attribute names |
| `pino`                                    | ^10.3.1  | Structured JSON logger       |
| `pino-loki`                               | ^3.0.0   | Loki log transport for Pino  |
| `prom-client`                             | ^15.1.3  | Prometheus metrics client    |

### Dev Dependencies

| Package                       | Version   | Purpose                                         |
| ----------------------------- | --------- | ----------------------------------------------- |
| `@biomejs/biome`              | 2.2.0     | Linter + formatter (replaces ESLint + Prettier) |
| `openapi-typescript`          | ^7.13.0   | Generate TypeScript types from OpenAPI spec     |
| `babel-plugin-react-compiler` | ^1.0.0    | React Compiler Babel plugin                     |
| `@types/node`                 | ^20.19.35 | Node.js type definitions                        |
| `@types/react`                | ^19.2.14  | React type definitions                          |
| `@types/react-dom`            | ^19.2.3   | React DOM type definitions                      |

---

## 4. Project Structure

```
midori/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (fonts, providers)
│   │   ├── page.tsx                # Landing / marketing page
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Sidebar + header shell
│   │   │   ├── page.tsx            # Dashboard overview (RSC)
│   │   │   ├── error.tsx           # Error boundary
│   │   │   ├── not-found.tsx       # 404 page
│   │   │   ├── instances/          # VM instance management
│   │   │   ├── requests/           # VM request workflow
│   │   │   ├── storage/            # File storage browser
│   │   │   ├── settings/           # User settings
│   │   │   └── admin/              # Admin-only pages
│   │   │       ├── courses/
│   │   │       ├── semesters/
│   │   │       ├── instructors/
│   │   │       ├── mailing-list/
│   │   │       └── instances/      # All instances view
│   │   ├── api/
│   │   │   └── metrics/            # Prometheus metrics endpoint
│   │   └── _internal/
│   │       └── storage/            # Internal storage proxy routes
│   │
│   ├── components/
│   │   ├── ui/                     # Shared base UI components (shadcn-style)
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx     # Sidebar navigation
│   │   │   └── header.tsx          # Dashboard top bar
│   │   ├── dashboard/
│   │   │   └── DashboardCards.tsx  # Overview stat cards
│   │   ├── instances/              # Instance-related components
│   │   ├── requests/               # Request workflow components
│   │   ├── admin/                  # Admin management components
│   │   ├── storage/                # Storage browser components
│   │   ├── shared/                 # Reusable utility components
│   │   ├── icons/                  # Custom SVG icons
│   │   ├── QueryProvider.tsx       # TanStack Query context
│   │   ├── ThemeProvider.tsx       # next-themes context
│   │   └── RoleGuard.tsx           # Conditional render by role
│   │
│   ├── hooks/
│   │   ├── useSession.ts           # Current user + role
│   │   ├── useRole.ts              # Role permission checks
│   │   ├── useCommon.ts            # Shared query helpers
│   │   ├── useStorage.ts           # Storage API hooks
│   │   ├── useAutocomplete.ts      # Autocomplete input hook
│   │   └── use-mobile.ts           # Responsive breakpoint hook
│   │
│   ├── lib/
│   │   ├── api.ts                  # openapi-fetch + openapi-react-query client
│   │   ├── auth-client.ts          # better-auth React client
│   │   ├── server-api.ts           # Server-side API client (RSC)
│   │   ├── env.ts                  # Zod-validated env vars
│   │   ├── roles.ts                # RBAC permissions map
│   │   ├── metrics.ts              # Prometheus metrics registry
│   │   ├── logger.ts               # Pino logger with OTel + Loki
│   │   ├── format.ts               # Date/number formatting utilities
│   │   └── utils.ts                # cn() and general utilities
│   │
│   ├── types/
│   │   ├── api.d.ts                # Auto-generated OpenAPI types (do not edit)
│   │   └── admin.ts                # Admin-specific type helpers
│   │
│   ├── styles/
│   │   └── globals.css             # Global CSS + Tailwind base
│   │
│   └── instrumentation.ts          # Next.js instrumentation hook (OTel init)
│
├── docs/
│   └── observability/              # Grafana/OTel setup guides
├── grafana/
│   ├── dashboards/                 # Grafana dashboard JSON files
│   └── provisioning/               # Auto-provisioning configs
├── prometheus/                     # Prometheus configuration
├── loki/                           # Loki configuration
├── Dockerfile                      # Multi-stage production image
├── next.config.ts                  # Next.js configuration
├── biome.json                      # Biome lint/format config
├── components.json                 # shadcn/ui component config
├── tsconfig.json                   # TypeScript config
└── package.json                    # Dependencies & scripts
```

---

## 5. Features & Modules

### Landing Page
- Public marketing page introducing FITM Cloud.
- Role-agnostic; links to the dashboard and login.
- Shows platform features: VM Management, Role-Based Access, SSH Key Management, Reverse Proxy, Storage, Academic Management.

### Authentication (`/login`)
- Powered by **better-auth** with session cookies.
- Supports Google OAuth and email/password sign-in.
- `getServerSession()` in RSC pages redirects unauthenticated users to `/login`.

### Dashboard Overview (`/dashboard`)
- Server-rendered entry point.
- Shows summary cards (instances, requests, storage) tailored to the user's role.

### Instances (`/dashboard/instances`)
- Students: view own instances and their provisioning status.
- Instructors: view own + created instances; create new instances and assign to students.
- Admins: view all instances system-wide.

Key operations available per instance:
| Action                      | Roles                            |
| --------------------------- | -------------------------------- |
| View details                | STUDENT, INSTRUCTOR, ADMIN       |
| Create                      | INSTRUCTOR, ADMIN                |
| Delete                      | INSTRUCTOR, ADMIN                |
| Promote to long-term        | INSTRUCTOR, ADMIN                |
| Re-provision (reset failed) | STUDENT (own), INSTRUCTOR, ADMIN |
| Manage reverse proxies      | STUDENT, INSTRUCTOR, ADMIN       |
| View audit logs             | INSTRUCTOR, ADMIN                |
| Create extended request     | STUDENT                          |

### Requests (`/dashboard/requests`)
- Students submit VM provisioning requests to be reviewed by instructors.
- Instructors review and approve/reject pending requests.
- Lists filtered by status and role.

### Storage (`/dashboard/storage`)
- File storage browser backed by an internal proxy route (`/app/_internal/storage`).
- Supports PDF preview and general file preview.

### Settings (`/dashboard/settings`)
- User profile and SSH key management.
- All roles can add/remove SSH public keys.

### Admin Panel (`/dashboard/admin/*`)
- **Courses** — CRUD for academic courses.
- **Semesters** — manage academic semesters; mark one as current.
- **Instructors** — manage instructor accounts.
- **Mailing List** — manage subscription lists.
- **All Instances** — system-wide instance overview.

---

## 6. Role-Based Access Control

Three roles are defined: `ADMIN`, `INSTRUCTOR`, `STUDENT`.

### Permission Matrix

| Permission                | STUDENT | INSTRUCTOR | ADMIN |
| ------------------------- | :-----: | :--------: | :---: |
| VIEW_OWN_PROFILE          |    ✓    |     ✓      |   ✓   |
| MANAGE_SSH_KEYS           |    ✓    |     ✓      |   ✓   |
| VIEW_OWN_INSTANCES        |    ✓    |     ✓      |   ✓   |
| VIEW_INSTRUCTOR_INSTANCES |         |     ✓      |   ✓   |
| VIEW_ALL_INSTANCES        |         |            |   ✓   |
| CREATE_INSTANCE           |         |     ✓      |   ✓   |
| DELETE_INSTANCE           |         |     ✓      |   ✓   |
| PROMOTE_INSTANCE          |         |     ✓      |   ✓   |
| MANAGE_REVERSE_PROXY      |    ✓    |     ✓      |   ✓   |
| CREATE_REQUEST            |    ✓    |            |       |
| VIEW_OWN_REQUESTS         |    ✓    |     ✓      |   ✓   |
| REVIEW_REQUEST            |         |     ✓      |   ✓   |
| CREATE_EXTENDED_REQUEST   |    ✓    |            |       |
| REVIEW_EXTENDED_REQUEST   |         |     ✓      |   ✓   |
| VIEW_COURSES              |         |     ✓      |   ✓   |
| MANAGE_COURSES            |         |            |   ✓   |
| VIEW_SEMESTERS            |         |     ✓      |   ✓   |
| MANAGE_SEMESTERS          |         |            |   ✓   |
| VIEW_INSTRUCTORS          |         |            |   ✓   |
| MANAGE_INSTRUCTORS        |         |            |   ✓   |
| MANAGE_MAILING_LIST       |         |            |   ✓   |
| ACCESS_STORAGE            |    ✓    |     ✓      |   ✓   |

RBAC is enforced via:
- `RoleGuard` component — conditionally renders UI based on `hasPermission()`.
- `useRole` hook — client-side permission checks.
- Server-side API calls — the backend enforces access independently.

---

## 7. API Integration

API types are auto-generated from the backend OpenAPI specification:

```bash
npm run api:gen
# Fetches OpenAPI JSON from http://localhost:3000/api/openapi/json
# Outputs to src/types/api.d.ts (do not manually edit)
```

### Client-Side (React)

```ts
// src/lib/api.ts
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "@midori/types/api";

export const fetchClient = createFetchClient<paths>();
export const api = createClient(fetchClient);
```

Usage in components:
```ts
const { data, isLoading } = api.useQuery("get", "/api/instances/");
```

### Server-Side (RSC)

```ts
// src/lib/server-api.ts
export async function createServerApiClient() {
  const cookieStore = await cookies();
  return createFetchClient<paths>({
    baseUrl: env.SERVER_API_URL,
    headers: { cookie: cookieStore.toString() },
  });
}
```

### Available API Endpoints

| Method | Path                                                    | Description                        |
| ------ | ------------------------------------------------------- | ---------------------------------- |
| GET    | `/api/user/me`                                          | Current authenticated user profile |
| GET    | `/api/user/ssh-keys`                                    | User SSH keys (paginated)          |
| POST   | `/api/user/ssh-keys`                                    | Add SSH key                        |
| DELETE | `/api/user/ssh-keys`                                    | Remove SSH keys                    |
| GET    | `/api/instances/`                                       | Current user's instances           |
| POST   | `/api/instances/`                                       | Create new instance                |
| GET    | `/api/instances/admin`                                  | All instances (admin)              |
| GET    | `/api/instances/instructor`                             | Instructor's instances             |
| GET    | `/api/instances/{instanceId}`                           | Instance details                   |
| DELETE | `/api/instances/{instanceId}`                           | Delete instance                    |
| GET    | `/api/instances/{instanceId}/reverse-proxies`           | Reverse proxy list                 |
| POST   | `/api/instances/{instanceId}/reverse-proxies`           | Create reverse proxy               |
| DELETE | `/api/instances/{instanceId}/reverse-proxies/{proxyId}` | Delete reverse proxy               |
| PATCH  | `/api/instances/{instanceId}/promote`                   | Promote instance                   |
| POST   | `/api/instances/{instanceId}/reprovision`               | Re-provision instance              |
| GET    | `/api/instances/{instanceId}/audit-logs`                | Instance audit logs                |
| GET    | `/api/instances/{instanceId}/extended-request`          | Extended requests                  |
| POST   | `/api/instances/{instanceId}/extended-request`          | Create extended request            |
| GET    | `/api/academic/semesters/current`                       | Current academic semester          |
| GET    | `/metrics`                                              | Prometheus metrics (internal)      |

---

## 8. Authentication

Authentication is handled by **better-auth** (`^1.5.3`).

- The auth client is configured in `src/lib/auth-client.ts`, pointing to `NEXT_PUBLIC_API_URL` with base path `/api/auth`.
- In development, requests to `/api/auth/*` are proxied to `AUTH_API_URL` (the **arisu** service).
- Sessions are cookie-based; the server-side client forwards cookies automatically.

```ts
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
```

---

## 9. Observability Stack

Midori implements the three pillars of observability: **metrics**, **traces**, and **logs**.

### Metrics (Prometheus)

Custom metrics exposed at `GET /api/metrics` (Prometheus scrape endpoint):

| Metric                          | Type      | Labels                          | Description              |
| ------------------------------- | --------- | ------------------------------- | ------------------------ |
| `http_requests_total`           | Counter   | `method`, `path`, `status`      | Total HTTP requests      |
| `http_request_duration_seconds` | Histogram | `method`, `path`, `status`      | HTTP request latency     |
| `api_calls_total`               | Counter   | `service`, `endpoint`, `status` | Backend API calls        |
| `api_call_duration_seconds`     | Histogram | `service`, `endpoint`, `status` | Backend API call latency |
| `auth_events_total`             | Counter   | `event`, `status`               | Authentication events    |
| `logs_total`                    | Counter   | `level`, `service`              | Log volume by level      |
| `log_errors_total`              | Counter   | `service`, `error_type`         | Error log count          |

Plus all **default Node.js process metrics** (CPU, memory, event loop, GC, etc.) via `collectDefaultMetrics`.

### Traces (OpenTelemetry / Jaeger)

Configured via `src/instrumentation.ts` (Next.js instrumentation hook):
- Uses `@opentelemetry/sdk-node` with `BatchSpanProcessor`.
- Exports traces via **OTLP HTTP** to `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Service name and version are set via `OTEL_SERVICE_NAME` and hardcoded `0.1.0`.
- Disabled gracefully if `OTEL_EXPORTER_OTLP_ENDPOINT` is not set.

### Logs (Pino + Loki)

Structured JSON logging via **Pino** (`^10.3.1`):
- Each log entry includes `service`, `env`, `traceId`, `spanId` (from active OTel span).
- Log level controlled by `LOG_LEVEL` env var.
- **Loki transport** (`pino-loki`) enabled when `LOKI_URL` is set; ships logs to Grafana Loki.
- `pino`, `pino-loki`, and `pino-pretty` are excluded from Next.js bundling via `serverExternalPackages`.

### Grafana

Pre-configured dashboards and provisioning files are in `grafana/`:
- `grafana/provisioning/datasources/` — Prometheus, Loki, Jaeger data sources.
- `grafana/provisioning/dashboards/` — Dashboard auto-discovery config.
- `grafana/dashboards/` — Dashboard JSON files.

Refer to [docs/observability/OBSERVABILITY_GUIDE.md](observability/OBSERVABILITY_GUIDE.md) for setup instructions and PromQL/LogQL patterns.

---

## 10. Environment Variables

All environment variables are validated at startup using **Zod** (`src/lib/env.ts`). The application throws on startup if required variables are missing or invalid.

| Variable                      | Required | Default                         | Description                                             |
| ----------------------------- | -------- | ------------------------------- | ------------------------------------------------------- |
| `APP_ENV`                     | ✓        | —                               | `development`, `production`, or `test`                  |
| `SERVER_API_URL`              | ✓        | `http://momoi-development:3000` | Base URL for the main backend API                       |
| `AUTH_API_URL`                | ✓        | `http://arisu:3001`             | Base URL for the auth service                           |
| `NEXT_PUBLIC_API_URL`         | ✓        | —                               | Public base URL for better-auth client                  |
| `OTEL_SERVICE_NAME`           |          | `midori-dev`                    | Service identifier in traces/logs                       |
| `LOG_LEVEL`                   |          | `info`                          | `trace` / `debug` / `info` / `warn` / `error` / `fatal` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` |          | —                               | OTLP HTTP endpoint (tracing disabled if unset)          |
| `LOKI_URL`                    |          | —                               | Loki endpoint (log shipping disabled if unset)          |

---

## 11. Development Setup

### Prerequisites

- **Node.js** LTS (≥ 20)
- **Bun** (used for `bun install` in Docker; optional locally)
- Backend services **momoi** and **arisu** running

### Install & Run

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your local values

# Start development server (with hot reload)
npm run dev
```

The app runs at `http://localhost:3000`.

### Regenerate API Types

Whenever the backend OpenAPI schema changes:

```bash
# Backend must be running at http://localhost:3000
npm run api:gen
```

This fetches the latest OpenAPI JSON and regenerates `src/types/api.d.ts`.

### Scripts

| Script    | Command                  | Description                     |
| --------- | ------------------------ | ------------------------------- |
| `dev`     | `next dev`               | Start development server        |
| `build`   | `next build`             | Production build                |
| `start`   | `next start`             | Start production server         |
| `lint`    | `biome check`            | Run Biome linter                |
| `format`  | `biome format --write`   | Auto-format all files           |
| `api:gen` | `openapi-typescript ...` | Regenerate API type definitions |

---

## 12. Build & Deployment

### Docker (Multi-Stage)

The `Dockerfile` uses three stages for an optimized production image:

| Stage     | Base                | Purpose                                        |
| --------- | ------------------- | ---------------------------------------------- |
| `package` | `oven/bun:1-alpine` | Install dependencies with Bun (fast)           |
| `build`   | `node:lts-alpine`   | Build Next.js with `npm run build`             |
| `runtime` | `node:lts-alpine`   | Minimal runtime with Next.js standalone output |

```bash
docker build -t midori .
docker run -p 3000:3000 --env-file .env midori
```

Key container settings:
- Runs as non-root user `nextjs` (UID 1001).
- Includes `openssl` and `ca-certificates` for secure connections.
- Uses `--use-system-ca` Node.js flag to trust system CA bundle.
- Exposes port `3000`.

### Next.js Standalone Mode

`output: "standalone"` in `next.config.ts` produces a minimal `/.next/standalone` directory that includes only required server files — no `node_modules` copy needed.

---

## 13. Code Quality

### Biome (`2.2.0`)

Biome replaces both ESLint and Prettier:
- **Linting:** `npm run lint` → `biome check`
- **Formatting:** `npm run format` → `biome format --write`
- Config in `biome.json`.

### TypeScript

- Strict TypeScript enabled (`tsconfig.json`).
- Path alias `@midori/*` maps to `src/*`.
- API types are strictly generated from the OpenAPI schema — no `any` in API calls.

### React Compiler

`reactCompiler: true` in `next.config.ts` enables the **React Compiler** (Babel plugin `babel-plugin-react-compiler`) which automatically memoizes components and hooks, replacing manual `useMemo` / `useCallback`.

---

## 14. Dependency Versions

### Runtime Dependencies

```
@opentelemetry/api                     ^1.9.0
@opentelemetry/exporter-trace-otlp-http ^0.208.0
@opentelemetry/resources               ^2.6.0
@opentelemetry/sdk-node                ^0.208.0
@opentelemetry/sdk-trace-node          ^2.6.0
@opentelemetry/semantic-conventions    ^1.40.0
@tanstack/react-query                  ^5.90.21
better-auth                            ^1.5.3
class-variance-authority               ^0.7.1
clsx                                   ^2.1.1
date-fns                               ^4.1.0
lucide-react                           ^0.559.0
next                                   ^16.1.6
next-themes                            ^0.4.6
openapi-fetch                          ^0.15.2
openapi-react-query                    ^0.5.4
pino                                   ^10.3.1
pino-loki                              ^3.0.0
prom-client                            ^15.1.3
radix-ui                               ^1.4.3
react                                  ^19.2.4
react-day-picker                       ^9.14.0
react-dom                              ^19.2.4
sonner                                 ^2.0.7
tailwind-merge                         ^3.5.0
zod                                    ^4.3.6
```

### Dev Dependencies

```
@biomejs/biome                         2.2.0
@tailwindcss/postcss                   ^4.2.1
@types/node                            ^20.19.35
@types/react                           ^19.2.14
@types/react-dom                       ^19.2.3
babel-plugin-react-compiler            ^1.0.0
openapi-typescript                     ^7.13.0
tailwindcss                            ^4.2.1
tw-animate-css                         ^1.4.0
typescript                             ^5.9.3
```

---

*Last updated: March 9, 2026 — Midori v0.1.0*
