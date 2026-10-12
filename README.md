# Will Power EV Platform

> Power Every Journey.

Will Power is a Ghana-focused EV charging and fleet platform built with React/Vite for the responsive web workspace and React Native/Expo for mobile drivers. It is powered by an Express/OCPP backend with Moolre Ghana SMS OTP, Ghana Mobile Money, persistent wallets, fleet data, and charging-session telemetry.

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

### Mobile driver app

    cd expo-mobile
    npm install
    npm run tunnel

## Core Specifications

- Currency: Ghana Cedi (GH₵ / GHS)
- Web identity: Will Power, using Will Lime, Obsidian, Warm Paper, and Deep Green.
- SMS gateway: Moolre Ghana API.
- Payments: MTN MoMo, Telecel Cash, Mastercard, wallet top-ups, and escrow settlement.
- Persistence: atomic JSON store at data/users.json.
- Hardware protocol: OCPP 1.6J charger compatibility with OCPP 2.0.1 CSMS architecture.
