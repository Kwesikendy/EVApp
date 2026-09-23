---
name: xcharge-platform
description: >-
  Comprehensive guide, runbook, and architectural cheatsheet for developing, running,
  testing, and extending the ChargeLink GH EV Platform (formerly XCHARGE). Covers Expo
  mobile app, Node/Express/Vite backend, Ghana Mobile Money payment switch (merchant:
  CHARGELINK GH LTD), Moolre SMS gateway, and OCPP 1.6J / 2.0.1 charging telemetry.
  First real station: Greenwood Event Center, Kumasi (MaxPower VCP160, OCPP 1.6J).
  Use this skill whenever working on ChargeLink GH features, mobile HUD, authentication,
  persistent wallets, station management, escrow settlements, or OCPP charging sessions.
---

# XCHARGE EV Platform Skill

This skill provides the definitive engineering reference and operational workflows for the **XCHARGE EV Platform**, Ghana's premier electric vehicle charging and fleet operating system.

---

## 1. System Architecture & Tech Stack

```text
               ┌────────────────────────────────────────────────────────┐
               │              XCHARGE Hybrid Ecosystem                  │
               └──────────────────────────┬─────────────────────────────┘
                                          │
       ┌──────────────────────────────────┴──────────────────────────────────┐
       ▼                                                                     ▼
┌─────────────────────────────────┐                       ┌─────────────────────────────────┐
│     Expo Mobile Application     │                       │     Web Platform & Dashboard    │
│  React Native / Expo 57 (TS)    │                       │  React 19 / Vite 6 (Port 5173)  │
│  Folder: expo-mobile/           │                       │  Folder: src/ & public/         │
└────────────────┬────────────────┘                       └────────────────┬────────────────┘
                 │                                                         │
                 └────────────────────────┬────────────────────────────────┘
                                          │  REST & SSE APIs (Port 5173)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    Node.js / Express Backend Server    │
                      │    File: server.ts (Port 5173)         │
                      └────┬──────────────┬──────────────┬─────┘
                           │              │              │
         ┌─────────────────┘              │              └─────────────────┐
         ▼                                ▼                                ▼
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│  Moolre SMS OTP  │            │   MoMo Switch    │            │ Multi-User Store │
│  Gateway API     │            │  server/momo.ts  │            │ data/users.json  │
│  server/auth.ts  │            │  *170# / *110#   │            │ Persistent Disk  │
└──────────────────┘            └──────────────────┘            └──────────────────┘
```

