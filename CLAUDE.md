# CLAUDE.md — Alterations Manager

This file gives Claude Code context about the project so it can work effectively without re-exploring from scratch.

## What This Project Is

A web-based business management app for a home alterations/seamstress business. Key workflows:
- **Scheduling**: Book fittings 9am–9pm, weekly calendar view, Google Calendar sync (planned)
- **Ticket tracking**: Digital garment tags with status workflow (received → in_progress → ready → picked_up), printable claim tickets
- **Revenue**: Log payments (Venmo/Zelle/Cash), monthly summaries, CSV export for taxes
- **Customers**: Contact list with full history
- **AI Assistant**: Claude-powered chat for drafting customer texts and scheduling suggestions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | SQLite via Prisma 7 + `@prisma/adapter-better-sqlite3` |
| AI | Claude API (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Icons | `lucide-react` |

## Project Structure

```
src/
  app/
    api/              # API routes (Next.js route handlers)
      ai/             # Claude AI - draft messages, scheduling, chat
      appointments/   # CRUD + [id] update/delete
      customers/      # CRUD + [id]
      dashboard/      # Aggregated stats for homepage
      payments/       # CRUD + summary (yearly/monthly totals)
      tickets/        # CRUD + [id]
    assistant/        # AI chat page
    customers/        # Customer list + [id] detail + new
    revenue/          # Revenue dashboard + new payment
    schedule/         # Weekly calendar + new appointment
    tickets/          # Ticket list + [id] detail + [id]/print + new
    layout.tsx        # Root layout with Sidebar
    page.tsx          # Dashboard homepage
  components/
    Sidebar.tsx       # Left nav
    StatusBadge.tsx   # Colored status pill
  generated/
    prisma/           # Auto-generated Prisma client (do not edit)
  lib/
    prisma.ts         # Prisma client singleton
    utils.ts          # formatCurrency, formatDate, generateTicketNumber, constants
prisma/
  schema.prisma       # Data models: Customer, Appointment, Ticket, Payment
  migrations/         # SQL migration history
prisma.config.ts      # Prisma 7 config (datasource URL lives here, not in schema)
```

## Key Conventions

- **Prisma 7**: The datasource URL is in `prisma.config.ts`, NOT in `schema.prisma`. The generator uses `provider = "prisma-client"` (not `prisma-client-js`). Always import from `@/generated/prisma/client`.
- **DB path**: The SQLite adapter uses `path.resolve(process.cwd(), 'prisma/dev.db')` — the DB file lives in `prisma/`.
- **API routes**: All use Next.js 15+ async params pattern: `{ params }: { params: Promise<{ id: string }> }` with `const { id } = await params`.
- **Status values**: Tickets: `received | in_progress | ready | picked_up`. Appointments: `scheduled | completed | cancelled`.
- **Ticket numbers**: Auto-generated as `ALT-YYMMDD-NNN` by `generateTicketNumber()` in `src/lib/utils.ts`.

## Environment Variables

Copy `.env` and fill in:
```
DATABASE_URL="file:./prisma/dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
```

Google Calendar vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are optional — the app works without them.

## Common Commands

```bash
# Install
npm install

# Set up / reset database
npx prisma migrate dev
npx prisma generate

# Dev server
npm run dev          # http://localhost:3000

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

## Open Issues / Planned Work

- **#1** Firebase Hosting — deployment target TBD (Firebase App Hosting vs Firestore migration)
- **#2** CLAUDE.md — this file ✓
- **#3** CI/CD workflow — GitHub Actions for type check, lint, audit ✓
