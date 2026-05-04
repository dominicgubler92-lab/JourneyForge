# JourneyForge

JourneyForge is a travel discovery tool for finding flexible, low-price trips from a chosen departure airport.

## Vision

The goal is to make early travel planning feel exploratory and practical: choose where you start, set a rough budget, and compare the cheapest destinations before moving to external booking pages.

## Planned Features

- Airport autocomplete for departure search
- Flexible deal search for the next three months
- Budget-based flight deal cards
- 3D globe with origin and destination pins
- Optional authentication for later saved-trip features
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
- Three.js and React Three Fiber for the interactive globe
- TanStack Query, React Hook Form, and Zod
- Supabase Auth and Postgres for saved trips
- Vercel deployment target
- Amadeus airport and flight inspiration adapters with demo fallbacks

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

Add Supabase credentials to enable optional authentication. Add Amadeus credentials to enable live airport and flight inspiration searches; without them JourneyForge uses normalized demo data through the same provider interface.

`AMADEUS_BASE_URL` defaults to `https://test.api.amadeus.com`. Use the production Amadeus base URL only after production access is approved.

## Authentication

JourneyForge can be used without an account. Signing in is optional and only required to save trips.

Supabase Auth setup:

- Enable email magic links.
- Optional: enable the Google provider for OAuth sign-in.
- Set the Site URL to `https://journeyforge.vercel.app`.
- Add redirect URLs for `https://journeyforge.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.

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
