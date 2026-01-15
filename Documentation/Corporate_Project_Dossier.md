# ParkSync Corporate Project Dossier

As of 2026-01-06 (generated from full repo scan)

## 1) Executive Summary
ParkSync is a smart parking platform that combines real-time lot discovery, reservations, payments, wallet credits, CO2 impact scoring, and immersive 2D/3D/AR visualization of parking spots. The codebase is organized as a full-stack web product with:
- Backend: Node.js + Express + TypeORM + PostgreSQL + Redis (optional), with SSE for real-time spot availability
- Frontend: React + TypeScript + Vite + MUI, Google Maps, voice assistance, and 3D/AR demos

The repo also includes extensive product documentation (SRS, architecture, and flow diagrams) describing a broader roadmap (CV-based spot detection, queue guarantees, marketplace, and AR navigation). Some of those features are partially implemented or intentionally deprecated in the current code.

## 2) Product Vision vs. Current Implementation
### 2.1 Vision (from Documentation folder)
Core differentiators described in the long-form docs:
- Guaranteed parking via queue + reassignment logic
- Auto-billing on overstay (no penalty)
- Wallet compensation for inconvenienced users
- CO2 impact scoring and eco ranking
- AR navigation to exact spot
- Marketplace for private owners
- Potential CV-based spot detection (CCTV/IoT)

### 2.2 Current Implementation Snapshot (source-of-truth: code)
Implemented:
- Parking search (Google Maps Places API or DB fallback)
- Lot detail view with EV chargers, amenities, CO2 badges
- 2D spot visualization with floor segmentation
- Reservation creation and management
- Payment record creation (no live gateway integration)
- Wallet balance and transactions
- Waitlist for full lots
- Auto-extend and manual extend of reservations
- Real-time SSE updates for spot availability
- 3D/AR demo components (GLB export + model-viewer)
- Voice assistant (Web Speech API) for navigation/search
- Admin pages (analytics, listing management)

Deprecated or missing vs. docs:
- Queue feature is removed (documented in implementation-status.md)
- Computer Vision ingestion is not implemented
- Marketplace exists, but payouts are stored as JSON in contact_info; no payout system
- Payment gateways (Stripe) are not wired to actual charge flows
- OAuth is implemented for Google login, but key management is manual

## 3) Repository Inventory
Top-level structure:
- `ParkSync/Backend`: Express + TypeORM API server
- `ParkSync/frontend`: React + Vite web app
- `ParkSync/Documentation`: SRS and design artifacts (docx/txt/md)
- `ParkSync/uploads` and `ParkSync/Backend/uploads`: placeholder upload storage
- `.vscode` workspace settings

Generated or vendor-heavy folders present (not expanded here):
- `Backend/node_modules`, `Backend/dist`
- `frontend/node_modules`, `frontend/build`, `frontend/dist`

## 4) System Architecture (Actual Code)
### 4.1 Backend Architecture (Express + TypeORM)
- Entry point: `Backend/src/main.ts`
- Database: PostgreSQL via TypeORM
- Cache: Redis if configured, else in-memory fallback
- Real-time updates: SSE endpoints for availability snapshots/deltas
- Security: helmet, rate-limiting, XSS sanitization, CORS

### 4.2 Frontend Architecture (React + Vite)
- Single-page app with route guards
- Auth context with JWT token in localStorage
- Integration with Google Maps and OAuth
- 2D visualization for spot status, 3D/AR demo components
- Service worker (opt-in via `VITE_ENABLE_SW`)

## 5) Backend Details
### 5.1 Tech Stack
- Node.js + Express
- TypeScript
- TypeORM
- PostgreSQL
- Redis (optional)
- JWT auth
- Nodemailer (reservation reminders)
- Stripe SDK installed (but not wired to charging)

### 5.2 Core Runtime
File: `Backend/src/main.ts`
- Middleware: helmet, rate limiters, XSS sanitization
- CORS: allows localhost origins, blocks others
- Routes:
  - `/api/auth`, `/api/parking`, `/api/payment`, `/api/reservation`, `/api/user`, `/api/co2`, `/api/listings`, `/api/waitlist`, `/api/analytics`, `/api/wallet`
