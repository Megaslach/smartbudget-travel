# Web ↔ Mobile sync tracker

This file tracks which features are present on each platform so Claude can detect drift and port new work between web and mobile.

## How it works

When you tell Claude **"sync mobile from web"** or **"mets l'app à jour"**, Claude does:

1. Reads this file to find the last sync hashes (`lastSyncedFromWeb`, `lastSyncedFromMobile`).
2. Runs `git log <hash>..HEAD -- frontend/ packages/shared/` to list new web commits.
3. For each new commit, identifies the feature and ports it to mobile (`mobile/`), reusing logic from `packages/shared/` whenever possible.
4. Updates the hash field in this file once done.

The same logic runs in reverse for **"sync web from mobile"**.

> **Important:** Logic, types and API calls live in `packages/shared/` and are imported by both apps. Only UI (Tailwind/JSX vs React Native components) needs porting.

## Sync state

| Field | Hash | Date |
|---|---|---|
| `lastSyncedFromWeb`   | 489122e | 2026-04-25 |
| `lastSyncedFromMobile`| 489122e | 2026-04-25 |

## Feature parity matrix

Use this table to spot what's missing on either platform. ✅ = implemented, ⚠️ = partial, ❌ = missing, — = not applicable.

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| **Auth** | | | |
| Login / Register | ✅ | ✅ | |
| Show/hide password | ✅ | ✅ | |
| Profile edit | ✅ | ❌ | Mobile shows "Bientôt" |
| Account deletion | ✅ | ❌ | |
| **Simulation** | | | |
| Basic simulation form | ✅ | ✅ | |
| Destination autocomplete | ✅ | ❌ | Need port to mobile |
| Date picker (calendar) | ✅ | ❌ | Mobile uses text input — replace with `react-native-calendars` |
| Premium filters (style, pace, dietary…) | ✅ | ❌ | Premium-only |
| **Results** | | | |
| Budget breakdown card | ✅ | ✅ | |
| Flight/hotel options with deeplink | ✅ | ✅ | |
| Activities map | ✅ | ❌ | Mobile needs `react-native-maps` |
| AI tips card | ✅ | ❌ | |
| Itinerary day-by-day | ✅ | ❌ | Premium |
| Add-ons (eSIM, insurance, transfer) | ✅ | ❌ | |
| **Pro features** | | | |
| Comparator | ✅ | ❌ | |
| Trip generation (premium) | ✅ | ❌ | |
| Price alerts | ✅ | ❌ | |
| Flexible dates scan | ✅ | ❌ | |
| Collaboration / invites | ✅ | ❌ | |
| Comments | ✅ | ❌ | |
| **Payment** | | | |
| Stripe checkout (oneshot/annual) | ✅ | ⚠️ | Mobile opens browser; native iOS needs IAP |
| **Other** | | | |
| Dashboard / saved trips | ✅ | ✅ | |
| Profile screen | ✅ | ⚠️ | Most actions are stubs |
| Push notifications | — | ❌ | Mobile-only — Expo push |
| Offline mode | ❌ | ❌ | Mobile-only (later) |

## Conventions

- All shared logic (types, API client, formatters, business rules) goes in `packages/shared/`.
- A web-only feature (e.g. PDF export with `jspdf`) stays in `frontend/`.
- A mobile-only feature (e.g. push notifications) stays in `mobile/`.
- When porting, copy-paste is fine but **prefer extracting to `packages/shared/`** if the same logic could live in both.
- Commit prefixes:
  - `feat(shared):` — both platforms benefit
  - `feat(web):` — web-only
  - `feat(mobile):` — mobile-only
  - `feat:` — generic / both

## Manual sync command (for the user)

```bash
# See what changed on web since last mobile sync
git log $(grep lastSyncedFromWeb SYNC.md | grep -oE '[a-f0-9]{7,}')..HEAD -- frontend/ packages/shared/

# Same in reverse
git log $(grep lastSyncedFromMobile SYNC.md | grep -oE '[a-f0-9]{7,}')..HEAD -- mobile/ packages/shared/
```
