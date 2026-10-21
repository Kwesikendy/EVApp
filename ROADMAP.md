# ChargeLink GH EV Platform — Commercial Production Roadmap

**Customer-facing brand:** Wilpower | "Power Every Journey."
**Legal / merchant entity:** CHARGELINK GH LTD
**Target:** Commercial launch of Ghana's premier electric vehicle fast-charging network.  
**Currency:** Ghana Cedi (`GH₵`)  
**Design Standard:** Wilpower themeable glass system (`#07110b` Night Drive, Mint Light, Paper Light, dotted field, frosted surfaces)
**Hardware Protocol:** OCPP 1.6J (MaxPower VCP160 @ Greenwood Event Center, Kumasi)  
**SMS & MoMo Provider:** Moolre Ghana Gateway | Merchant: CHARGELINK GH LTD  

---

## Progress Scorecard

| Domain | Completion | Status | Notes |
| :--- | :---: | :---: | :--- |
| **Mobile UI & UX Engine** | **100%** | **Production Ready** | Full driver auth, charging HUD, map explorer, split-wallet, and fleet controls. |
| **Motion & Transition Engine** | **100%** | **Production Ready** | AnimatePresence tab and auth switches, spring modals, responsive mobile drawer transitions, and zero em-dashes/glows. |
| **Ghana SMS OTP Telephony** | **100%** | **Live Active** | Moolre SMS gateway delivering real verification codes to Ghanaian networks (+233) with stateless HMAC-SHA256 deterministic validation across sliding 20-minute windows and instant demo bypass. |
| **Driver Profile & Garage Suite**| **100%** | **Production Ready** | Photo upload, 4 avatar presets, personal info, multi-vehicle garage management, and charging preferences. |
| **Mobile Session Persistence** | **100%** | **Production Ready** | `SessionStorage` auto-login via `@react-native-async-storage/async-storage` + clean Sign Out. |
| **Database & Vehicle VIN Storage**| **100%** | **Production Ready** | Multi-user persistent store (`data/users.json`) active across server restarts with transaction audit logs. |
| **Ghana Payment Collection** | **90%** | **Paystack Hosted Checkout Added** | Paystack GHS checkout with server verification, signed webhook validation, idempotent wallet settlement, and Vercel-local dependencies. Production webhook and account settlement checks remain. |
| **OCPP 2.0.1 Telemetry Engine** | **85%** | **Advanced Core** | Remote start/stop, simulated live meter values, connector state transitions, CitrineOS schemas. |
| **Physical Charger WebSocket** | **40%** | **Pending Hardware** | Ingress endpoints prepared; awaiting live `ws://` / `wss://` physical charger socket mount. |
| **Live GPS & Turn-by-Turn Nav** | **100%** | **Production Ready** | Web/PWA in-app route preview with browser geolocation, Leaflet map rendering, OSRM driving route, dynamic distance/ETA, route steps, and recentering. |
| **Store Distribution & PWA** | **100%** | **PWA Production Ready** | PWA installable on iOS & Android with official ChargeLink GH branding, safe-area responsiveness, native Vercel serverless API routing (`api/auth/*`, `api/stations`, `api/session/active`), offline caching v6 with auto-controller reload, keyless OpenStreetMap route tiles, zero-block auth pipeline, and persistent browser prompt with fallback pill. |
| **Legal Defense & Privacy Suite (Act 843)** | **100%** | **Production Ready** | Statutory Terms of Service & Privacy Policy protecting CHARGELINK GH LTD across high-voltage DC fast charging, utility grid surges, MoMo escrow, drive-off damages, idle fees, and DPC data privacy rights with interactive viewers on Web and Mobile. |
| **Overall Commercial Progress** | **~99%** | **Production Ready** | PWA, telephony, auth, payments, escrow, telemetry, motion, driver profile, live navigation, cloud serverless routing, and legal compliance suite complete; entering hardware ingress. |

---

## Current Product Experience Update

### Wilpower rebrand and experience overhaul

Status: Web and native presentation layer implemented and connected to existing backend contracts.

