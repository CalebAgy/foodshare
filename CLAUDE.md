# CLAUDE.md – FoodShare

## Project Overview

FoodShare is a mobile-first web app that connects companies and private individuals with students to rescue surplus food. Companies and individuals post food offers before they expire; students find, filter, and claim them. The platform tracks CO₂ savings and user reach to measure impact.

Current state: **Alpha prototype** — UI/UX is functional, backend and business logic are missing.

---

## Tech Stack & Architecture

| Layer | Technology |
|---|---|
| Framework | React 18.3 (function components + hooks) |
| Routing | React Router 7 (browser router) |
| Build | Vite 6 + `@vitejs/plugin-react` |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite` plugin) |
| UI Components | shadcn/ui (Radix UI primitives + CVA variants) |
| Icons | Lucide React |
| Forms | React Hook Form 7 |
| Toasts | Sonner |
| Animations | Motion (Framer Motion v12) |
| Charts | Recharts |
| Testing | Vitest + @testing-library/react + jsdom |
| Language | TypeScript (ESM modules) |
| Package Manager | pnpm (workspace config present) |

**Architecture pattern**: flat page-component model. No state management library; all state is local `useState`. No API layer — data comes from `src/app/data/mockListings.ts`.

```
src/
  main.tsx                  # React entry + RouterProvider
  app/
    App.tsx                 # Root component
    routes.tsx              # createBrowserRouter definition
    types/
      listing.ts            # Listing interface
    data/
      mockListings.ts       # 6 hardcoded demo listings
    pages/                  # One file per route
      Home.tsx              # Browse + search + filter
      Search.tsx            # Advanced search with categories
      ListingDetail.tsx     # Single listing view + contact
      AddListing.tsx        # Create offer form (non-persisting)
      Profile.tsx           # User profile (hardcoded data)
    components/
      MobileLayout.tsx      # max-w-md wrapper + bottom nav toggle
      BottomNav.tsx         # Fixed 4-tab bottom navigation
      ListingCard.tsx       # Reusable card for listing grids
      FilterBar.tsx         # Store / Private / All filter buttons
      ImageWithFallback.tsx # (unused)
      ui/                   # 50+ shadcn/ui components
  styles/
    index.css               # CSS import hub
    tailwind.css            # Tailwind v4 theme config
    theme.css               # CSS custom properties (light/dark)
```

---

## How to Run, Build, and Test

```bash
# Install dependencies
pnpm install          # or: npm install

# Start dev server (hot reload)
pnpm dev              # or: npm run dev
# → http://localhost:5173

# Production build
pnpm build            # or: npm run build

