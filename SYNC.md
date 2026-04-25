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
| `lastSyncedFromWeb`   | 7b6e8e8 | 2026-04-25 |
| `lastSyncedFromMobile`| 7b6e8e8 | 2026-04-25 |

## Feature parity matrix

Use this table to spot what's missing on either platform. ✅ = implemented, ⚠️ = partial, ❌ = missing, — = not applicable.

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| **Auth** | | | |
| Login / Register | ✅ | ✅ | |
| Show/hide password | ✅ | ✅ | |
| Profile edit | ✅ | ✅ | Email + password modals |
| Account deletion | ✅ | ✅ | With confirmation alert |
| **Simulation** | | | |
| Basic simulation form | ✅ | ✅ | |
| Destination autocomplete | ✅ | ✅ | Native dropdown |
| Airport autocomplete (departure) | ✅ | ✅ | Native dropdown |
| Date picker (calendar) | ✅ | ✅ | Native iOS/Android picker |
| Premium filters (style, pace, dietary…) | ✅ | ✅ | Bottom sheet, gated by isPremium |
| **Results** | | | |
| Budget breakdown card | ✅ | ✅ | |
| Flight options list | ✅ | ✅ | |
| Hotel options list (with images) | ✅ | ✅ | |
| Activities full list | ✅ | ✅ | With images, prices |
| Local transport (cars + public) | ✅ | ✅ | |
| Add-ons (eSIM, insurance, transfer) | ✅ | ✅ | Display-only on mobile |
| Activities map | ✅ | ✅ | react-native-maps with category-colored markers |
| AI tips card | ✅ | ✅ | Outlook + tips + booking window |
| Flexible dates scan | ✅ | ✅ | Premium-gated, list of alternative dates |
| Itinerary day-by-day | ✅ | ✅ | Day tabs + timeline (no map yet) |
| Trip generation (premium) | ✅ | ✅ | Triggers from detail screen |
| **Pro features** | | | |
| Comparator | ✅ | ✅ | 2-4 destinations side-by-side |
| Price alerts | ✅ | ✅ | Toggle + threshold + bar sparkline |
| Collaboration / invites | ✅ | ✅ | Native Share API for invite link |
| Comments | ✅ | ✅ | Thread + add/delete |
| **Payment** | | | |
| Stripe checkout (oneshot/annual) | ✅ | ⚠️ | Mobile opens browser; native iOS needs IAP |
| **Other** | | | |
| Dashboard / saved trips | ✅ | ✅ | |
| Profile screen | ✅ | ✅ | Edit email/password + delete account |
| PDF export | ✅ | ❌ | Web-only (jspdf) — skip on mobile |
| Share trip link | ✅ | ✅ | Native Share sheet (iOS/Android) |
| Push notifications | — | ❌ | Mobile-only — Expo push (later) |
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
