@AGENTS.md

# Alterations Manager

Business management web app for a home alterations business. Firebase-based intranet app with PWA support for mobile phone use.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Firestore (Firebase) |
| Auth | Firebase Auth (Google Sign-in) |
| Server SDK | firebase-admin |
| Session | jose (JWT, Edge-compatible) |
| Calendar | Google Calendar API (googleapis) |
| Sheets | Google Sheets API (googleapis) |
| AI | Anthropic claude-sonnet-4-6 |
| PWA | next-pwa + public/manifest.json |
| CI | GitHub Actions (tsc, eslint, CodeQL) |

## Directory Structure

```
src/
  app/
    page.tsx              # Dashboard
    layout.tsx            # Root layout with AuthProvider + PWA meta
    login/page.tsx        # Google Sign-in page
    schedule/
      page.tsx            # Week grid (desktop) + day view (mobile)
      new/page.tsx
    tickets/
      page.tsx            # Ticket list with search/filter
      new/page.tsx        # Create ticket → redirect to print
      [id]/page.tsx       # Ticket detail + AI message draft
      [id]/print/page.tsx # Printable garment tag + claim ticket
    customers/
      page.tsx
      new/page.tsx
      [id]/page.tsx
    revenue/
      page.tsx            # Monthly chart + payment history
      new/page.tsx        # Record payment, link to tickets
    assistant/page.tsx    # AI chat with live Firestore context
    api/
      auth/session/       # POST: verify Firebase ID token, set JWT cookie
      auth/logout/        # POST: clear session cookie
      dashboard/          # GET: today appointments, ticket counts, month revenue
      appointments/       # GET/POST + [id] GET/PUT/DELETE
      tickets/            # GET/POST + [id] GET/PUT/DELETE
      customers/          # GET/POST + [id] GET/PUT/DELETE
      payments/           # GET/POST
      payments/summary/   # GET: monthly totals by method
      ai/                 # POST: draft_message | scheduling_suggestion | chat
  components/
    AuthProvider.tsx      # Firebase Auth context
    Sidebar.tsx           # Nav + logout
    StatusBadge.tsx
  lib/
    firebase.ts           # Client SDK init
    firebase-admin.ts     # Admin SDK init (server only)
    session.ts            # JWT create/verify (jose)
    google-calendar.ts    # createCalendarEvent / updateCalendarEvent
    google-sheets.ts      # appendPaymentToSheet / appendCustomerToSheet
    utils.ts              # formatDate, formatTime, formatCurrency, etc.
  middleware.ts           # Protect all routes except /login and /api/auth
```

## Data Model (Firestore)

All collections use denormalized `customerName` / `customerPhone` / `customerId` stored at write time to avoid joins.

### `customers`
```
{ name, phone?, email?, contactMethod?, notes?, createdAt, updatedAt }
```

### `appointments`
```
{ customerId, customerName, customerPhone?, startTime, endTime, type, notes?, status, googleEventId?, createdAt, updatedAt }
```

### `tickets`
```
{ ticketNumber, customerId, customerName, customerPhone?, garmentType, description?, alterations, status, dueDate?, price?, notifiedReady, paymentId?, createdAt, updatedAt }
```

### `payments`
```
{ customerId, customerName, amount, method, date, notes?, ticketIds[], createdAt, updatedAt }
```

## Auth Flow

1. User clicks "Sign in with Google" on `/login`
2. Firebase Auth popup → grants Calendar + Sheets OAuth scopes
3. Frontend POSTs Firebase ID token to `/api/auth/session`
4. Server verifies token with `adminAuth.verifyIdToken()`, checks `AUTHORIZED_EMAIL`
5. Creates signed JWT cookie (httpOnly, 8h) storing `{ email, name, picture, googleAccessToken }`
6. Middleware reads cookie on every request, redirects unauthenticated users to `/login`

## Environment Variables

See `.env.example` for full list. Required:
- `NEXT_PUBLIC_FIREBASE_*` — client SDK config
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — admin SDK
- `AUTHORIZED_EMAIL` — restrict login to this address
- `SESSION_SECRET` — JWT signing key (`openssl rand -base64 32`)

Optional:
- `GOOGLE_SHEETS_REVENUE_ID` — Google Sheet ID for auto-sync

## Key Conventions

- **Firestore Timestamps**: Always convert with `.toDate().toISOString()` before sending to client
- **Google Calendar/Sheets errors**: Non-fatal — logged but not thrown
- **No Firestore joins**: Customer data denormalized at write time
- **Firestore compound query limit**: Can't use `!=` + range filter together; filter cancelled appointments in-memory
- **Edge middleware**: Uses `jose` directly (not firebase-admin, which requires Node.js runtime)

## Commands

```bash
npm run dev     # Development server (http://localhost:3000)
npm run build   # Production build
npm run lint    # ESLint
```
