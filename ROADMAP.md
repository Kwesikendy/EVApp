# XCHARGE EV Platform — Commercial Production Roadmap

**Target:** Commercial release of Ghana's premier electric vehicle fast-charging and fleet management network.  
**Currency:** Ghana Cedi (`GH₵`)  
**Design Standard:** Hypercharge OS Dark (`#10141a` base, `#00f0ff` electric cyan)  
**Hardware Protocol:** OCPP 2.0.1 (CitrineOS CSMS compliant)  
**SMS & MoMo Provider:** Moolre Ghana Gateway  

---

## Progress Scorecard

| Domain | Completion | Status | Notes |
| :--- | :---: | :---: | :--- |
| **Mobile UI & UX Engine** | **100%** | **Production Ready** | Full driver auth, charging HUD, map explorer, split-wallet, and fleet controls. |
| **Ghana SMS OTP Telephony** | **100%** | **Live Active** | Moolre SMS gateway delivering real verification codes to Ghanaian networks (+233). |
| **Mobile Session Persistence** | **100%** | **Production Ready** | `SessionStorage` auto-login via `@react-native-async-storage/async-storage` + clean Sign Out. |
| **Database & Vehicle VIN Storage**| **90%** | **Production Ready** | Local persistent store (`data/users.json`) active across server restarts + Firestore schema ready. |
| **Ghana MoMo Payment Switch** | **65%** | **Prototype / In-Progress** | UI & high-fidelity simulator ready; pending live Moolre/Paystack webhook integration. |
| **OCPP 2.0.1 Telemetry Engine** | **80%** | **Advanced Core** | Remote start/stop, simulated live meter values, connector state transitions, CitrineOS schemas. |
| **Physical Charger WebSocket** | **40%** | **Pending Hardware** | Endpoints prepared; awaiting physical charger connection over `wss://`. |
| **Store Distribution (EAS)** | **50%** | **Configured** | `eas.json` generated; awaiting Play Store & Apple Developer credentials. |
| **Overall Commercial Progress** | **~75%** | **Live Production Beta** | Core authentication and persistence complete; entering live payments phase. |

---

## Detailed Roadmap Phases

```
Phase 1: Real Telephony & Auth  ──►  Phase 2: Live Payment Switch  ──►  Phase 3: Hardware Ingress  ──►  Phase 4: Store Distribution
   [COMPLETED & VERIFIED]             [CURRENT NEXT FOCUS]                 (Real OCPP WebSockets)          (iOS & Google Play)
```

---

### Phase 1: Real Telephony, Phone Auth & Persistent Data Storage
> **Status: 100% Core Complete**  
> **Primary Goal:** Multi-user authentication via real Ghanaian phone numbers, persistent local sessions, and reliable database storage.

#### Delivered Capabilities:
- [x] **Moolre SMS Gateway Integration**:
  - Live dispatch via `GET https://api.moolre.com/open/sms/send` with `X-API-VASKEY` authentication header.
  - Formats numbers cleanly into `233XXXXXXXXX` with registered Sender ID `Business_Ad`.
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
> **Status: Next Milestone to Build**  
> **Primary Goal:** Transition from simulated top-ups to actual Ghana Cedi debits and dynamic pre-auth escrow.

#### Planned Engineering:
1. **Moolre / Paystack MoMo Collections**:
   - Integrate Moolre MoMo API or Paystack Ghana API to trigger live USSD push prompts on MTN Mobile Money and Telecel Cash.
   - Support driver top-up amounts (e.g. GH₵ 50, GH₵ 100, GH₵ 250, GH₵ 500).
2. **Server Webhook Listener (`POST /api/momo/webhook`)**:
   - Expose an authenticated webhook endpoint to receive asynchronous instant payment confirmation from Ghanaian telecom networks.
   - Credit the driver's persistent wallet balance immediately upon successful PIN authorization.
3. **Dynamic Pre-Auth Escrow & Programmatic Refund**:
   - Hold an automated escrow deposit (e.g. GH₵ 50 or full battery estimate) before dispatching `RemoteStartTransaction` to the charger.
   - Continuously deduct accrued energy consumption in real time (`kwhDelivered * tariffPerKwh`).
   - Programmatically refund the exact unused escrow balance back to the driver's MoMo account immediately upon connector disengagement.

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

#### Planned Engineering:
1. **EAS Standalone App Builds**:
   - Run `eas build -p android --profile production` to generate Google Play Store `.aab` bundles.
   - Run `eas build -p ios --profile production` to build Apple iOS `.ipa` binaries.
2. **App Store & Google Play Console Submission**:
   - Package high-resolution app icons (1024x1024) and splash screens generated from [`public/xcharge-logo.svg`](file:///d:/xcharge-ev-platform/public/xcharge-logo.svg).
   - Configure privacy policies, Ghana telecom disclosures, and location permission declarations.
3. **Station Owner Web Admin Portal**:
   - Real-time management dashboard for station operators to inspect revenue (GH₵), active charging kilowatts, charger uptime, and tariff schedules.
