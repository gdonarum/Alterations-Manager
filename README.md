# Alterations Manager

A full-featured business management web app for an alterations/seamstress business.

## Features

- **Dashboard** — Today's appointments, active tickets, monthly revenue at a glance
- **Schedule** — Weekly calendar view, appointment booking (9am–9pm), AI-suggested open slots, Google Calendar sync-ready
- **Tickets** — Digital garment tag system: create tickets, track status (Received → In Progress → Ready → Picked Up), print claim tags
- **Customers** — Contact list with full history (tickets, appointments, payments)
- **Revenue** — Payment logging (Venmo/Zelle/Cash), monthly bar chart, CSV export for taxes
- **AI Assistant** — Claude-powered chat for drafting customer texts and scheduling help

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **Prisma 7 + SQLite** (local database)
- **Claude API** (`claude-sonnet-4-6`) for AI features

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables — add to `.env`:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   ANTHROPIC_API_KEY="your-key-here"
   ```

3. Initialize the database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.
