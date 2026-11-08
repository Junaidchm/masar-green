# Masar Green

A working, bilingual Dubai mobility **concept prototype**. Routes, transit
positions, NOL balances, PIN sign-in, verification, credits, partners and cash
values are simulated. It is **not affiliated with RTA, NOL or any government
entity**. Do not enter a real card number or real PIN.

## Run

Use Replit's **Run** control to start the managed app and API together. The app
opens at `/` and the API is served at `/api`. On first API startup the SQLite
database is automatically created and seeded; no manual migration is needed.

For local development outside Replit:

```sh
pnpm install
# From artifacts/api-server:
PORT=8080 SESSION_SECRET=<a-long-random-secret> pnpm dev
# In a second terminal, from artifacts/masar-green:
PORT=5173 BASE_PATH=/ pnpm dev
```

The local frontend and `/api` must be routed through one HTTPS origin (as Replit
does automatically). Cookies are Secure, HTTP-only, SameSite=Lax. Plain HTTP
LAN access is not a supported authentication setup.

## Demo sign-ins

| Role / commuter | Simulated card | PIN |
|---|---|---|
| Amina, regular metro commuter | `12345678` | `1111` |
| New commuter, empty history and onboarding | `87654321` | `2222` |
| Omar, frequent commuter and high wallet balance | `11223344` | `3333` |
| Emirates Future Labs employer admin | `55667788` | `4444` |
| City analyst | `99887766` | `5555` |

You can preview Amina's seeded dashboard without signing in. Preview is
explicitly labelled; earning, redeeming, changing settings and reports require a
session. An unrecognised 8–10 digit card creates a **demo-only** account with the
provided 4-digit PIN, then asks for onboarding and explicit consent.
This does not prove card ownership.

## Main workflows

- Search 42 Dubai destinations, compare six conceptual multimodal routes, sort
  by cost/time/crowding/carbon and filter for step-free access.
- Explore Leaflet/OpenStreetMap maps with five-second server-simulated vehicle
  updates and transport layers. Route geometry is schematic, not navigation
  or directions suitable for real travel.
- Start a consented simulated trip; explicitly simulate tap-out to finish it
  immediately. Missing tap-out, implausible GPS, impossible speeds or repeated
  trips produce pending review with no credit. **There is no automatic real
  NOL tap-out or background GPS tracking.**
- See carbon savings, weekly charts, badges and weekly challenge bonuses.
- Redeem credits for simulated NOL top-up, partner QR vouchers or tree/solar
  donations. Bank withdrawal is a confirmation-only **coming soon** flow:
  no bank details are collected and no credit is debited.
- Employer/city demo accounts see role-protected aggregates and downloadable
  reports. Groups with fewer than five people are suppressed. Employer output
  never contains individual trip locations. City locations are coarsened.
- Change English/Arabic, RTL, dark mode, consent and notification preferences.
  Notification preference is saved; push delivery is not connected.
- Delete journey history or download your own data. Deletion retains financial
  ledger entries without journey descriptions and non-reversible anti-abuse
  fingerprints; it does not erase previously earned wallet value.
- Install the PWA where the browser supports it. Web NFC support varies; the
  optional read only helps enter a demo card and never authenticates a real NOL
  card. Maps require an internet connection.

## Carbon and cash-value formula

Configuration: `artifacts/api-server/src/masar/carbon.ts`.

```text
baseline kg CO₂ = route distance km × 0.17
actual kg CO₂   = sum(leg distance km × leg-mode factor)
saved kg CO₂    = max(0, baseline − actual)
Green Credits  = floor(saved kg CO₂ × 10)
AED value      = Green Credits ÷ 100
```

| Mode | kg CO₂ / passenger-km |
|---|---:|
| Solo petrol car / taxi | 0.17 |
| Bus | 0.07 |
| Metro / tram | 0.03 |
| Water taxi | 0.10 |
| Bike / e-scooter / walking | 0 |

These are illustrative assumptions, not certified UAE emissions factors.
The source and caveats are commented in the config. Trees equivalent divides
savings by 21.77 kg CO₂/tree-year; it is an illustrative comparison, **not**
evidence that trees have been planted or carbon offsets purchased.

The mock verification threshold is 75/100. Accelerated simulation can score 95:
mock start tap 40, mock end tap 40, simulated plausibility 15. A maximum 500
trip credits can be earned per Gulf Standard Time day. Repeating the same
route/direction within two hours is flagged. End requests cannot credit a trip
twice. Challenges are separately claimable once per week. Credits expire after
12 calendar months; spending consumes the oldest-expiring credit lots first.

## Structure

This project keeps the supplied pnpm workspace structure rather than moving
shared libraries or services into duplicate `/client` and `/server` folders:

- **Client:** `artifacts/masar-green/src/` — React, Vite, TypeScript, Tailwind,
  Leaflet, Recharts, bilingual controls and PWA.
- **Server:** `artifacts/api-server/src/masar/` — Express routes, auth,
  SQLite schema/seeding, carbon engine, trip verification and rewards.
- `lib/api-spec/openapi.yaml` — single source of truth for the REST API.
- `lib/api-client-react/` and `lib/api-zod/` — generated hooks/types/validators.
- `data/masar-green.sqlite` — auto-created local data, excluded from Git and
  deployment bundles. Never store real financial records in this prototype.

The database includes users, cards, trips, trip legs, credit ledger, redemptions,
partners, challenges, user challenges, badges, employers, members, stations,
routes and live vehicles. Amina, Omar and anonymised demo colleagues have
60 days of realistic trip history; the new account deliberately has no trips.

## Environment variables

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Required strong signing secret, stored in Replit Secrets |
| `PORT` | Assigned per service by the managed workflow |
| `BASE_PATH` | Assigned frontend routing prefix, `/` for this app |
| `NODE_ENV` | Production/development logging and build behaviour |
| `LOG_LEVEL` | Optional server logging level |

No transport API keys, payment credentials or real bank accounts are used.
PINs are hashed with bcrypt; JWT sessions use a revocable server-side session
record plus secure cookies. Sign-in is rate-limited per IP and per card.
Responses never include PIN hashes or session tokens.

## Development checks

```sh
pnpm run typecheck
pnpm --filter @workspace/api-spec run codegen
```

Run codegen after changing the OpenAPI spec. Use the existing managed workflows,
not a second dev server on another port.

## Replacing simulated data with real services

1. Obtain appropriate permissions and usage terms for RTA open data/GTFS.
   Replace seeded station/route tables with scheduled GTFS stops, trips,
   calendars, stop_times and transfers. Route with an actual multimodal graph
   such as OpenTripPlanner; do not treat the schematic prototype as navigation.
2. Ingest an authorised GTFS-Realtime or provider AVL feed instead of the
   five-second vehicle simulator. Display stale/feed-failure states.
3. Use an approved NOL/card-linking integration with provider-backed ownership
   verification. Never use this prototype's local PIN system with real cards.
4. Replace mock tap/GPS scoring with signed provider tap events, consented
   location checks, replay protection, manual review and fraud monitoring.
5. Validate local lifecycle/fleet/occupancy factors before claiming actual
   carbon reductions. Obtain compliance/accounting advice before monetary
   redemptions, expiry rules, cash withdrawal or employer ESG reporting.
6. Replace local SQLite with durable production storage and implement backups,
   migrations, retention and audit controls before multi-instance hosting.
   Local prototype data should not be assumed to survive a new published build.
7. Connect real partner fulfillment and payments only after explicit setup;
   implement idempotency, reconciliation and refund/error handling.

**Concept prototype. Not affiliated with RTA, NOL or any government entity.
Data is simulated.**