- Health check: `GET /health` with DB connection status
- Reservation lifecycle background service starts on boot

### 5.3 Security & Middleware
- `helmet` CSP with Google Maps + OAuth allowances
- `express-rate-limit` (general + auth endpoints)
- `xss` sanitization of request body
- JWT validation in `middleware/auth.middleware.ts`

### 5.4 Caching + SSE
- `Services/cache.service.ts` connects to Redis if configured
- SSE endpoint: `GET /api/parking/stream`
  - Supports optional `?lotId=...`
  - Events: `snapshot`, `delta`, `ping`
  - Polling interval: `PARKING_SSE_INTERVAL_MS`
  - Cache keys: `parking:availability:snapshot`, `parking:availability:version`, `parking:availability:lot:{id}`

### 5.5 Reservation Lifecycle
File: `Services/reservation-lifecycle.service.ts`
- Runs every 60s
- Sends reminder emails 10 minutes before reservation end
- Auto-extends reservations based on user settings
- Uses `PaymentService` to record extension charges

### 5.6 Modules and Responsibilities
- Auth: `Routes/auth.route.ts`, `Services/auth.service.ts`
- Parking: `modules/parking/*` (search, SSE, photo proxy)
- Reservations: `modules/reservations/*` (auto-extend, extend, end)
- Payments: `modules/payments/*` (CRUD, record creation)
- Listings: `modules/listings/*` (marketplace listings + reserve listing)
- Wallet: `Controllers/wallet.controller.ts`, `Services/wallet.service.ts`
- Analytics: `Controllers/analytics.controller.ts`
- Waitlist: `Controllers/waitlist.controller.ts`
- CO2: `Controllers/co2.controller.ts`, `Services/co2.service.ts`

### 5.7 Data Model (TypeORM Entities)
- `ParkingLot`
  - Fields: name, location, pricePerHour, availability, floors, amenities, coords, distance_km, ratings
  - CO2 fields: co2_estimated_g, co2_savings_pct, is_lowest_co2
  - Dynamic pricing flags: dynamic_pricing_enabled, surge_multiplier
- `ParkingSpot`
  - Fields: spot_number, status, type, floor_level, position_x/y
  - Runtime-only: nextReservation
- `Reservation`
  - Fields: startTime, endTime, reservedEndTime, autoExtend fields, reminderSentAt, endedAt
  - Relations: user, parkingLot, listing, payments, spot
  - Contact: contactName, contactEmail
- `Payment`
  - Fields: amount, method
  - Relations: user, reservation
- `User`
  - Fields: name, email, password, role
  - Relations: reservations, payments, wallet
- `Listing`
  - Fields: title, description, pricePerHour, location, coords, imageUrl, isPrivate, isActive, contact_info, createdAt
- `EVCharger`
  - Fields: connector_type, power_kw, cost_per_kwh, availability, charger_id
- `Wallet`
  - Fields: balance, currency
  - Relations: user, transactions
- `WalletTransaction`
  - Fields: amount, type, description, date, reservation_id
- `WaitlistEntry`
  - Fields: parkingLot, user, contact_email, phone, status, createdAt

Deprecated entities are preserved as placeholders:
- `future-queue.entity.ts`, `queue-status.entity.ts`

### 5.8 Database Config
File: `Backend/src/config/database.config.ts`
- TypeORM config reads env vars, defaults to localhost Postgres
- Synchronize defaults to true unless `DB_SYNC=false`

### 5.9 Migrations & Seeds
- `src/migrations/1763329769561-UpdatedSchema.ts`
- `src/migrations/1763329769562-CreateFutureQueue.ts` (legacy queue)
- `src/seed.ts` and `src/Utils/seed.ts` create sample lots, EV chargers, spots
- `src/seeds/seed-spots.ts` generates grid-based spots for existing lots

### 5.10 Testing
- Jest test suite in `Backend/test`
- Tests cover: parking service nextReservation attachment, listings controller/service
- Queue tests are skipped (feature removed)

