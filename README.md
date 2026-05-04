# JourneyForge

JourneyForge is a travel planning tool for shaping ideas, routes, bookings, budgets, and notes into one clear trip plan.

## Vision

The goal is to make travel planning feel calm and structured instead of scattered across chats, maps, documents, and browser tabs.

## Planned Features

- Trip overview with destinations, dates, travelers, and status
- Day-by-day itinerary planning
- Route and transport notes
- Accommodation and booking references
- Budget tracking
- Packing and preparation checklists
- Shared notes for people planning together

## Tech Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS with Radix/shadcn-style primitives
- TanStack Query, React Hook Form, and Zod
- Supabase Auth and Postgres for saved trips
- Vercel deployment target
- Amadeus-ready provider adapter with a demo fallback

## Getting Started

Install dependencies and run the local app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Optional environment variables:

```bash
cp .env.example .env.local
```

Add Supabase credentials to enable authenticated trip saving. Add Amadeus credentials to enable live flight searches; without them JourneyForge uses normalized demo data through the same provider interface.

## Database

Apply `supabase/schema.sql` to a Supabase project to create the `trips` table and row-level security policies.

## Scripts

- `npm run dev` starts local development.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
- `npm test` runs unit tests.
- `npm run e2e` runs Playwright checks.

## Working Notes

- Keep the product focused on actual trip planning workflows.
- Prefer simple, useful screens over broad feature lists.
- Design for repeated use: scanning, editing, comparing options, and updating plans.