# Run tests (Vitest)
pnpm test             # watch mode
pnpm test:run         # single run / CI
pnpm test:ui          # browser UI for tests
```

> **Note**: `react` and `react-dom` are declared as `peerDependencies`. They are installed via the `overrides` field in package.json.

---

## User Roles & Core Needs

### Student
- Find affordable, surplus food nearby — fast
- Filter by dietary category (vegan, halal, vegetarian, etc.)
- Reserve an offer in one tap; receive pickup reminders
- Trust signals: ratings, distance, time remaining

### Company / Private Poster
- Create a food offer in under 3 minutes to react quickly to surplus
- See how many users have viewed / saved an offer (reach metrics)
- View CO₂ savings per offer to communicate sustainability impact
- Manage active vs. expired offers

### Platform (trust & safety)
- Only verified/authenticated users access offers
- Ratings and reviews after pickup (1–3 day window)
- Abuse protection: no fake accounts, no spam listings
- Admin tooling (future)

---

## Geolocation & Map Feature — Acceptance Criteria

| # | Acceptance Criterion | Status | Notes |
|---|---|---|---|
| AC-1 | `useGeolocation` hook returns `{ latitude, longitude, error, loading, permissionState }` | ✅ | `src/app/hooks/useGeolocation.ts` |
| AC-2 | `LocationPermissionBanner` component shown when location not yet granted; has "Standort aktivieren" button | ✅ | `src/app/components/LocationPermissionBanner.tsx` |
| AC-3 | `Listing` type has `latitude: number`, `longitude: number`; all mock listings have real Berlin coordinates | ✅ | `src/app/types/listing.ts`, `src/app/data/mockListings.ts` |
| AC-4 | Home page sorts listings by computed haversine distance (closest first) when location available | ✅ | `src/app/pages/Home.tsx` |
| AC-5 | `ListingCard` shows computed distance (km, 1 decimal) using `haversineDistance`; falls back to stored distance | ✅ | `src/app/components/ListingCard.tsx` |
| AC-6 | `/map` route renders `MapView` page with Leaflet `MapContainer`; one `Marker` per listing | ✅ | `src/app/pages/MapView.tsx`, react-leaflet installed |
| AC-7 | Clicking a map marker navigates to `/listing/:id` for that listing | ✅ | `MapView.tsx` — `eventHandlers.click` calls `navigate` |
| AC-8 | When geolocation is denied/unavailable, a `LocationFallback` component explains and offers retry | ✅ | `src/app/components/LocationFallback.tsx` |

---

## Requirements vs. Implementation Status

| User Story | Acceptance Criteria | Status | Notes |
|---|---|---|---|
| Student: see offers on a map | Map renders with pins for each listing; tapping a pin opens detail | ❌ | No map component; location is text only |
| Student: filter by category (vegan, halal, …) | Dietary category chips visible; selecting one filters listing grid | ⚠️ | Store/Private filter works; dietary categories missing |
| Student: reserve with one click | "Reserve" button on detail page; reservation saved and visible in profile | ❌ | Button says "Call" or "Message"; no reservation state |
| Student: reminder 15 min before pickup | Push/in-app notification sent 15 min before `expiresAt` | ❌ | Bell icon present; no notification logic |
| Company: create offer in <3 min | Form with ≤5 required fields; submits and persists; appears in listing feed | ⚠️ | Form exists with 4 required fields; submission does NOT persist |
| Company: see user reach | Dashboard shows view/save count per offer | ❌ | Profile shows hardcoded stats only |
| Company: CO₂ savings per offer | CO₂ kg calculated and shown per listing based on food weight/type | ❌ | No CO₂ logic exists |
| User: rate offers 1–3 days after pickup | Rating dialog appears after pickup window; rating saved and displayed | ❌ | No rating component or logic |
| Platform: verified users only | Unauthenticated requests redirected to login; protected routes enforced | ❌ | No auth; all routes are public |

---

## Known Gaps & TODOs

### Critical (blockers for real usage)
- [ ] Backend API + database (no persistence at all)
- [ ] Authentication & user accounts (no login/signup)
- [ ] Image upload (placeholder UI only)
- [ ] Real reservation / claim system
- [ ] Push notification infrastructure

### High Priority
- [x] Map integration (Leaflet) — `/map` route, geolocation hook, distance sort
- [ ] Dietary category filter (vegan, halal, vegetarian, gluten-free)
- [ ] CO₂ savings calculator
- [ ] Rating & review system (1–3 day post-pickup window)
- [ ] Company dashboard (reach metrics)
- [ ] Route protection (redirect unauthenticated users)

### Medium Priority
- [ ] Error boundaries and loading states
- [ ] State management (Context API or Zustand) to decouple pages from mock data
- [ ] API service layer (abstract data fetching for backend swap)
- [ ] Environment variable support (.env)

### Low Priority / Cleanup
- [ ] Remove unused `@mui/material` dependency
- [ ] Use `ImageWithFallback` component instead of raw `<img>` tags
- [ ] Strict TypeScript config (`"strict": true`)
- [ ] Performance: lazy-load pages, memoize filtered lists
- [ ] PWA / offline support

---

## Definition of Done

A feature is considered done when:
1. **Functionality**: acceptance criteria in the table above are met
2. **Tests**: unit and/or integration tests pass (`pnpm test:run`)
3. **Persistence**: data is saved to the backend (no mock-only state)
4. **Auth-gated**: feature respects authentication where required
5. **Mobile UX**: works on 375 px viewport without horizontal scroll
6. **No console errors**: clean browser console in dev and prod builds