### 5.11 Scripts
- `npm run start` / `npm run dev`: ts-node-dev runtime
- `npm run build`: compile with tsconfig.build
- `npm run test`: jest
- `npm run mem:usage`: runs `scripts/memory-usage.js` to report heap and Redis memory

## 6) Backend API Surface (Actual)
Note: Auth protected endpoints require `Authorization: Bearer <JWT>`.

### 6.1 Auth
- `POST /api/auth/register` (name, email, password, role?)
- `POST /api/auth/login` (email, password)
- `POST /api/auth/google-login` (token)
- `GET /api/auth/me` (auth required)
- `POST /api/auth/validate` (token)

### 6.2 Parking
- `GET /api/parking` (params: lat, lng, radius, search, includeReservations, page, limit)
- `GET /api/parking/:id` (includeReservations supported)
- `POST /api/parking` (create lot)
- `PUT /api/parking/:id`
- `DELETE /api/parking/:id`
- `GET /api/parking/stream` (SSE, optional lotId)
- `GET /api/parking/photo` (proxy; requires ref query)

### 6.3 Reservations
- `GET /api/reservation/my-bookings` (auth)
- `GET /api/reservation` (admin)
- `GET /api/reservation/:id` (auth + owner/admin)
- `POST /api/reservation` (auth)
- `PUT /api/reservation/:id` (auth + owner/admin)
- `DELETE /api/reservation/:id` (auth + owner/admin)
- `POST /api/reservation/:id/auto-extend` (auth)
- `POST /api/reservation/:id/extend` (auth)
- `POST /api/reservation/:id/end` (auth)

### 6.4 Payments
- `GET /api/payment` (auth)
- `GET /api/payment/:id` (auth)
- `POST /api/payment` (auth)
- `PUT /api/payment/:id` (no auth guard in route)
- `DELETE /api/payment/:id` (no auth guard in route)

### 6.5 Listings (Marketplace)
- `GET /api/listings`
- `GET /api/listings/:id`
- `POST /api/listings`
- `PUT /api/listings/:id`
- `DELETE /api/listings/:id`
- `POST /api/listings/:id/reserve` (auth)

### 6.6 Wallet
- `GET /api/wallet` (auth)
- `POST /api/wallet/top-up` (auth)
- `POST /api/wallet/apply` (auth)

### 6.7 Analytics
- `GET /api/analytics/summary`

### 6.8 Waitlist
- `POST /api/waitlist`
- `GET /api/waitlist/:lotId`
- `POST /api/waitlist/:id/notify`

### 6.9 CO2
- `POST /api/co2/score`
- `POST /api/co2/compare` (mock data)

## 7) Frontend Details
### 7.1 Tech Stack
- React 18 + TypeScript
- Vite
- MUI (dark theme)
- Google Maps JS API + Places
- React Router v7
- Three.js + @react-three/fiber
- model-viewer for AR
- Swiper for 3D/AR demo

### 7.2 Routing
File: `frontend/src/App.tsx`
Public:
- `/` (Home)
- `/lot/:id` (LotDetail)
- `/login`, `/signup`
Protected:
- `/payment`, `/payment-success`, `/my-bookings`, `/wallet`
Admin:
- `/admin/dashboard`, `/admin/listings`, `/admin/create`, `/admin/analytics`
Debug:
- `/debug/memory`, `/debug/endpoints`

### 7.3 Key Pages
- Home: map + list, search, filters, listings carousel
- LotDetail: lot hero, amenities, spot selection, waitlist
- Payment: card entry simulation, wallet application, reservation creation
- PaymentSuccess: QR code, navigation, summary
- MyBookings: list + detail modal, auto-extend, end parking, navigation
- Wallet: balance, transactions, top-up flow
- Admin: listings and analytics
- Debug: endpoint catalog and memory metrics

### 7.4 Key Components
- `SpotVisualization`: 2D spot grid, multi-floor grouping, tooltips
- `Parking3D` + `ParkingAR`: procedural scene + GLB export
- `ParkingLot3D` + `SpotMarker` + `NavigationPath`: 3D lot layout with pathing
- `VoiceAssistant` + `VoiceContext`: speech-to-command navigation/search
- `EmbeddedNavigation`: embedded Google directions
- `ParkingLotCard` + `ListingCard`: list cards with badges
- `WalletDisplay`: lightweight wallet snippet

