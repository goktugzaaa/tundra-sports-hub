# Tundra Sports Hub

Internal operations platform for **Tundra Sports Group**, a football-focused
sports agency. A clean, scalable frontend application layer over the agency's
existing operational data.

The system manages athletes, scouting prospects, NIL deals, payments,
tasks, compliance and documents in a single role-aware workspace.

> Built frontend-first. Runs entirely on realistic mock data, and is
> architected so the data source can be swapped (Airtable, Supabase,
> REST, Postgres) without touching UI or business logic.

---

## Features

- **Operations dashboard** — KPI bento grid, deal pipeline health,
  payment breakdown, compliance alerts and a recent-activity feed.
- **Athletes** — searchable, filterable, paginated CRM with detail views,
  financial summaries and create/edit.
- **Prospects** — recruiting pipeline with a clickable stage rail and
  in-place stage transitions.
- **NIL Deals** — revenue tracking, status rail and lifecycle actions
  (advance / close).
- **Payments** — invoice tracking, outstanding balances, overdue alerts,
  grouped views and summary cards.
- **Tasks** — workflow queue with priority, due-date highlighting and
  quick status changes.
- **Compliance** — expiry tracking, per-athlete timelines and digital
  resolution (approve / resolve / renew).
- **Documents** — document register with status tags and preview.
- **Settings** — workspace configuration and a live RBAC policy matrix.
- **Athlete portal** — a dedicated personal workspace for athlete users.

## Roles

| Role | Access |
|---|---|
| **Admin** | Full access across every module |
| **Recruiter** | Only their assigned athletes and prospects |
| **Athlete** | Only their own data, deals, tasks and compliance |

Role-based access is enforced at three layers: route guard, service-layer
data scoping, and UI gating.

## Tech Stack

- React 18 + TypeScript
- Vite
- React Router
- No UI framework — a hand-built design system

## Architecture

A layered, backend-agnostic design:

```
UI / modules        presentation + interaction
      │
domain              pure business rules + entities (no I/O)
      │
services            ScopedDataService — RBAC-aware data access
      │
DataProvider        swappable: Mock | Airtable | (REST | Postgres)
```

- **Domain layer** is pure — no React, no network, fully testable.
- **DataProvider** is a single interface; the app never imports a
  concrete backend. Mock is the default; an Airtable adapter is included.
- **AuthService** follows the same pattern — Mock and Supabase providers.
- Swapping a backend is an environment variable, not a refactor.

## Getting Started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
npm run preview  # preview the production build
```

The app runs with **zero configuration** on mock data.

## Environment

Copy `.env.example` to `.env` to configure. All variables are optional.

| Variable | Purpose | Default |
|---|---|---|
| `VITE_BACKEND` | `mock` or `airtable` | `mock` |
| `VITE_AUTH` | `mock` or `supabase` | `mock` |
| `VITE_DEBUG` | Debug logging | `false` |
| `VITE_AIRTABLE_BASE_ID` | Airtable base | — |
| `VITE_AIRTABLE_PROXY_URL` | Token-safe Airtable proxy | — |
| `VITE_SUPABASE_URL` | Supabase project URL | — |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | — |

## Project Structure

```
src/
├── app/           composition root + routing
├── domain/        pure business logic (entities, rules, services)
├── services/      data abstraction — DataProvider + adapters
├── auth/          auth abstraction — AuthService + adapters
├── rbac/          role-based access policy
├── modules/       feature modules (views + hooks)
├── ui/            design-system components
├── observability/ logger + error boundary
└── config/        environment configuration
```

## Deployment

Static SPA — deployable to Vercel or Netlify. Config files for both are
included (`vercel.json`, `netlify.toml`).

## Status

V1. The application is feature-complete on mock data. Connecting a live
Airtable base requires mapping the adapter to the target schema; the
abstraction is already in place.
