# XCHARGE EV Platform — Workspace Agent Rules & Guidelines

These rules apply across the entire `xcharge-ev-platform` repository. All agentic workflows, edits, and tool calls must strictly comply with the following principles.

---

## 1. Single Source of Truth
- Prioritize [`PROJECT_CONTEXT.md`](file:///d:/xcharge-ev-platform/PROJECT_CONTEXT.md) and [`ROADMAP.md`](file:///d:/xcharge-ev-platform/ROADMAP.md) before making architectural decisions.
- Project skill: [`xcharge-platform`](file:///.agents/skills/xcharge-platform/SKILL.md).

---

## 2. Inviolable Core Constraints
1. **Currency**: Always use **Ghana Cedi** (`GH₵` or `GHS`). NEVER use `$`, `USD`, or generic currency signs.
2. **Phone Number Formatting**: Ghanaian numbers must normalize to `+233XXXXXXXXX` via `normalizeGhanaPhoneNumber()` in [`server/auth.ts`](file:///d:/xcharge-ev-platform/server/auth.ts).
3. **Branding & Logos**:
   - Never render plain text `"✕"` or generic icons for the logo. Use `<XChargeLogoNative />` or `<XChargeMarkNative />` from [`expo-mobile/XChargeLogoNative.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/XChargeLogoNative.tsx).
   - Use authentic inline SVG vector payment logos from [`expo-mobile/PaymentLogosNative.tsx`](file:///d:/xcharge-ev-platform/expo-mobile/PaymentLogosNative.tsx) (`MtnMomoLogoNative`, `TelecelLogoNative`, `MastercardLogoNative`) and [`src/components/PaymentLogos.tsx`](file:///d:/xcharge-ev-platform/src/components/PaymentLogos.tsx).
4. **Hypercharge OS Palette**:
   - Base: `#10141a`
   - Surface: `#181c22`
   - Primary Accent: `#00f0ff` (Electric Cyan)
   - Success: `#00e676`
   - Error: `#ff4d4d`
5. **Disk Persistence**:
   - User profiles, vehicle fleets, wallet balances, escrow holds, and transactions MUST persist to [`data/users.json`](file:///d:/xcharge-ev-platform/data/users.json) via `saveUsersToDisk()`.
6. **Server Port**:
   - Port is `5173` (not 3000). Always start server with `npm run dev` and mobile with `npm run tunnel` in `expo-mobile/`.

---

## 3. Standard Verification Commands
- **Backend Rebuild**: `npm run build` (runs Vite build and bundles `server.ts` into `dist/server.cjs`).
- **Mobile Typecheck**: `cd expo-mobile; npx tsc --noEmit`.
- **Git Push**: Push to `https://github.com/Kwesikendy/EVApp.git` on branch `main`.
