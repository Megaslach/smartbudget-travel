# SmartBudget Mobile

Native iOS + Android app built with Expo (React Native) + expo-router.

## Quick start

```bash
# From repo root, install all workspaces
npm install --legacy-peer-deps

# Start the Expo dev server
npm run dev:mobile
```

Open the QR code with the Expo Go app (iOS/Android) on your phone, or press `i` for iOS simulator (macOS only) / `a` for Android emulator.

## Architecture

The mobile app shares its types, API client, and utility functions with the web app via the `@smartbudget/shared` workspace package. Only the UI layer (React Native components) is duplicated.

```
mobile/
├── app/                  # File-based routing via expo-router
│   ├── (auth)/          # login, register
│   ├── (tabs)/          # home, simulate, trips, profile
│   └── simulation/[id]  # detail screen
├── components/          # Reusable UI primitives (Button, Input, Card)
├── contexts/            # AuthContext (mirrors web)
├── lib/
│   ├── api.ts           # Wired ApiClient with AsyncStorage token
│   └── theme.ts         # Design tokens (mirrors Tailwind config)
└── assets/              # Icons, splash, fonts
```

## Building for stores

Expo Application Services (EAS) handles cloud builds for iOS and Android — no Mac required.

```bash
# Install EAS CLI
npm install -g eas-cli

# Login + configure
eas login
eas build:configure

# Build
npm run build:android
npm run build:ios

# Submit to stores
npm run submit:android
npm run submit:ios
```

See `eas.json` for build profiles (development, preview, production).
