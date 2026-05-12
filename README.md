# ParkSync — Smart Parking Platform

Full-stack web platform for finding, reserving, and managing parking spots in real time. Includes wallet payments, CO2 impact scoring, waitlists, and 2D/3D spot visualization.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express · TypeORM · PostgreSQL |
| Frontend | React · TypeScript · Vite · Material UI |
| Maps | Google Maps Platform |
| Real-time | Server-Sent Events (SSE) |
| Cache | Redis (optional) |

## Features

- Parking lot search via Google Maps Places API or database fallback
- Real-time spot availability with SSE updates
- Reservation management — create, extend, auto-extend
- Waitlist for full lots
- Wallet balance and transaction history
- CO2 impact scoring and eco ranking per reservation
- 2D floor plan visualization with per-spot status
- 3D/AR demo components (GLB + model-viewer)
- Voice assistant for search and navigation (Web Speech API)
- Admin dashboard with analytics and listing management
- EV charger and amenity indicators

## Project Structure

```
ParkSync/
├── Backend/        # Express + TypeORM API server
├── frontend/       # React + Vite web app
└── Documentation/  # SRS, architecture, and design artifacts
```

## Getting Started

**Requirements:** Node.js, PostgreSQL, Redis (optional)

```bash
# Backend
cd Backend
npm install
# Configure .env with DATABASE_URL, REDIS_URL, GOOGLE_MAPS_API_KEY
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```
