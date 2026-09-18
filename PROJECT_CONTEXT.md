# XCHARGE EV Platform — Complete Project Context & Architecture

> **Notice:** This document is the single source of truth for the XCHARGE project. Any AI assistant or developer picking up this repository should read this document first to get up to speed instantly.

---

## 1. Executive Summary

**XCHARGE** is Ghana's first high-speed electric vehicle charging and commercial fleet operating system. It provides real-time OCPP 2.0.1 telemetry, map navigation across Accra and major Ghanaian corridors, Mobile Money split-wallets (MTN MoMo & Telecel Cash), dynamic pre-authorization escrow, and fleet vehicle management.

- **Primary Market:** Ghana (Accra, Tema, Kumasi, Takoradi).
- **Core Currency:** Ghana Cedi (`GH₵`).
- **Hardware Protocol:** OCPP 2.0.1 (CitrineOS CSMS standard).
- **Driver Mobile Experience:** Built with **Expo (React Native)** in [`expo-mobile/`](file:///d:/xcharge-ev-platform/expo-mobile).
- **Backend Server & Web Dashboard:** Built with **Node.js / Express / Vite** in root [`server.ts`](file:///d:/xcharge-ev-platform/server.ts).

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
- **Runtime:** Node.js 24 + Express 4.
- **Execution:** `tsx server.ts` running on `http://0.0.0.0:3000`.
- **Telephony & SMS Gateway:** Official **Moolre Ghana Messaging Gateway** (`https://api.moolre.com/open/sms/send`).
- **Cloud Database:** Google Cloud Firestore (provisioned via [`firebase-applet-config.json`](file:///d:/xcharge-ev-platform/firebase-applet-config.json) & [`firestore.rules`](file:///d:/xcharge-ev-platform/firestore.rules)).
- **Local Persistence Store:** Atomic JSON file store in [`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json) for 100% resilient data survival across server restarts.

---

## 3. Brand Identity & Design System (Hypercharge OS)

All UI elements must follow the **Hypercharge OS** design tokens defined in [`expo-mobile/theme.ts`](file:///d:/xcharge-ev-platform/expo-mobile/theme.ts):

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
2. **Never use generic placeholders for payment methods:** Always use authentic vector logos from [`expo-mobile/PaymentLogosNative.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/PaymentLogosNative.tsx) (`MtnMomoLogoNative`, `TelecelLogoNative`, `MastercardLogoNative`).
3. **Currency is always Ghana Cedi (`GH₵`):** Never display `$` or generic symbols.

---

## 4. Current Implementation State

### A. Mobile Driver Authentication Flow (100% Complete)
- **[`LoginScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/LoginScreen.tsx):** Dual mode (Personal EV / Fleet Operator), phone input with country selector (`+233`), and instant OTP trigger.
- **[`SignUpScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/SignUpScreen.tsx):** Driver onboarding with full name, email, vehicle selection (Tesla Model Y 75 kWh, BYD Atto 3 60.5 kWh, Hyundai Ioniq 5 77.4 kWh), and MoMo gateway selection.
- **[`OtpVerificationScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/OtpVerificationScreen.tsx):** 6-digit visual PIN slots, custom high-contrast keypad with "C" (Clear) and Backspace, resend countdown timer, and live validation error handling.
- **[`OtpSuccessScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/OtpSuccessScreen.tsx):** 256-bit cryptographic telemetry verification, glowing X-blade emblem, driver profile summary, and seamless navigation into the Charge HUD.
- **[`storage.ts`](file:///d:/xcharge-ev-platform/expo-mobile/storage.ts):** Local session auto-login using `AsyncStorage`. Automatically restores active driver upon app open, and clears session upon tapping "Sign Out" in Settings.

### B. Core Charging HUD & App Modules (100% Complete)
- **Station Map Explorer:** Interactive map featuring Accra DC Fast Charging hubs (Airport City, Spintex Road, East Legon, Accra Mall, Tema Port).
- **Telemetry HUD:** Live animated charging curves, kilowatt delivery gauge, voltage/amperage readouts, battery SoC percentage, and simulated cable locks.
- **Mobile Money Split-Wallet:** Displays real Cedi balance, pre-authorization escrow holds, transaction receipts, and quick top-up triggers.
- **Fleet VIN Management:** Commercial operator vehicle telemetry, SoC monitoring, battery health, and plug-and-charge status.

### C. Live Moolre SMS Gateway (100% Complete)
- Fully wired in [`server/auth.ts`](file:///d:/xcharge-ev-platform/server/auth.ts).
- Normalizes Ghanaian phone numbers (`024...`, `055...`, `+233...`).
- Dispatches real SMS verification codes via Moolre using `MOOLRE_VAS_KEY` and Sender ID `Business_Ad`.
- Developer test code `123456` remains supported for automated testing.

### D. Data Persistence (100% Complete)
- Stored on disk in [`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json).
- Driver accounts, vehicle fleet, and wallet balances survive server reboots and hot-reloads.

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
│   ├── api.ts                          # Mobile API client with network retry & fallbacks
│   ├── storage.ts                      # AsyncStorage session management (Auto-login)
│   ├── theme.ts                        # Hypercharge OS design tokens
│   ├── XChargeLogoNative.tsx           # Native SVG brand logos & vector emblems
│   ├── PaymentLogosNative.tsx          # Authentic MTN MoMo, Telecel, Mastercard SVGs
│   ├── StationMap.tsx                  # Webview-based high-performance Leaflet map
│   └── package.json                    # Mobile app dependencies
│
├── server/
│   └── auth.ts                         # Moolre SMS gateway, OTP verification & DB logic
│
├── data/
│   └── users.json                      # Persistent driver accounts & EV fleet database
│
├── src/                                # Web Application / Shared Types
│   ├── components/                     # React components for Web dashboard
│   ├── firebase.ts                     # Cloud Firestore client initialization
│   └── types.ts                        # TypeScript models (OCPP, Station, Wallet, Fleet)
│
├── public/                             # Public static assets
│   ├── xcharge-logo.svg                # Authentic master brand vector
│   └── electric_vehicle_charging.mp4   # Splash charging footage
│
├── server.ts                           # Express backend API & CitrineOS CSMS simulator
├── firestore.rules                     # Cloud Firestore security rules
├── firebase-applet-config.json         # Firebase project configuration
├── package.json                        # Root backend dependencies & scripts
├── .env                                # Live credentials (Moolre VAS key & Sender ID)
├── ROADMAP.md                          # Detailed commercial roadmap
└── PROJECT_CONTEXT.md                  # This file
```

---

## 6. How to Run Locally

### 1. Start the Backend Server
From the project root:
```bash
npm run dev
```
The server will start on `http://0.0.0.0:3000`. It serves:
- Static video and branding assets (`/public`).
- REST endpoints:
  - `POST /api/auth/send-otp`
  - `POST /api/auth/verify-otp`
  - `GET /api/user/profile`
  - `PUT /api/user/profile`
  - `GET /api/stations`
  - `POST /api/simulator/start`
  - `POST /api/simulator/stop`

### 2. Start the Expo Mobile App
Open a separate terminal and run:
```bash
cd expo-mobile
npx expo start
```
- **Physical Phone (Expo Go):** Scan the QR code using your phone camera (iOS) or Expo Go app (Android). Make sure your phone and PC are connected to the same Wi-Fi network.
- **Custom Backend IP:** If testing on a physical phone, tap the **ONLINE / CONNECTING** pill at the top of the mobile app to enter your PC's local LAN IP (e.g. `http://192.168.1.150:3000`).

---

## 7. Environment Variables Reference (`.env`)

```ini
# Server Port
PORT=3000

# Moolre Ghana SMS Gateway (Live SMS OTP Delivery)
MOOLRE_VAS_KEY="<JWT-Bearer-Token>"
MOOLRE_SENDER_ID="Business_Ad"

# Google Cloud Firebase
FIREBASE_PROJECT_ID="gen-lang-client-0824141968"
```

---

## 8. Next Priority Tasks (Roadmap Phase 2)

When resuming work, proceed with **Phase 2 (Live Ghana MoMo Payments)**:
1. Implement live Mobile Money collection API (Moolre Collections or Paystack Ghana API).
2. Expose the server webhook (`POST /api/momo/webhook`) to handle asynchronous payment prompts from MTN MoMo and Telecel Cash.
3. Build the dynamic pre-authorization escrow hold engine with automatic refund of unused balances upon cable disconnect.
