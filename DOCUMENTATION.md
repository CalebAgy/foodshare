# FoodShare — Technical Documentation

## Table of Contents
1. [What Is FoodShare?](#1-what-is-foodshare)
2. [Tech Stack](#2-tech-stack)
3. [How to Run and Build](#3-how-to-run-and-build)
4. [Architecture Overview](#4-architecture-overview)
5. [Folder Structure](#5-folder-structure)
6. [Data Model](#6-data-model)
7. [Features — What Is Implemented](#7-features--what-is-implemented)
8. [Geolocation — How It Works](#8-geolocation--how-it-works)
9. [Map Feature — How It Works](#9-map-feature--how-it-works)
10. [User Roles and Interactions](#10-user-roles-and-interactions)
11. [Stakeholder Interactions](#11-stakeholder-interactions)
12. [App Usage Flows](#12-app-usage-flows)
13. [Testing](#13-testing)
14. [Known Limitations and Next Steps](#14-known-limitations-and-next-steps)

---

## 1. What Is FoodShare?

FoodShare is a **mobile-first progressive web app** that connects surplus food providers (bakeries, supermarkets, private individuals) with students who want affordable food. The goal is to reduce food waste while helping students save money.

**Core idea:** A bakery has leftover bread at 6 PM. They post it on FoodShare in under 3 minutes. Nearby students get notified, see the offer on a map, and pick it up before it expires.

**Current state:** Alpha prototype. The UI is complete and functional with mock data. Backend (database, auth, real persistence) is not yet implemented.

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI Framework | React | 18.3 | Component rendering |
| Routing | React Router | 7 | Page navigation |
| Build Tool | Vite | 6 | Dev server, bundling |
| Styling | Tailwind CSS | v4 | Utility-first CSS |
| UI Components | shadcn/ui + Radix UI | — | Pre-built accessible components |
| Map | Leaflet + react-leaflet | 1.9 / 4.2 | Interactive map with markers |
| Icons | Lucide React | 0.487 | Icon library |
| Forms | React Hook Form | 7 | Form state management |
| Toasts | Sonner | 2 | Notification toasts |
| Animations | Motion (Framer) | 12 | Animations |
| Testing | Vitest + Testing Library | 4 / 16 | Unit and component tests |
| Language | TypeScript | — | Type safety |
| Package Manager | npm / pnpm | — | Dependency management |

**Not yet integrated:**
- Backend / API (no server exists)
- Database (all data is mocked in-memory)
- Authentication (all routes are public)
- Push notifications

---

## 3. How to Run and Build

```bash
# Navigate to the project
cd foodshare/

# Install dependencies
npm install

# Start the development server (hot reload)
npm run dev
# → Opens at http://localhost:5173 (or 5174 if port is taken)

# Run tests (single run)
npm run test:run

# Run tests in watch mode
npm test

# Production build
npm run build
# → Output in dist/
```

> **Mobile testing tip:** Run `npm run dev -- --host` to expose the server on your local network. A QR code appears in the terminal — scan it on your phone.

> **Important:** Geolocation only works over HTTPS or on `localhost`. It will not work on a plain HTTP deployment.

---

## 4. Architecture Overview

```
┌─────────────────────────────────────┐
│           Browser (Mobile)          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │        React App            │    │
│  │  ┌─────────┐ ┌───────────┐ │    │
│  │  │  Pages  │ │Components │ │    │
│  │  └────┬────┘ └─────┬─────┘ │    │
│  │       │            │       │    │
│  │  ┌────▼────────────▼─────┐ │    │
│  │  │  Hooks & Utilities    │ │    │
│  │  │  useGeolocation       │ │    │
│  │  │  haversineDistance    │ │    │
│  │  └───────────────────────┘ │    │
│  │                             │    │
│  │  ┌───────────────────────┐ │    │
│  │  │   Mock Data Layer     │ │    │
│  │  │   mockListings.ts     │ │    │
│  │  └───────────────────────┘ │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Browser APIs               │    │
│  │  navigator.geolocation      │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
        │ (future)
        ▼
┌──────────────────┐
│  Backend API     │  ← Not yet built
│  Database        │
│  Auth            │
└──────────────────┘
```

**Pattern:** Flat page-component model. No global state management library. Each page owns its state via `useState` / `useMemo`. Data comes from `mockListings.ts` — a static array that will be replaced by API calls.

---

## 5. Folder Structure

```
foodshare/
├── src/
│   ├── main.tsx                        Entry point — mounts React + Router
│   ├── app/
│   │   ├── App.tsx                     Root component (RouterProvider)
│   │   ├── routes.tsx                  All route definitions
│   │   │
│   │   ├── types/
│   │   │   └── listing.ts              Listing TypeScript interface
│   │   │
│   │   ├── data/
│   │   │   └── mockListings.ts         6 hardcoded Berlin listings with coords
│   │   │
│   │   ├── hooks/
│   │   │   └── useGeolocation.ts       Browser geolocation hook
│   │   │
│   │   ├── utils/
│   │   │   └── haversineDistance.ts    Distance calculation (km between coords)
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.tsx                Browse + search + filter + distance sort
│   │   │   ├── Search.tsx              Advanced search with categories
│   │   │   ├── ListingDetail.tsx       Single listing view + contact button
│   │   │   ├── AddListing.tsx          Create offer form
│   │   │   ├── MapView.tsx             Leaflet map with all listing markers
│   │   │   └── Profile.tsx             User profile (hardcoded)
│   │   │
│   │   └── components/
│   │       ├── MobileLayout.tsx        Max-width wrapper + bottom nav
│   │       ├── BottomNav.tsx           5-tab fixed bottom navigation
│   │       ├── ListingCard.tsx         Listing preview card
│   │       ├── FilterBar.tsx           Store / Private / All filter
│   │       ├── LocationPermissionBanner.tsx  "Standort aktivieren" banner
│   │       ├── LocationFallback.tsx    Denied/unavailable error state
│   │       └── ui/                     50+ shadcn/ui base components
│   │
│   ├── __tests__/
│   │   ├── setup.ts                    jest-dom setup
│   │   ├── ac1-geolocation-hook.test.ts
│   │   ├── ac2-location-permission-ui.test.tsx
│   │   ├── ac3-listing-coordinates.test.ts
│   │   ├── ac4-distance-sort.test.tsx
│   │   ├── ac5-distance-display.test.tsx
│   │   ├── ac6-ac7-map-view.test.tsx
│   │   ├── ac8-location-fallback.test.tsx
│   │   ├── haversine-distance.test.ts
│   │   ├── student-category-filter.test.ts
│   │   └── student-reminder.test.ts
│   │
│   └── styles/
│       ├── index.css                   CSS import hub
│       ├── tailwind.css                Tailwind v4 config
│       └── theme.css                  CSS custom properties (light/dark)
│
├── CLAUDE.md                           Developer reference + AC status table
├── DOCUMENTATION.md                    This file
├── package.json
└── vite.config.ts                      Vite + Vitest config
```

---

## 6. Data Model

### The `Listing` Interface

```typescript
interface Listing {
  id: string;              // Unique identifier
  type: 'store' | 'private'; // Who is posting
  title: string;           // Short offer title
  description: string;     // Full description
  location: string;        // Neighbourhood name (display only)
  address: string;         // Full street address
  latitude: number;        // WGS-84 latitude  ← added in sprint 1
  longitude: number;       // WGS-84 longitude ← added in sprint 1
  distance: number;        // Fallback distance in km (used without GPS)
  price: number;           // 0 = free
  expiresAt: Date;         // When the offer expires
  imageUrl: string;        // Photo URL
  contact: string;         // Phone or "Nachricht über App"
  category: string[];      // e.g. ['Backwaren', 'Brot']
  createdBy: string;       // Poster name
  createdAt: Date;         // When it was posted
}
```

### Mock Listings (real Berlin coordinates)

All 6 listings use real street addresses near **HTW Berlin, Oberschöneweide** (52.4573°N, 13.5315°E):

| ID | Name | Location | Distance from HTW |
|---|---|---|---|
| 1 | Bäckerei Schmidt | Brückenstraße 4, 12439 | ~0.8 km |
| 2 | Obst & Gemüse (privat) | Wilhelminenhofstraße 95, 12459 | ~1.2 km |
| 3 | Edeka Supermarkt | Treskowallee 12, 10318 | ~2.1 km |
| 4 | Milchprodukte (privat) | Tiergartenstraße 15, 10319 | ~3.5 km |
| 5 | Obstkorb (privat) | Kiefholzstraße 43, 12437 | ~1.8 km |
| 6 | Metzgerei Müller | Rudower Chaussee 17, 12489 | ~2.8 km |

---

## 7. Features — What Is Implemented

### ✅ Browse & Filter (Home page `/`)
- Grid of `ListingCard` components showing all listings
- Real-time text search (title, description, categories)
- Type filter: All / Läden / Privat
- **Distance sort**: when GPS is available, listings are sorted closest-first using the haversine formula

### ✅ Geolocation
- Browser permission banner on first visit
- Listings re-sort instantly when location is granted
- Each card shows the real computed distance (e.g. "0.8 km")
- Graceful fallback when GPS is denied or unavailable

### ✅ Map View (`/map`)
- Interactive Leaflet map (OpenStreetMap tiles)
- One blue default marker per listing
- Blue dot for the user's own position
- Map auto-centres on user location when available, falls back to HTW
- Tap any marker → navigates to that listing's detail page

### ✅ Listing Detail (`/listing/:id`)
- Full image, title, description
- Time remaining with urgency highlight (<3 hours → red)
- Distance display
- Category badges
- Contact bar: phone call or in-app message button

### ✅ Create Offer Form (`/add`)
- Type selection (private / store)
- Title, description, location, price, expiry, contact fields
- Required field validation with toast error
- Success toast + redirect (does not persist — no backend)

### ✅ Search Page (`/search`)
- Category chips (Backwaren, Obst, etc.)
- Recent searches (static)
- Live results with count

### ✅ Profile Page (`/profile`)
- User stats (hardcoded)
- Impact metric (kg food saved)

### ❌ Not Yet Implemented
- Backend / database (no persistence)
- User authentication
- Real image upload
- Reservation / claim system
- Push notifications
- Ratings and reviews
- CO₂ savings calculation
- Company analytics dashboard

---

## 8. Geolocation — How It Works

### The `useGeolocation` Hook

**File:** `src/app/hooks/useGeolocation.ts`

This is a React hook that wraps the browser's `navigator.geolocation` API. It manages a state machine with five states:

```
idle → loading → success
              ↘ denied
              ↘ unavailable
```

**State object returned:**
```typescript
{
  latitude: number | null,
  longitude: number | null,
  error: string | null,
  loading: boolean,
  permissionState: 'idle' | 'loading' | 'success' | 'denied' | 'unavailable',
  requestLocation: () => void   // call this to trigger the browser dialog
}
```

**How a component uses it:**
```typescript
const { latitude, longitude, permissionState, requestLocation } = useGeolocation();

useEffect(() => {
  requestLocation(); // triggers browser permission popup on mount
}, []);
```

**State transitions:**
- `idle` → `loading`: `requestLocation()` was called
- `loading` → `success`: user allowed, browser returned coordinates
- `loading` → `denied`: user clicked "Block" in the permission dialog
- `loading` → `unavailable`: GPS timeout, hardware unavailable, or browser doesn't support geolocation

**Configuration:**
```typescript
// Inside the hook:
enableHighAccuracy: true,  // use GPS, not just IP/WiFi
timeout: 10000,            // give up after 10 seconds
maximumAge: 60000          // accept a cached position up to 60s old
```

### The `haversineDistance` Utility

**File:** `src/app/utils/haversineDistance.ts`

Given two lat/lng coordinate pairs, returns the great-circle distance in kilometres (rounded to 1 decimal).

```typescript
haversineDistance(lat1, lon1, lat2, lon2): number
```

**Example:**
```typescript
haversineDistance(52.4573, 13.5315, 52.4619, 13.5225) // → 0.8 km
haversineDistance(52.52, 13.405, 48.135, 11.582)       // → 524.1 km (Berlin → Munich)
```

It is a pure function — no React, no side effects, trivially testable.

### Distance Sort on Home Page

When the user grants location permission, the Home page re-renders with listings sorted by computed distance:

```typescript
const filteredListings = useMemo(() => {
  const base = mockListings.filter(/* search + type filter */);

  if (userLocation) {
    return [...base].sort(
      (a, b) =>
        haversineDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) -
        haversineDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
    );
  }

  return base; // fallback: insertion order
}, [filter, searchQuery, userLocation]);
```

### Permission UI Components

**`LocationPermissionBanner`** — shown when `permissionState` is `'idle'` or `'loading'`:
- Blue info strip at the top of the page
- "Standort aktivieren" button (disabled while loading, spinner shown)
- Disappears automatically when `permissionState` reaches `'success'`, `'denied'`, or `'unavailable'`

**`LocationFallback`** — shown when `permissionState` is `'denied'` or `'unavailable'`:
- Red strip explaining the problem
- Different message for denied vs. unavailable
- "Erneut versuchen" button re-calls `requestLocation()`

---

## 9. Map Feature — How It Works

**File:** `src/app/pages/MapView.tsx`  
**Route:** `/map`  
**Nav tab:** "Karte" (3rd tab in bottom navigation)

### Libraries used
- **Leaflet** (`leaflet` v1.9): the core mapping engine — handles tiles, markers, zoom, pan
- **react-leaflet** (`react-leaflet` v4.2): React wrapper components for Leaflet

> **Version note:** `react-leaflet` v5 requires React 19. This project uses React 18, so v4 is used.

### Marker icon fix (Vite-specific)

Leaflet's default marker icons rely on webpack's file loader. In Vite they break. The fix is to manually import the PNGs and tell Leaflet where they are:

```typescript
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
```

### Map structure

```tsx
<MapContainer center={mapCenter} zoom={13}>
  <RecenterMap center={mapCenter} />   {/* pans map when user location changes */}
  <TileLayer url="openstreetmap..." />

  {/* User's own position — blue dot */}
  {userPos && <Marker position={userPos} icon={userIcon} />}

  {/* One marker per listing */}
  {mockListings.map(listing => (
    <Marker
      position={[listing.latitude, listing.longitude]}
      eventHandlers={{ click: () => navigate(`/listing/${listing.id}`) }}
    >
      <Popup>{listing.title}, {listing.address}</Popup>
    </Marker>
  ))}
</MapContainer>
```

### `RecenterMap` component

Leaflet's map centre is set at creation time and doesn't update automatically when a React prop changes. This inner component solves that:

```typescript
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap(); // react-leaflet hook — gets the Leaflet map instance
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
}
```

When the user grants GPS and `userPos` goes from `null` to real coordinates, `RecenterMap` calls `map.setView()` and the map smoothly pans to the user's location.

### Map height requirement

Leaflet **requires** its container to have an explicit pixel height — `height: 100%` alone doesn't work if the parent also has `height: 100%`. The map div uses:

```tsx
style={{ height: 'calc(100vh - 220px)' }}
```

This makes the map fill the visible screen below the sticky header.

---

## 10. User Roles and Interactions

### Student

The primary consumer. Opens the app to find affordable food nearby.

**Journey:**
1. Opens app → sees listing feed (sorted by distance if GPS granted)
2. Searches or filters by type (Laden / Privat)
3. Taps a listing card → sees full detail (image, time remaining, price, contact)
4. Taps "Karte" tab → sees all offers on a map
5. Taps a map marker → goes to that listing's detail
6. Contacts the provider via phone or in-app message

**What the student sees:**
- Distance from their location (computed in real-time)
- Time remaining until offer expires (red if < 3 hours)
- Price (or "Kostenlos" badge)
- Categories (Backwaren, Obst, etc.)

### Company / Poster (Bakery, Supermarket, Private Individual)

Posts surplus food before it expires.

**Journey:**
1. Opens app → taps "Erstellen" (+ tab)
2. Fills in: title, description, address, price, expiry window, contact
3. Taps "Veröffentlichen" → offer appears in feed

**What the company needs (some not yet built):**
- Fast offer creation (form has ≤5 required fields)
- View how many students saw/saved the offer
- See CO₂ savings per offer

### Platform (future role)

Moderates listings and users.

- Verifies user accounts (not yet implemented)
- Removes abusive listings
- Manages ratings system (not yet implemented)

---

## 11. Stakeholder Interactions

```
                    ┌──────────────────────────────────┐
                    │           FoodShare App           │
                    │                                   │
   STUDENT ─────────►  Browse / Filter / Search         │
                    │         ↓                         │
                    │  Map View (Leaflet)                │
                    │         ↓                         │
                    │  Listing Detail                   │
                    │         ↓                         │
   PROVIDER ◄───────── Contact (Phone / Message)        │
                    │                                   │
   COMPANY ─────────►  Create Offer Form                │
                    │         ↓                         │
                    │  Offer visible in feed & map      │
                    │         ↓ (future)                │
   COMPANY ◄────────── Analytics: views, saves, CO₂    │
                    │                                   │
   PLATFORM ─────────►  (future) Auth, moderation      │
                    │                                   │
                    └──────────────────────────────────┘
                               │ (future)
                    ┌──────────▼──────────┐
                    │   Backend API        │
                    │   Database           │
                    │   Auth Provider      │
                    │   Push Notification  │
                    └──────────────────────┘

   External services used today:
   ┌──────────────────────┐   ┌──────────────────┐
   │ OpenStreetMap Tiles  │   │ Unsplash (images) │
   │ (map rendering)      │   │ (listing photos)  │
   └──────────────────────┘   └──────────────────┘
```

---

## 12. App Usage Flows

### Flow A: Student finds food on the map

```
Open app
  │
  ├─ Geolocation dialog appears: "Allow location?"
  │     ├─ Allow → listings sort by distance, map centres on user
  │     └─ Deny  → fallback banner, listings in default order
  │
  ├─ Tap "Karte" tab (bottom nav)
  │     └─ Map loads, 6 markers visible + blue dot for user
  │           └─ Tap a marker → Popup shows title + address
  │                 └─ Tap again (click handler) → /listing/:id
  │
  └─ On detail page:
        ├─ See time remaining, distance, price, categories
        └─ Tap "Jetzt anrufen" or "Nachricht senden"
```

### Flow B: Student finds food in the list

```
Open app (Home)
  │
  ├─ Search "Brot" → filtered to bakery listings
  ├─ Tap filter "Läden" → only store listings
  └─ Tap a card → detail page → contact
```

### Flow C: Company posts a surplus offer

```
Tap "Erstellen" (+ tab)
  │
  ├─ Select "Laden/Geschäft"
  ├─ Fill: title, description, address, price, expiry hours, contact
  └─ Tap "Veröffentlichen"
        ├─ Validation error if fields missing → toast
        └─ Success → toast "Angebot erfolgreich erstellt!" → redirect Home
              └─ (⚠️ offer not actually saved yet — no backend)
```

---

## 13. Testing

**Framework:** Vitest + @testing-library/react + jsdom

**Run:** `npm run test:run`

**Current results: 10 test files, 80 tests, all passing**

| File | Tests | What it covers |
|---|---|---|
| `ac1-geolocation-hook.test.ts` | 7 | Hook state machine (idle, loading, success, denied, unavailable, no-API) |
| `ac2-location-permission-ui.test.tsx` | 7 | Banner renders/hides, button click, loading state, disabled state |
| `ac3-listing-coordinates.test.ts` | 20 | Listing type has lat/lng, all 6 listings within Berlin bounds, unique coords |
| `ac4-distance-sort.test.tsx` | 3 | Sort order (id 1 closest, id 4 furthest, Home page renders in order) |
| `ac5-distance-display.test.tsx` | 4 | Computed vs. fallback distance, `data-testid`, 1-decimal format |
| `ac6-ac7-map-view.test.tsx` | 7 | MapContainer renders, TileLayer, 6 markers, marker coordinates, click navigation |
| `ac8-location-fallback.test.tsx` | 7 | Renders for denied/unavailable, hidden for success/idle, retry button |
| `haversine-distance.test.ts` | 6 | Zero distance, ~111km/degree, symmetry, Berlin→Munich |
| `student-category-filter.test.ts` | 9 | Existing filter logic for store/private type filter |
| `student-reminder.test.ts` | 6 | Reminder service contract (specification test) |

**Note on react-leaflet testing:** Leaflet cannot run in jsdom (it requires real DOM measurements). The `ac6-ac7` test file mocks both `leaflet` and `react-leaflet` entirely, replacing them with simple `<div>` elements that carry the expected `data-testid` attributes.

---

## 14. Known Limitations and Next Steps

### Hard limits of the current prototype

| Issue | Impact | Fix |
|---|---|---|
| No backend | Offers don't persist; new offers vanish on refresh | Build REST API + database |
| No auth | Anyone can see everything; no user identity | Add auth provider (e.g. Supabase, Firebase) |
| Mock coordinates | Listings are all near HTW — not real data | Geocode real addresses on offer creation |
| No real image upload | Upload button is a placeholder | Connect to storage (S3, Supabase Storage) |
| No reservation system | No way to "claim" a listing | Add reservation model + conflict handling |

### Recommended next steps (priority order)

1. **User location marker on map is shown** ✅ done
2. **Add user location to ListingDetail** — show distance on the detail page too
3. **Geocoding on AddListing** — when a company types an address, resolve it to lat/lng via Nominatim (free, no API key)
4. **Backend (Supabase recommended)** — gives auth, database, real-time, storage in one free tier
5. **Reservation flow** — "Reservieren" button on detail page, status tracking
6. **Ratings** — prompted 1–3 days after pickup, displayed as stars on cards
7. **CO₂ calculator** — simple lookup table: kg food × emission factor per category
8. **Push notifications** — Web Push API for pickup reminders
