# 3D / AR Demo — Parking Interactivity

This file explains how the interactive 3D/AR demo works and how to test it locally.

## Features added
- Procedural parking layout rendered with `@react-three/fiber`.
- Animated cars and environment via `@react-three/drei`.
- Per-spot interactivity: hover to highlight, click to select, visual status (available/reserved/occupied).
- Reserve a spot via the app: uses the backend `POST /api/reservation` endpoint and requires authentication.
- Export scene to GLB (runtime export) and view in AR using `<model-viewer>` (Android/WebXR or Scene Viewer on Android).

## How to test locally
1. Start backend server (defaults to http://localhost:3000) and ensure it is seeded with a `ParkingLot` (id=1 is used in the demo). Make sure your user is authenticated in the frontend (login).
2. Start frontend (`npm start`) and log in.
3. Open `/parking-3d` route.
4. Click spots in the 3D view to select them; the side panel will show spot info and a Reserve button.
5. Click Reserve to create a reservation (1 hour by default) — the app calls `POST /api/reservation` and will update the spot status on success.
6. To use AR: click **Export scene to AR** on the 3D slide, then switch to the AR slide and place the model on a supported device.

## Notes
- iOS Quick Look requires a `.usdz` file. A conversion step (GLB → USDZ) is not implemented yet.
- The `createReservation` call attaches the currently logged-in user and will require authentication headers (token stored in `localStorage.token`).
- For real parking lots, pass the real `parkingLot` id and spot ids from the backend into `Parking3D` as `initialSpots` and the `parkingLot` id in `ParkingDemo`'s reservation flow.