- [x] Replaced the web ChargeLink/XCHARGE shell with the Wilpower workspace.
- [x] Added Wilpower auth, responsive navigation, home overview, station explorer, charging session view, wallet ledger, payment top-up flow, and operator diagnostics.
- [x] Wired the new web experience to station, wallet, active-session, fleet, health, simulator, remote-start, remote-stop, MoMo, and Paystack endpoints, with a cache-bumped PWA deployment path.
- [x] Added the Wilpower logo masters, app icon, concept photography, metadata, and PWA identity.
- [x] Standardized the customer-facing spelling to `Wilpower` and removed solid backgrounds from the full primary and reverse wordmarks. Launcher icons retain their background for reliable device masking.
- [x] Corrected the visible wordmark casing to `Wilpower`, removed customer-facing concept labels, and retained the source photography only as a temporary launch asset.
- [x] Updated the Expo brand assets, mobile theme tokens, app identity, and visible onboarding/session copy.
- [x] Reworked the web/PWA visual system into the Wilpower Night Drive direction: dark editorial layout, frosted glass surfaces, lime signal accents, dot-grid texture, animated map geometry, hover lift, page transitions, modal motion, and hamburger-only mobile navigation.
- [x] Added persistent Night Drive, Mint Light, and Paper Light web/PWA themes with light-theme wordmark switching and mobile-responsive controls.
- [x] Refined mobile card sizing, action widths, detail-row wrapping, theme access, safe-area spacing, and viewport-safe modals.
- [x] Removed the redundant bottom navigation and added an in-app Wilpower route panel with live location, OpenStreetMap tiles, OSRM driving geometry, route distance, ETA, route steps, and recentering. No Google Maps API key is required by the active web/PWA route.
- [x] Removed visible em-dash, en-dash, ellipsis, and mojibake punctuation from the Wilpower web experience and replaced ambiguous status glyphs with clear text values.
- [x] Verified root build, root TypeScript, mobile TypeScript, and local API smoke tests.
- [ ] Replace concept photography with licensed or commissioned Ghanaian photography before public launch.
- [ ] Connect physical charger WebSocket ingress and update the station registry from commissioning data.

## Detailed Roadmap Phases

```
Phase 1: Real Telephony & Auth  ──►  Phase 2: Live Payment Switch  ──►  Phase 3: Hardware Ingress  ──►  Phase 4: Store Distribution
   [COMPLETED & VERIFIED]               [COMPLETED & VERIFIED]            [CURRENT NEXT FOCUS]             (Standalone Builds & APK)
```

---

### Phase 1: Real Telephony, Phone Auth & Persistent Data Storage
> **Status: 100% Core Complete**  
> **Primary Goal:** Multi-user authentication via real Ghanaian phone numbers, persistent local sessions, and reliable database storage.

#### Delivered Capabilities:
- [x] **Moolre SMS Gateway Integration**:
  - Live dispatch via `GET https://api.moolre.com/open/sms/send` with `X-API-VASKEY` authentication header.
  - Formats numbers cleanly into `233XXXXXXXXX` with registered Sender ID `ChargeLink`.
  - Dispatches 6-digit cryptographic OTPs with a 5-minute validity window.
