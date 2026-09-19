# XCHARGE EV Platform — Complete Project Context & Architecture

> **Notice:** This document is the single source of truth for the XCHARGE project. Any AI assistant or developer picking up this repository should read this document first to get up to speed instantly.

---

## 1. Executive Summary

**XCHARGE** is Ghana's first high-speed electric vehicle charging and commercial fleet operating system. It provides real-time OCPP 2.0.1 telemetry, map navigation across Accra and major Ghanaian corridors, Mobile Money split-wallets (MTN MoMo & Telecel Cash), dynamic pre-authorization escrow, and fleet vehicle management.

- **Primary Market:** Ghana (Accra, Tema, Kumasi, Takoradi).
- **Core Currency:** Ghana Cedi (`GH₵`).
- **Hardware Protocol:** OCPP 2.0.1 (CitrineOS CSMS standard).
- **Driver Mobile Experience:** Built with **Expo 57 (React Native)** in [`expo-mobile/`](file:///d:/xcharge-ev-platform/expo-mobile).
- **Backend Server & Web Application:** Built with **Node.js 24 / Express / Vite / TypeScript** in root [`server.ts`](file:///d:/xcharge-ev-platform/server.ts) and [`src/`](file:///d:/xcharge-ev-platform/src/).
- **Git Repository:** [https://github.com/Kwesikendy/EVApp.git](https://github.com/Kwesikendy/EVApp.git) (Branch: `main`).
- **Web Deployment:** Published to GitHub Pages ([https://kwesikendy.github.io/EVApp/](https://kwesikendy.github.io/EVApp/)) and configured for 1-click Vercel import ([`vercel.json`](file:///d:/xcharge-ev-platform/vercel.json)).

---

## 2. Technology Stack & Key Dependencies

### Mobile Application ([`expo-mobile/`](file:///d:/xcharge-ev-platform/expo-mobile))
- **Framework:** Expo 57 / React Native 0.86 (TypeScript).
- **Layout & Safe Areas:** `react-native-safe-area-context` for full edge-to-edge handling with zero collision with system navigation and notch bars.
- **Icons:** `lucide-react-native`.
- **Vector Graphics:** `react-native-svg` (rendering authentic XCharge brand assets and telecom payment logos).
- **Storage:** `@react-native-async-storage/async-storage` for auto-login session persistence.
- **Map View:** Custom Leaflet / OpenStreetMap bridge inside `react-native-webview` with custom electric cyan station pins and clustering.
- **Video Splash Engine:** `expo-video` for immersive startup charging footage.

### Backend & Cloud Architecture
- **Runtime:** Node.js 24 + Express 4 + Vite 6 middleware.
- **Execution:** `tsx server.ts` running on `http://0.0.0.0:5173`.
- **Telephony & SMS Gateway:** Official **Moolre Ghana Messaging Gateway** (`https://api.moolre.com/open/sms/send`).
- **Payment Switch:** Ghana Mobile Money Switch ([`server/momo.ts`](file:///d:/xcharge-ev-platform/server/momo.ts)) supporting MTN MoMo (`*170#`), Telecel Cash (`*110#`), Mastercard 3D Secure, and telco webhook confirmation.
- **Local Persistence Store:** Atomic JSON multi-user file store in [`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json) for 100% resilient data survival across server restarts.
- **Cloud Database:** Google Cloud Firestore ready (provisioned via [`firebase-applet-config.json`](file:///d:/xcharge-ev-platform/firebase-applet-config.json)).

---

## 3. Brand Identity & Design System (Hypercharge OS)

All UI elements strictly follow the **Hypercharge OS** design tokens:

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `background` | `#10141a` | Deep obsidian background. |
| `surface` | `#181c22` | Cards, modal sheets, and input fields. |
| `surfaceBright` | `#242a34` | Hover states, active buttons, elevated elements. |
| `border` | `#2a313d` | High-contrast structural dividers. |
| `primary` | `#00f0ff` | Electric cyan brand accent and primary CTAs. |
| `primaryPressed` | `#00c8d6` | Touch feedback on primary buttons. |
| `success` | `#00e676` | Battery charging, online node, verified ticks. |
| `error` | `#ff4d4d` | Disconnected state, validation errors, sign out. |
| `warning` | `#f59e0b` | Connecting state, low battery, pre-auth alerts. |

### Brand Consistency Rules
1. **Never use plain text "✕" or generic icons for the logo:** Always use `XChargeLogoNative` or `XChargeMarkNative` from [`expo-mobile/XChargeLogoNative.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/XChargeLogoNative.tsx), derived from [`public/xcharge-logo.svg`](file:///d:/xcharge-ev-platform/public/xcharge-logo.svg).
2. **Never use generic placeholders for payment methods:** Always use authentic inline vector logos from [`expo-mobile/PaymentLogosNative.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/PaymentLogosNative.tsx) (`MtnMomoLogoNative`, `TelecelLogoNative`, `MastercardLogoNative`) and [`src/components/PaymentLogos.tsx`](file:///d:/xcharge-ev-platform/src/components/PaymentLogos.tsx).
3. **Currency is always Ghana Cedi (`GH₵`):** Never display `$` or generic currency symbols.

---

## 4. Current Implementation State & Today's Progress

### A. Phase 1: Authentication, Telephony & Persistence (100% Complete & Verified)
- **Mobile Auth Flow:**
  - [`LoginScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/LoginScreen.tsx): Dual mode (Personal / Fleet), phone input with country selector (`+233`), and instant OTP trigger.
  - [`SignUpScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/SignUpScreen.tsx): Driver onboarding with full name, email, vehicle selection (Tesla Model Y 75 kWh, BYD Atto 3 60.5 kWh, Hyundai Ioniq 5 77.4 kWh), and payment method preference.
  - [`OtpVerificationScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/OtpVerificationScreen.tsx): 6-digit visual PIN slots, custom high-contrast keypad with "C" (Clear), countdown timer, and server error validation.
  - [`OtpSuccessScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/OtpSuccessScreen.tsx): Cryptographic telemetry verification, glowing X-blade emblem, driver profile summary, and transition to HUD.
  - [`storage.ts`](file:///d:/xcharge-ev-platform/expo-mobile/storage.ts): Auto-login using `AsyncStorage` with sign-out support in Settings.
- **Web Authentication Suite ([`src/components/`](file:///d:/xcharge-ev-platform/src/components/)):**
  - Fully mirrors the mobile auth experience with web-optimized components ([`LoginScreen.tsx`](file:///d:/xcharge-ev-platform/src/components/LoginScreen.tsx), [`SignUpScreen.tsx`](file:///d:/xcharge-ev-platform/src/components/SignUpScreen.tsx), [`OtpVerificationScreen.tsx`](file:///d:/xcharge-ev-platform/src/components/OtpVerificationScreen.tsx), [`OtpSuccessScreen.tsx`](file:///d:/xcharge-ev-platform/src/components/OtpSuccessScreen.tsx)).
  - Driver Profile & Sign Out modal in [`ModernHeader.tsx`](file:///d:/xcharge-ev-platform/src/components/ModernHeader.tsx) with session persistence in `localStorage`.
- **Live Moolre SMS Gateway:**
  - Integrated in [`server/auth.ts`](file:///d:/xcharge-ev-platform/server/auth.ts) with `MOOLRE_VAS_KEY` and Sender ID `Business_Ad`.
  - Dispatches real SMS verification codes to Ghanaian phone numbers (`+233...`).
  - Developer bypass code `123456` retained for rapid offline testing.
- **Multi-User Persistent Database ([`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json)):**
  - Stores multiple real drivers (e.g. Kofi Mensah `+233248901204`, Ekow Mensah `+233241234567`), registered vehicle profiles, wallet balances, and full transaction history across reboots.

### B. Phase 2: Live Payment Switch & Dynamic Escrow (100% Complete & Verified)
- **Ghana MoMo Payment Switch ([`server/momo.ts`](file:///d:/xcharge-ev-platform/server/momo.ts)):**
  - **`initiateMomoPayment`**: Dispatches telco-compliant USSD prompts:
    - MTN MoMo: `Authorize payment of GHS XX.XX to XCHARGE GHANA LTD? Ref: GH-MTN-XXXXXX. Enter Mobile Money (*170#) PIN:`
    - Telecel Cash: `Authorize payment of GHS XX.XX to XCHARGE GHANA LTD? Ref: GH-TELECEL-XXXXXX. Enter Telecel Cash (*110#) PIN:`
  - **`confirmMomoPayment`**: Settles payment, issues approval code (e.g. `MTN-AUTH-31237183`) and GRA tax invoice (`GRA-ELEV-EXEMPT-XXXXX`), and immediately credits persistent wallet balance.
  - **`handleMomoWebhook` (`POST /api/momo/webhook`)**: Ingests asynchronous telco payment confirmations and credits driver balances automatically.
- **Pre-Authorization Escrow Hold & Programmatic Refund ([`server/auth.ts`](file:///d:/xcharge-ev-platform/server/auth.ts)):**
  - `holdUserEscrow`: Holds GH₵ 25.00 deposit from driver's available balance into `heldEscrow` when charging starts via `POST /api/ocpp/remote-start`.
  - `settleAndReleaseEscrow`: Releases hold upon cable unlatch via `POST /api/ocpp/remote-stop`.
  - Programmatic Difference Refund: If energy consumed `<` hold, the unspent difference is automatically refunded back to the driver down to the pesewa.
  - Full audit ledger: Logs `PREAUTH_HOLD`, `PREAUTH_RELEASE`, `TOPUP`, and `CHARGE_SETTLEMENT` into `data/users.json`.
- **Expo Mobile Client Integration ([`expo-mobile/App.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/App.tsx) & [`expo-mobile/api.ts`](file:///d:/xcharge-ev-platform/expo-mobile/api.ts)):**
  - Authenticated driver's phone number is passed across wallet queries, USSD top-ups, and charging sessions.
  - Real-time balance and escrow synchronization on both mobile and web frontends.

### C. Web UI/UX Overhaul & Cloud Deployment
- Real Leaflet map engine with CartoDB dark tiles showing 5 Accra superhubs (Airport City, Spintex, East Legon, Financial Plaza, Tema Port).
- Anti-stretch luxury iPhone chassis on desktop; 100% full-screen responsive on mobile devices.
- Port migrated from conflicting 3000 to `5173`.
- Deployed and live on GitHub Pages and ready for Vercel.

---

## 5. File & Directory Map

```
d:\xcharge-ev-platform\
├── expo-mobile/                        # React Native / Expo Mobile Application
│   ├── screens/                        # Modular App Screens
│   │   ├── LoginScreen.tsx             # Dual-mode phone login screen
│   │   ├── SignUpScreen.tsx            # Multi-step driver & EV onboarding
│   │   ├── OtpVerificationScreen.tsx   # 6-digit visual PIN entry & numeric keypad
│   │   └── OtpSuccessScreen.tsx        # Cryptographic node verification & launch
│   ├── App.tsx                         # Main Mobile App root (HUD, Map, Wallet, Fleet)
│   ├── api.ts                          # Mobile API client with multi-user phone support
│   ├── storage.ts                      # AsyncStorage session management (Auto-login)
│   ├── theme.ts                        # Hypercharge OS design tokens
│   ├── XChargeLogoNative.tsx           # Native SVG brand logos & vector emblems
│   ├── PaymentLogosNative.tsx          # Authentic MTN MoMo, Telecel, Mastercard SVGs
│   ├── StationMap.tsx                  # Webview-based high-performance Leaflet map
│   └── package.json                    # Mobile app dependencies
│
├── server/
│   ├── auth.ts                         # Moolre SMS gateway, OTP verification, wallet & escrow logic
│   └── momo.ts                         # Ghana Mobile Money switch & webhook handler
│
├── data/
│   └── users.json                      # Persistent driver accounts, EV fleet & ledger database
│
├── src/                                # Web Application
│   ├── components/                     # Web components (Login, Signup, OTP, Map, Header, Admin)
│   ├── firebase.ts                     # Cloud Firestore client initialization
│   └── types.ts                        # TypeScript models (OCPP, Station, Wallet, Fleet)
│
├── public/                             # Public static assets
│   ├── xcharge-logo.svg                # Authentic master brand vector
│   └── electric_vehicle_charging.mp4   # Splash charging footage
│
├── server.ts                           # Express backend API & CitrineOS CSMS server (Port 5173)
├── vercel.json                         # Vercel 1-click cloud deployment config
├── firestore.rules                     # Cloud Firestore security rules
├── package.json                        # Root backend dependencies & scripts
├── .env                                # Live credentials (Moolre VAS key, Sender ID, Port)
├── ROADMAP.md                          # Detailed commercial roadmap
└── PROJECT_CONTEXT.md                  # This file (Single source of truth)
```

---

## 6. How to Run Locally

### 1. Start the Backend Server (Port 5173)
From the project root:
```bash
npm run dev
```
Starts `tsx server.ts` on `http://0.0.0.0:5173`. Serves the web frontend, Vite HMR, and all API endpoints:
- Telephony & Auth: `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `GET /api/user/profile`
- Wallet & Payments: `GET /api/wallet?phoneNumber=...`, `POST /api/wallet/topup`, `POST /api/wallet/momo-initiate`, `POST /api/wallet/momo-confirm`, `POST /api/momo/webhook`
- OCPP CSMS: `POST /api/ocpp/remote-start`, `POST /api/ocpp/remote-stop`, `GET /api/ocpp/logs`, `GET /api/session/active`
- Stations: `GET /api/stations`, `POST /api/stations`

### 2. Start the Expo Mobile App
In a separate terminal:
```bash
cd expo-mobile
npm run tunnel
# or: npx expo start --tunnel
```
- **Physical Phone (Expo Go):** Scan the QR code using Expo Go (Android) or Camera (iOS).
- **Backend Sync:** Mobile app connects to the running backend over local LAN or tunnel.

---

## 7. Environment Variables Reference (`.env`)

```ini
# Server Port (Migrated to 5173 to avoid localhost:3000 conflicts)
PORT=5173

# Moolre Ghana SMS Gateway (Live SMS OTP Delivery)
MOOLRE_VAS_KEY="<JWT-Bearer-Token>"
MOOLRE_SENDER_ID="Business_Ad"

# Google Cloud Firebase
FIREBASE_PROJECT_ID="gen-lang-client-0824141968"
```

---

## 8. Tomorrow's Next Priority Tasks (Roadmap Phase 3 & 4)

When resuming work tomorrow, choose from the three planned tracks:

1. **Track 1: Phase 3 – Hardware Ingress (OCPP 2.0.1 WebSocket Server)**:
   - Mount a native WebSocket server in [`server.ts`](file:///d:/xcharge-ev-platform/server.ts) at `/ocpp/2.0.1/{stationId}`.
   - Implement real OCPP 2.0.1 JSON protocol frames (`BootNotification`, `StatusNotification`, `Heartbeat`, `TransactionEvent`, `MeterValues`).
   - Connect physical chargers (ABB Terra, StarCharge) or a testing simulator rig so hardware events stream directly into the apps in real time.

2. **Track 2: Station Operator & Fleet Manager Web Dashboard**:
   - Build out the Web portal in [`src/`](file:///d:/xcharge-ev-platform/src/) with live revenue analytics in Ghana Cedis (`GH₵`), kWh dispensed, stall uptime, dynamic peak/off-peak tariffs, and corporate fleet VIN management.

3. **Track 3: Standalone Mobile Builds (Android APK & PWA)**:
   - Configure EAS Build / Local APK export for `expo-mobile` so drivers can install a native `.apk` on their phones without Expo Go.
   - Configure Progressive Web App (PWA) manifest for 1-tap "Add to Home Screen" install on web.