### Core Components & Locations
- **Mobile Client**: [`expo-mobile/`](file:///d:/xcharge-ev-platform/expo-mobile) (React Native 0.86, Expo 57, TypeScript).
- **Backend API & CSMS Simulator**: [`server.ts`](file:///d:/xcharge-ev-platform/server.ts) running on Node 24 + Express + Vite middleware.
- **Web App**: [`src/`](file:///d:/xcharge-ev-platform/src/) (Leaflet dark map, full auth flow, chassis desktop wrapper).
- **Auth & Persistent Database**: [`server/auth.ts`](file:///d:/xcharge-ev-platform/server/auth.ts) and [`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json).
- **Ghana MoMo Switch**: [`server/momo.ts`](file:///d:/xcharge-ev-platform/server/momo.ts).
- **Single Source of Truth**: [`PROJECT_CONTEXT.md`](file:///d:/xcharge-ev-platform/PROJECT_CONTEXT.md) and [`ROADMAP.md`](file:///d:/xcharge-ev-platform/ROADMAP.md).

---

## 2. Inviolable Project Rules & Conventions

1. **Currency is ALWAYS Ghana Cedi (`GH₵` / `GHS`):**
   - Never use `$`, `€`, or generic currency signs. Always format amounts as `GH₵ XX.XX` or `GHS XX.XX`.
2. **Phone Number Standards:**
   - Always normalize Ghanaian phone numbers to international E.164 format: `+233XXXXXXXXX`.
   - Support input formats `024XXXXXXX`, `055XXXXXXX`, `233XXXXXXXXX`.
   - Function: `normalizeGhanaPhoneNumber(phone)` in [`server/auth.ts`](file:///d:/xcharge-ev-platform/server/auth.ts).
3. **Branding & Logos:**
   - **Never** render raw text `✕` or generic icons for the logo. Always use `<XChargeLogoNative />` or `<XChargeMarkNative />` from [`expo-mobile/XChargeLogoNative.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/XChargeLogoNative.tsx).
   - **Never** use placeholder text or broken image tags for payment gateways. Always use vector components from [`expo-mobile/PaymentLogosNative.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/PaymentLogosNative.tsx) (`MtnMomoLogoNative`, `TelecelLogoNative`, `MastercardLogoNative`) and [`src/components/PaymentLogos.tsx`](file:///d:/xcharge-ev-platform/src/components/PaymentLogos.tsx).
4. **Hypercharge OS Design Tokens:**
   - Background: `#10141a` (Deep obsidian).
   - Surface: `#181c22` (Cards, sheets, inputs).
   - Accent / Primary: `#00f0ff` (Electric cyan).
   - Success: `#00e676` (Charging, verified).
   - Error: `#ff4d4d` (Faulted, sign out).
5. **Persistent Storage Requirement:**
   - Any modification to user profiles, vehicles, wallet balance, escrow holds, or transaction logs MUST be committed to disk via `saveUsersToDisk()` in [`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json).
6. **Backend Port is 5173:**
   - Server runs on `http://0.0.0.0:5173` (not 3000 to avoid OS port conflicts).

---

## 3. Standard Operational Workflows

### Running the Environment
```bash
# 1. Start backend server (root directory)
npm run dev

# 2. Start Expo mobile client with tunnel (separate terminal)
cd expo-mobile
npm run tunnel

# 3. Rebuild production bundle (Web & Server)
npm run build

# 4. Mobile TypeScript validation
cd expo-mobile
npx tsc --noEmit
```

### Git & Deployment Workflows
- **Remote**: `https://github.com/Kwesikendy/EVApp.git` on branch `main`.
- **GitHub Pages**: Deploy via `npx gh-pages -d dist`.
- **Vercel**: Import repository root using [`vercel.json`](file:///d:/xcharge-ev-platform/vercel.json).

---

## 4. Payment & Escrow Engine Specifications

### Pre-Authorization Escrow Lifecycle
1. **Security Hold (`POST /api/ocpp/remote-start`)**:
   - Flat security deposit: `GH₵ 25.00` held from driver's available balance.
   - `availableBalance = availableBalance - 25.00`
   - `heldEscrow = heldEscrow + 25.00`
   - Logs `PREAUTH_HOLD` transaction.
2. **Active Telemetry**:
   - `accruedCost = kwhDelivered * tariffPerKwh` (e.g. `3.80` or `4.20` GH₵/kWh).
3. **Session Stop & Settlement (`POST /api/ocpp/remote-stop`)**:
   - `actualCost = accruedCost`
   - `heldEscrow = 0`
   - If `actualCost < holdAmount`:
     - Automatic refund: `walletBalance += (holdAmount - actualCost)`.
   - If `actualCost >= holdAmount`:
     - Charge difference: `walletBalance -= (actualCost - holdAmount)`.
   - Logs `PREAUTH_RELEASE` and `CHARGE_SETTLEMENT` transactions to [`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json).

### Mobile Money USSD Push Formats
- **MTN MoMo**: `Authorize payment of GHS XX.XX to XCHARGE GHANA LTD? Ref: GH-MTN-XXXXXX. Enter Mobile Money (*170#) PIN:`
- **Telecel Cash**: `Authorize payment of GHS XX.XX to XCHARGE GHANA LTD? Ref: GH-TELECEL-XXXXXX. Enter Telecel Cash (*110#) PIN:`
- **Webhook Ingress**: `POST /api/momo/webhook` handles asynchronous telco status updates (`status: 'success'`).

---

## 5. Active Roadmap Phases

- **Phase 1: Real Telephony, Auth & Persistence** — **100% Complete & Verified**.
- **Phase 2: Live Payment Switch & Dynamic Escrow** — **100% Complete & Verified**.
- **Phase 3: Hardware Ingress (OCPP 2.0.1 WebSocket Server)** — **Next Priority**:
  - Mount WebSocket endpoint: `wss://.../ocpp/2.0.1/{stationId}`.
  - Implement bidirectional OCPP 2.0.1 message router (`BootNotification`, `StatusNotification`, `Heartbeat`, `TransactionEvent`, `MeterValues`).
- **Phase 4: Station Operator Web Dashboard & Standalone Mobile Builds**:
  - Station revenue analytics in GH₵, live stall monitor, and fleet management.
  - Standalone Android APK export via EAS Build.