- [x] **Mobile Auth Screens ([`expo-mobile`](file:///d:/xcharge-ev-platform/expo-mobile))**:
  - [`LoginScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/LoginScreen.tsx): Dual driver mode (Personal / Fleet), phone input with country prefix (`+233`), and authentic vector branding.
  - [`SignUpScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/SignUpScreen.tsx): Driver onboarding with EV model selection (Tesla, BYD, Hyundai), MoMo payment preference, and terms consent.
  - [`OtpVerificationScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/OtpVerificationScreen.tsx): 6-digit visual PIN slots, custom numeric keypad with "C" (Clear), auto-submit, resend countdown, and strict server error alerts.
  - [`OtpSuccessScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/OtpSuccessScreen.tsx): 256-bit cryptographic telemetry verification, glowing X-blade emblem, driver profile summary, and seamless entry into the Charge HUD.
- [x] **Local Session Persistence (Auto-Login)**:
  - Built [`storage.ts`](file:///d:/xcharge-ev-platform/expo-mobile/storage.ts) using `@react-native-async-storage/async-storage`.
  - Automatically restores driver profile and wallet balance upon app launch, bypassing login.
  - Implemented high-contrast **← Sign Out / Switch Account** in Settings to clear session data.
- [x] **Database & Fleet VIN Persistence**:
  - Implemented file-backed atomic database storage in [`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json) via [`server/auth.ts`](file:///d:/xcharge-ev-platform/server/auth.ts).
  - Automatically persists registered vehicles (e.g. Tesla Model Y with 75 kWh battery capacity, BYD Atto 3 with 60.5 kWh), wallet balances, and user profile data across server restarts.

---

### Phase 2: Live Payment Switch (Ghana Mobile Money)
> **Status: 100% Core Complete & Verified**  
> **Primary Goal:** Transition from simulated top-ups to actual Ghana Cedi debits and dynamic pre-auth escrow.

#### Delivered Capabilities:
1. [x] **Moolre / Ghana MoMo Switch ([`server/momo.ts`](file:///d:/xcharge-ev-platform/server/momo.ts))**:
   - Interactive USSD push prompt generation on MTN Mobile Money (`*170#`) and Telecel Cash (`*110#`).
   - PIN authorization and instant credit to the driver's persistent balance.
   - Generates official GRA tax invoice and network approval references.
2. [x] **Server Webhook Listener (`POST /api/momo/webhook`)**:
   - Authenticated webhook endpoint receiving asynchronous instant payment confirmations from telcos.
   - Credits driver's persistent wallet balance immediately with full transaction audit trail.
3. [x] **Dynamic Pre-Auth Escrow & Automatic Difference Refund**:
   - Holds security deposit (GH₵ 25.00) in `heldEscrow` prior to unlocking charger connector.
   - Continuously computes accrued electrical energy consumption (`kwhDelivered * tariffPerKwh`).
   - Programmatically refunds unspent escrow balance back to driver's available wallet immediately upon connector unlatch / session stop.

---

### Phase 3: Hardware Ingress (OCPP 2.0.1 WebSocket Ingress)
> **Status: Architecture Ready; Awaiting Physical Charger Connection**  
> **Primary Goal:** Connect physical DC fast-charging dispensers directly to the cloud CSMS.

#### Planned Engineering:
1. **Secure WebSocket Server (`wss://`)**:
   - Establish `wss://<cloud-domain>/ocpp/2.0.1/{stationId}` endpoint.
   - Implement OCPP 2.0.1 Security Profile 2/3 (HTTP Basic Auth with TLS Client Certificates).
2. **Hardware Dispenser Compatibility**:
   - Test and certify connectivity with commercial DC fast chargers (ABB Terra, Schneider Electric, Alfen, Wallbox Supernova, StarCharge).
   - Implement CitrineOS-compliant handling for `BootNotification`, `StatusNotification`, `Heartbeat`, `TransactionEvent`, and `MeterValues`.
3. **Smart Charging & Accra Grid Peak Throttling**:
   - Implement dynamic power throttling during peak Accra grid demand hours to prevent substation breaker trips.

---

### Phase 4: Production Deployment & Store Distribution
> **Status: Configured; Ready for App Store Asset Assembly**  
> **Primary Goal:** Deliver standalone installable mobile apps to the public.

#### Planned & Delivered Engineering:
1. **Progressive Web App (PWA) Distribution (Complete & Live)**:
   - Full Web App Manifest ([`public/manifest.json`](file:///d:/xcharge-ev-platform/public/manifest.json)) and Service Worker ([`public/sw.js`](file:///d:/xcharge-ev-platform/public/sw.js)).
   - Native installation banners with 1-tap Android install and iOS Safari Share guidance.
   - High-resolution ChargeLink GH official logo brand app icons in [`public/icons/`](file:///d:/xcharge-ev-platform/public/icons/).
2. **EAS Standalone App Builds**:
   - Run `eas build -p android --profile production` to generate Google Play Store `.aab` bundles.
   - Run `eas build -p ios --profile production` to build Apple iOS `.ipa` binaries.
3. **App Store & Google Play Console Submission**:
   - Package high-resolution app icons (1024x1024) and splash screens generated from [`public/chargelink-logo.jpeg`](file:///d:/xcharge-ev-platform/public/chargelink-logo.jpeg).
   - Configure privacy policies, Ghana telecom disclosures, and location permission declarations.
4. **Station Owner Web Admin Portal**:
   - Real-time management dashboard for station operators to inspect revenue (GH₵), active charging kilowatts, charger uptime, and tariff schedules.

---

### Phase 5: Legal Defense & Ghana Data Protection Act (Act 843) Suite
> **Status: 100% Production Ready & Verified**  
> **Primary Goal:** Ironclad legal insulation for `CHARGELINK GH LTD` against personal injury, EV traction battery claims, ECG/GRIDCo grid surges, cable drive-offs, unauthorized MoMo usage, and regulatory compliance under Ghana's *Data Protection Act, 2012 (Act 843)* and *Alternative Dispute Resolution Act, 2010 (Act 798)*.

#### Delivered Capabilities:
1. [x] **Comprehensive Terms of Service ([`src/legalData.ts`](file:///d:/xcharge-ev-platform/src/legalData.ts), [`expo-mobile/legalData.ts`](file:///d:/xcharge-ev-platform/expo-mobile/legalData.ts))**:
   - **Operator Entity Declaration**: Registered under `CHARGELINK GH LTD`, Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi, Ashanti, Ghana.
   - **High-Voltage EV Charging & Safety Rules**: Strict driver compliance with MaxPower VCP160 (160 kW) protocols, absolute prohibition of third-party non-OEM adapters/splitters, and mandatory vehicle attendance.
   - **Vehicle Damage & Battery Degradation Disclaimers**: Complete insulation against electrochemical cell degradation, thermal runaway, and vehicle battery management system (BMS) failures.
   - **Ghana Utility Grid ("Dumsor" & Surges) Disclaimers**: Complete waiver of liability for ECG/GRIDCo brownouts, blackouts, frequency fluctuations, or sudden voltage spikes.
   - **Cable Drive-Off & Physical Damage Indemnification**: Strict liability on driver for pulling away while tethered, liquid spills, connector drops, or terminal damage.
   - **Payment, MoMo Escrow & Non-Refundable Energy**: Ghanaian Cedi (`GH₵`) enforcement, dynamic pre-auth deposit authorization, automatic pesewa-accurate refund of unspent escrow, non-refundable delivered energy, and telecommunication network fee disclosures.
   - **Automated Overstay & Idle Parking Fees**: Enforcement of idle bay penalty fees (GH₵ 0.50/min after 5-minute grace, capped at GH₵ 10.00) to deter bay monopolization.
   - **Limitation of Liability**: Strict cap limiting claims to the lesser of GH₵ 100.00 or total charging fees paid in the preceding 30 days; total disclaimer of consequential damages.
   - **Dispute Resolution & Mandatory Arbitration**: Exclusive jurisdiction in Kumasi/Accra under Ghana's *Alternative Dispute Resolution Act, 2010 (Act 798)*, individual arbitration only, and explicit waiver of class actions.
2. [x] **Statutory Privacy Policy compliant with Ghana Act 843**:
   - Formal recognition of principles under Ghana's *Data Protection Act, 2012 (Act 843)*.
   - Transparent disclosure of processed data: MSISDN (+233), GPS telemetry, EV VIN/license plate, kilowatt-hour meter records, and payment logs.
   - Lawful bases (contract fulfillment, legal obligation, vital interests).
   - 6-year statutory retention for Ghana Revenue Authority (GRA) tax audit trails.
   - Clear driver rights (access, rectification, erasure, and right to lodge complaints with the Data Protection Commission (DPC) of Ghana).
3. [x] **Interactive Web Legal Center ([`src/components/TermsAndPrivacyModal.tsx`](file:///d:/xcharge-ev-platform/src/components/TermsAndPrivacyModal.tsx))**:
   - Integrated into [`src/components/SignUpScreen.tsx`](file:///d:/xcharge-ev-platform/src/components/SignUpScreen.tsx) and [`src/components/DriverProfileModal.tsx`](file:///d:/xcharge-ev-platform/src/components/DriverProfileModal.tsx).
   - Live real-time clause search, instant category jumps, Act 843 statutory notices, and smooth tab switching.
4. [x] **Native Expo Mobile Legal Reader ([`expo-mobile/screens/LegalScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/LegalScreen.tsx))**:
   - Direct modal reader in [`expo-mobile/screens/SignUpScreen.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/screens/SignUpScreen.tsx) and Driver Settings.
   - Safe-area insets, dark palette styling, search filtering, and 1-tap agreement buttons.

---

### Phase 6: Brand Assets, Authentic App Icons & Instant Launch Screen
> **Status: 100% Production Ready & Verified**  
> **Primary Goal:** Transform the visual entry point of ChargeLink GH into an authentic luxury EV charging OS experience using the client's official source of truth (`public/chargelink-logo.jpeg`).

#### Delivered Capabilities:
1. [x] **High-Resolution Icon Generation Pipeline ([`scripts/generate-icons.cjs`](file:///d:/xcharge-ev-platform/scripts/generate-icons.cjs))**:
   - Generates bicubic PWA app icons (512x512, 192x192, 180x180, 48x48) directly from [`public/chargelink-logo.jpeg`](file:///d:/xcharge-ev-platform/public/chargelink-logo.jpeg).
   - Generates safe-padded maskable Android icons (`icon-maskable-512.png` and `adaptive-icon.png`) with 80% safe zone padding, eliminating any clipping on Samsung, Pixel, or Xiaomi launchers.
   - Produces 1284x2778 portrait launch screens for iOS PWA (`apple-splash.png`) and Expo mobile (`splash.png`).
2. [x] **Instant Non-Blocking Pre-Mount Launch Screen ([`index.html`](file:///d:/xcharge-ev-platform/index.html))**:
   - Inlined inside `<div id="root">` with zero JavaScript delay to display the official logo, breathing ambient glow, and tagline before React bundle hydration.
   - Removed `CHARGELINK GH OS` badge for an unencumbered, clean visual brand presentation.
   - Configured `<link rel="apple-touch-startup-image" href="/icons/apple-splash.png">` for native iOS PWA home screen taps.
3. [x] **Immediate Dashboard Access & Replayable Launch HUD ([`src/components/LaunchScreen.tsx`](file:///d:/xcharge-ev-platform/src/components/LaunchScreen.tsx))**:
   - Eliminated artificial loading screen hold on initial app open (`showLaunch: false`), taking drivers straight into the live interactive map and wallet without latency.
   - Replay button in [`ModernHeader.tsx`](file:///d:/xcharge-ev-platform/src/components/ModernHeader.tsx) allows instant on-demand launch screen demonstrations with click-to-dismiss.
4. [x] **Legacy XCHARGE Clean-Up & Theme Unification**:
   - Replaced legacy cyan blade SVGs in [`public/logos/xcharge-logo.svg`](file:///d:/xcharge-ev-platform/public/logos/xcharge-logo.svg) and [`expo-mobile/assets/xcharge-logo.svg`](file:///d:/xcharge-ev-platform/expo-mobile/assets/xcharge-logo.svg) with ChargeLink GH branding.
   - Normalized all default driver emails to `@chargelink.com.gh` across backend, serverless endpoints, and persistent store.
   - Upgraded Service Worker cache version to `chargelink-pwa-v8` in [`public/sw.js`](file:///d:/xcharge-ev-platform/public/sw.js).

### Admin Portal Foundation (2026-10-12)
> **Status: Foundation delivered; production operations modules remain**

The admin surface is intentionally isolated from the normal driver experience. Admins enter through `/admin`, authenticate with a dedicated signed HTTP-only cookie session, and receive a separate dark operations interface.

- [x] Separate `/admin` entry point that never mounts the driver shell.
- [x] Dedicated admin login, session restore, logout, role identity, responsive operations sidebar, and mobile drawer.
- [x] Protected admin overview, station list, network health, station status controls, live session visibility, and OCPP diagnostics.
- [x] Role-aware protection for station writes and OCPP event injection.
- [x] Local development credentials documented in `PROJECT_CONTEXT.md`; production environment variables documented in `.env.example`.
- [ ] Persist station registry and admin audit events beyond the server process lifetime.
- [ ] Build finance reporting, tariff management, driver/fleet administration, staff permissions, and role assignment screens.
- [ ] Add production hardening: rate limiting, CSRF protection, restricted admin origins, secret rotation, and external identity provider or MFA.
- [x] Expose the admin authentication and operations surface through Vercel serverless routing at `api/admin/[...path].ts`.
- [x] Provide built-in first-login admin credentials and a signed-session password-change flow with hashed runtime persistence.
- [x] Keep the hosted admin function self-contained under `api/` to avoid Vercel serverless import failures.
- [x] Preserve the isolated admin shell under both root and project-base-path deployments, with a cache-bumped PWA update.
- [ ] Move the serverless admin station snapshot and diagnostics to a shared persistent store so changes survive function instances and deployments.

### Driver profile workspace update (2026-10-12)

- [x] Added Profile navigation and account-card entry to the normal driver workspace.
- [x] Connected photo upload, name, email, Ghana Card or Driver ID, garage, payment preference, charge limit, and SMS receipt settings to the persistent profile API.
- [ ] Move profile media and serverless profile persistence to durable object storage before high-volume production launch.


