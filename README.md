# XCHARGE EV Platform

> **Ghana's Premier High-Speed Electric Vehicle Charging & Commercial Fleet Network**

Built with **React Native / Expo** for mobile drivers, powered by an **Express / OCPP 2.0.1 (CitrineOS)** backend, and integrated with the **Moolre Ghana Messaging Gateway** for live SMS OTP verification and Ghana Mobile Money.

---

## Quick Navigation

- 📖 **[Complete Project Context & Architecture (`PROJECT_CONTEXT.md`)](./PROJECT_CONTEXT.md)**: Deep dive into the architecture, design tokens, active credentials, file directory, and full implementation state.
- 🗺️ **[Commercial Production Roadmap (`ROADMAP.md`)](./ROADMAP.md)**: Milestone breakdown, progress scorecard, and next tasks from Phase 1 through Phase 4 (App Store / Play Store release).

---

## Quick Start

### 1. Start the Backend API Server
```bash
npm install
npm run dev
```
The server runs on `http://0.0.0.0:3000`.

### 2. Start the Mobile Driver App
```bash
cd expo-mobile
npm install
npx expo start
```
Scan the QR code with Expo Go on your physical Android or iOS device connected to the same Wi-Fi network.

---

## Core Specifications
- **Currency:** Ghana Cedi (`GH₵`)
- **Theme:** Hypercharge OS Dark (`#10141a` Obsidian, `#00f0ff` Electric Cyan)
- **SMS Gateway:** Moolre Ghana API (`https://api.moolre.com/open/sms/send`)
- **Persistence:** Local atomic JSON store (`data/users.json`) & Cloud Firestore (`firebase-applet-config.json`)
