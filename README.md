# Wilpower EV Platform

> Power Every Journey.

Wilpower is a Ghana-focused EV charging and fleet platform built with React/Vite for the responsive web workspace and React Native/Expo for mobile drivers. It is powered by an Express/OCPP backend with Moolre Ghana SMS OTP, Ghana Mobile Money, persistent wallets, fleet data, and charging-session telemetry.

## Quick Navigation

- PROJECT_CONTEXT.md: architecture, API contracts, persistence, and current implementation state.
- ROADMAP.md: delivery scorecard and remaining production work.
- Willpower.zip: supplied brand and product experience handoff.

## Quick Start

### Backend and web workspace

    npm install
    npm run dev

The server runs on http://0.0.0.0:5173.

### Production build

    npm run build

### Admin operations portal

The driver workspace and administrator workspace are separate interfaces. Start the backend with `npm run dev`, then open:

    http://localhost:5173/admin

For local development only, sign in with:

    Email: admin@wilpower.local
    Password: WilpowerLocalAdmin!2026

Before deployment, set `WILPOWER_ADMIN_EMAIL`, `WILPOWER_ADMIN_PASSWORD`, and `WILPOWER_ADMIN_SESSION_SECRET` in the server environment. The local fallback credentials are disabled when `NODE_ENV=production`.

For Vercel, add those three variables under Project Settings -> Environment Variables for the Production environment, then redeploy. Your hosted admin URL is:

    https://your-vercel-domain.vercel.app/admin

The Vercel deployment exposes the admin API through `api/admin/[...path].ts`. Admin station and telemetry data on Vercel currently reflects the serverless runtime snapshot; persistent admin audit and station management are still roadmap work.

### Mobile driver app

    cd expo-mobile
    npm install
    npm run tunnel

## Core Specifications

- Currency: Ghana Cedi (GH₵ / GHS)
- Web identity: Wilpower, using Will Lime, Obsidian, Warm Paper, and Deep Green.
- SMS gateway: Moolre Ghana API.
- Payments: MTN MoMo, Telecel Cash, Mastercard, wallet top-ups, and escrow settlement.
- Persistence: atomic JSON store at data/users.json.
- Hardware protocol: OCPP 1.6J charger compatibility with OCPP 2.0.1 CSMS architecture.