### 7.5 State & Auth
- `AuthContext` stores JWT and user data
- `AdminProtectedRoute` checks `user.role` + `admin_mode` flag
- Voice commands can trigger route navigation and search

### 7.6 Service Worker
File: `frontend/public/sw.js`
- Cache-first for static assets
- Network-first for `/api/` (same-origin only)
- Enabled via `VITE_ENABLE_SW=true`

### 7.7 Theme & UI
File: `frontend/src/theme.ts`
- Dark navy palette with teal/blue accents
- Custom button and card styles

## 8) Frontend API Clients
- `api/client.ts`: axios base with JWT and retry logic
- `api/parkingApi.ts`: direct axios to `/api/parking`
- `api/listingApi.ts`: listing CRUD + reserve listing
- `api/reservationApi.ts`: bookings + auto-extend + end
- `api/paymentApi.ts`: payment CRUD
- `api/walletApi.ts`: wallet + top-up
- `api/authApi.ts`: login/register/google login
- `api/analyticsApi.ts`: summary
- `api/waitlistApi.ts`: join waitlist
- `api/co2Api.ts`: CO2 score/compare



## 10) Operational Guidance
### 10.1 Local Development
Backend:
- `cd Backend && npm install`
- `npm run dev` (port 3000)
Frontend:
- `cd frontend && npm install`
- `npm run dev` (port 3001)

### 10.2 Ports
- Backend: 3000
- Frontend: 3001

### 10.3 Security
- CORS allows localhost only
- JWT required for protected routes
- Rate limiting disabled in dev

## 11) Documentation Artifacts
- `Documentation/project_doc.txt`: full SRS + architecture + roadmap
- `Documentation/Full Project Documentation Smart Parking System.docx`: same content with diagrams and PlantUML blocks
- `Documentation/implementation-status.md`: queue feature removal record

## 12) Gaps, Deprecated Features, and Risks
### 12.1 Deprecated
- Queue and future-queue features removed across backend and frontend

### 12.2 Feature Gaps vs. Docs
- CV ingestion not implemented
- Queue reassign/wallet compensation flows are not active
- Real payment gateway not wired (Stripe SDK present only)
- Several docs reference FastAPI/NestJS; actual backend is Express
- Frontend README is CRA-based and outdated relative to Vite

### 12.3 Notable Technical Risks
- Payment entity has no createdAt but analytics queries reference it
- Service worker only caches same-origin `/api` calls; API calls are cross-origin
- Google OAuth client ID is hardcoded in `frontend/src/App.tsx`

## 13) Appendix: Key File Index
### 13.1 Backend
- `Backend/src/main.ts`: server bootstrap
- `Backend/src/config/database.config.ts`: DB config
- `Backend/src/config/jwt.config.ts`: JWT config
- `Backend/src/Models/*.ts`: data schema
- `Backend/src/modules/*`: parking, reservations, payments, listings
- `Backend/src/Controllers/*`: analytics, co2, waitlist, wallet
- `Backend/src/Services/*`: auth, cache, email, reservation lifecycle, wallet
- `Backend/src/Utils/*`: CO2, pricing, distance, validation, seeding
- `Backend/src/migrations/*`: schema history
- `Backend/test/*`: Jest tests

### 13.2 Frontend
- `frontend/src/App.tsx`: routing
- `frontend/src/pages/*`: core screens
- `frontend/src/Components/*`: UI, 2D/3D/AR
- `frontend/src/context/*`: auth + voice
- `frontend/src/api/*`: API clients
- `frontend/src/types/*`: TS interfaces
- `frontend/public/sw.js`: service worker

### 13.3 Assets
- `frontend/public/models/*`: AR/3D model assets
- `frontend/public/mock-images/*`: fallback imagery
- `uploads/parking_photos`: placeholder storage

## 14) Recommended Next Steps (Optional)
- Decide whether to re-introduce queue flows or remove remaining placeholders
- Wire Stripe payments or remove unused Stripe deps
- Move secrets into runtime env and remove keys from repo
- Align documentation with current architecture (Express + Vite)

