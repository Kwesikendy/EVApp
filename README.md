# Wilpower EV Platform

> Power Every Journey.

Wilpower is a Ghana-focused EV charging and fleet platform built with React/Vite for the responsive web workspace and React Native/Expo for mobile drivers. It is powered by an Express/OCPP backend with Moolre Ghana SMS OTP, Paystack GHS checkout, persistent wallets, fleet data, and charging-session telemetry.

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

The built-in first-login credentials are:

    Email: admin@wilpower.local
    Password: WilpowerLocalAdmin!2026

After signing in with the initial password, the portal requires you to choose a new password of at least 12 characters. For a custom administrator identity, set `WILPOWER_ADMIN_EMAIL`, `WILPOWER_ADMIN_PASSWORD`, and `WILPOWER_ADMIN_SESSION_SECRET` in the server environment.

For Vercel, add those three variables under Project Settings -> Environment Variables for the Production environment, then redeploy. Your hosted admin URL is:

    https://your-vercel-domain.vercel.app/admin

The Vercel deployment exposes the admin API through `api/admin/[...path].ts`, using the API-local auth helper in `api/_adminAuth.ts`. Admin station and telemetry data on Vercel currently reflects the serverless runtime snapshot; persistent admin audit and station management are still roadmap work.

The normal driver workspace now includes a Profile page from the sidebar and account card. Drivers can save their name, email, Ghana Card or Driver ID, profile photo, EV garage, payment preference, charge limit, and SMS receipt preference. Profile updates are written through `/api/user/profile` and persisted in the JSON user store used by the backend.

### Paystack payments

The web wallet uses Paystack hosted checkout. Add `PAYSTACK_SECRET_KEY` and `PAYSTACK_CALLBACK_URL` to the server/Vercel environment, then configure the Paystack dashboard webhook URL as:

    https://your-vercel-domain.vercel.app/api/paystack/webhook

Use a `sk_test_...` key while testing and a `sk_live_...` key only for production. The secret key must remain server-side. The app verifies the transaction status, GHS currency, amount, and reference before crediting the wallet. It also prevents the same reference from being credited twice.

### Mobile driver app

    cd expo-mobile
    npm install
    npm run tunnel

## Core Specifications

- Currency: Ghana Cedi (GH₵ / GHS)
- Web identity: Wilpower, using Will Lime, Obsidian, Warm Paper, and Deep Green.
- SMS gateway: Moolre Ghana API.
- Payments: Paystack hosted checkout for GHS card/mobile-money payments, legacy MTN MoMo and Telecel Cash flows, wallet top-ups, and escrow settlement.
- Persistence: atomic JSON store at data/users.json.
- Hardware protocol: OCPP 1.6J charger compatibility with OCPP 2.0.1 CSMS architecture.
