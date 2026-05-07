# SmartBudget Travel

SaaS de simulation de budget voyage + génération d'itinéraire personnalisé.
**Web** (Next.js) + **Mobile** (React Native / Expo) + **API** (Express + Prisma + PostgreSQL).

> 🌍 **Web en production** : https://smartbudget-travel.netlify.app
> ⚙️ **API en production** : https://smartbudget-api.vercel.app/api

---

## 📐 Architecture

Le projet est un **monorepo npm workspaces** :

```
smartbudget-travel/
├── frontend/              # @smartbudget/web — Next.js 14 (App Router) + Tailwind  → Netlify
├── backend/               # @smartbudget/api — Express + Prisma + PostgreSQL       → Vercel
├── mobile/                # @smartbudget/mobile — Expo (React Native + expo-router)
└── packages/
    └── shared/            # @smartbudget/shared — types, ApiClient, image fetcher partagés
```

Le code partagé (types TS, client API, helpers de format, image fetcher Pexels/Wikipedia) vit dans `packages/shared/` et est importé par les 3 apps.

---

## 🚀 Démarrage rapide (local)

### Pré-requis

- **Node.js 18+** (ou 20+ recommandé)
- **npm 10+** (intégré à Node)
- **Git**
- (Mobile uniquement) **Expo Go** sur ton téléphone — gratuit sur App Store / Play Store
- (Optionnel) Une clé **Pexels API** gratuite : https://www.pexels.com/api/ — pour les images de destinations

### 1. Cloner et installer

```bash
git clone https://github.com/Megaslach/smartbudget-travel.git
cd smartbudget-travel
npm install --legacy-peer-deps
```

`--legacy-peer-deps` est nécessaire à cause de `react-leaflet@5` vs React 18.

### 2. Configurer les variables d'environnement

Crée 2 fichiers d'env (jamais commit, déjà dans `.gitignore`) :

#### `frontend/.env.local`
```bash
# L'API est en prod, pas besoin de la lancer en local pour bosser sur le front
NEXT_PUBLIC_API_URL=https://smartbudget-api.vercel.app/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
NEXT_PUBLIC_PEXELS_KEY=               # optionnel, pour de plus belles images
```

#### `mobile/.env`
```bash
EXPO_PUBLIC_API_URL=https://smartbudget-api.vercel.app/api
EXPO_PUBLIC_PEXELS_KEY=               # optionnel
```

> **Backend** : si tu veux le lancer en local (pour bosser sur l'API), tu auras besoin d'une DB Postgres. Voir la section **API en local** plus bas.

### 3. Lancer le **frontend web**

```bash
npm run dev:web
```

→ http://localhost:3000

L'app pointe sur l'API de prod (Vercel). Tu peux te logger avec un compte existant ou en créer un.

### 4. Lancer le **mobile**

```bash
npm run dev:mobile
```

Une fenêtre Expo s'ouvre avec un QR code :
- **iOS** → ouvre l'app **Caméra** native, vise le QR, tape la notif → Expo Go s'ouvre
- **Android** → ouvre **Expo Go** → "Scan QR code" → vise

> Premier chargement : ~30-60s. Ensuite c'est instantané grâce au hot reload.
> Si tu n'es pas sur le même WiFi que ton PC, lance avec `--tunnel` :
> ```bash
> cd mobile && npx expo start --tunnel
> ```

### 5. (Optionnel) Lancer l'**API en local**

Tu n'en as besoin que si tu modifies le backend.

```bash
cd backend
cp .env.example .env
```

Édite `backend/.env` avec :
```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET=any-long-random-string
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_ONESHOT=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
SERPAPI_KEY=...                       # optionnel
TRAVELPAYOUTS_TOKEN=...                # optionnel
TRAVELPAYOUTS_MARKER=...
PORT=4000
CLIENT_URL=http://localhost:3000
```

> **Pour la DB** : le plus simple c'est **Neon** gratuit (https://console.neon.tech).
> Crée un projet, copie la connection string dans `DATABASE_URL`.

Puis :
```bash
cd backend
npx prisma migrate deploy        # applique les migrations
npx prisma db push --accept-data-loss   # sync le schéma complet
npm run dev                       # serveur sur http://localhost:4000
```

Pour que le **frontend pointe sur ton API locale** : édite `frontend/.env.local` et mets `NEXT_PUBLIC_API_URL=http://localhost:4000/api`. Pareil pour mobile avec `EXPO_PUBLIC_API_URL`.

---

## 📦 Stack technique

| Couche | Techno |
|---|---|
| **Frontend web** | Next.js 14 (App Router), React 18, TailwindCSS, Framer Motion, Lucide icons |
| **Mobile** | Expo SDK 54, React Native 0.81, expo-router, react-native-calendars |
| **Backend** | Node.js, Express 4, TypeScript |
| **BDD** | PostgreSQL via Prisma 5 (hébergée sur Neon) |
| **Auth** | JWT (jsonwebtoken + bcryptjs), AsyncStorage côté mobile |
| **IA** | OpenAI API (gpt-4o-mini) |
| **Paiement** | Stripe Checkout + Customer Portal |
| **Validation** | Zod |
| **Cartes** | Apple/Google Maps deep links (mobile), Leaflet (web) |
| **Images** | Pexels API + Wikipedia + LoremFlickr fallback |
| **Hébergement** | Frontend → Netlify · API → Vercel · DB → Neon |

---

## 🔄 Workflow Git & déploiement automatique

**Les push sur `main` déclenchent un re-deploy automatique** :

| Service | Trigger | Durée |
|---|---|---|
| **Netlify** (frontend web) | push to `main` | ~3 min |
| **Vercel** (backend API) | push to `main` | ~2 min |

> Pas besoin de toucher à quoi que ce soit : tu commit, tu push, c'est en ligne 3 min plus tard.

### Conventions de commit

Préfixes utilisés (cf historique) :
- `feat(web):` / `feat(mobile):` / `feat(api):` / `feat(shared):` — nouvelle feature ciblée
- `feat:` — feature qui touche plusieurs apps
- `fix:` — correction de bug
- `chore:` — maintenance (lockfile, deps, etc.)
- `docs:` — documentation
- `refactor:` — réécriture sans changement fonctionnel

Exemple :
```
feat(mobile): wizard étape par étape pour génération d'itinéraire

- 7 étapes avec skip/back/next
- Récapitulatif final avant génération
```

### Branches

- `main` — production (auto-deploy)
- `feature/<nom>` ou `fix/<nom>` pour les modifs en cours
- Merger via PR sur GitHub recommandé pour les gros changements

---

## 🗄️ Travailler avec la base de données

La DB est sur **Neon** (Postgres managé, free tier).

### Modifier le schéma

1. Édite `backend/prisma/schema.prisma`
2. Génère le client : `cd backend && npx prisma generate`
3. Pour appliquer en prod :
   ```bash
   cd backend
   DATABASE_URL="…prod URL…" npx prisma db push
   ```
   ⚠️ `db push` modifie directement la DB. Pour un changement breaking, utiliser `prisma migrate dev --name xxx` puis commit le fichier de migration.

### Inspecter la DB en prod

```bash
cd backend
DATABASE_URL="…prod URL…" npx prisma studio
```
→ ouvre une interface web sur http://localhost:5555 pour voir/éditer les données.

---

## 📲 Build & distribution mobile

Le projet utilise **EAS** (Expo Application Services) pour les builds cloud.

### Build APK Android (preview, ~15 min)

```bash
cd mobile
eas login
eas build --platform android --profile preview
```

→ Tu reçois une URL de download APK. Partage-la, l'utilisateur installe en 1 clic.

### Build iOS (TestFlight)

Nécessite **Apple Developer Program** (99€/an).

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

### Profils EAS

Voir `mobile/eas.json` pour les profils `development`, `preview`, `production`.

---

## 🔑 Configuration des services externes

### Stripe (paiements)

1. Compte sur https://dashboard.stripe.com
2. En **mode test** : récupère les clés (`pk_test_…`, `sk_test_…`)
3. Crée 2 produits :
   - **One-shot 4,99€** (paiement unique)
   - **Annuel 29€/an** (récurrent)
4. Récupère les `price_…` de chaque
5. Configure le webhook : `https://smartbudget-api.vercel.app/api/webhook` → écoute `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
6. Mets toutes ces valeurs dans les env vars Vercel

### Pexels (images)

1. Inscris-toi sur https://www.pexels.com/api/ (gratuit, 200 req/h)
2. Récupère ta clé
3. Mets-la dans `frontend/.env.local` et `mobile/.env` (ou directement sur Netlify/EAS pour la prod)

### OpenAI (génération itinéraire + tips)

1. https://platform.openai.com → API keys → create
2. Mets `OPENAI_API_KEY` sur Vercel

### SerpAPI / Travelpayouts (prix réels)

Voir `PROD_GUIDE.md` pour les détails.

---

## 🐛 Debug & dépannage

### Le mobile ne charge pas

```bash
cd mobile && npx expo start --clear
```

Le flag `--clear` purge le cache Metro. Si ça persiste, vérifie qu'`Expo Go` sur ton tel est à jour (SDK 54+).

### "Unmatched Route" sur mobile

Le routing Expo a un cache de types. Reload l'app (secoue le tel → Reload).

### Build web qui plante

```bash
rm -rf frontend/.next frontend/node_modules
npm install --legacy-peer-deps
npm run build:web
```

### Erreur Prisma "column does not exist"

Le schéma a évolué sans qu'une migration soit créée. Sync via :
```bash
cd backend
DATABASE_URL="…" npx prisma db push --accept-data-loss
```

---

## 📁 Fichiers importants à lire

| Fichier | Pourquoi |
|---|---|
| `PROD_GUIDE.md` | Roadmap pour passer en prod (APIs payantes, monitoring, légal) |
| `SYNC.md` | Tracker de parité features web ↔ mobile |
| `mobile/eas.json` | Profils de build mobile |
| `backend/prisma/schema.prisma` | Schéma de la BDD |
| `packages/shared/src/api/client.ts` | Client API utilisé par web + mobile |
| `frontend/next.config.mjs` | Config Next.js (env vars exposées) |
| `mobile/app.json` | Config Expo (bundleIdentifier, plugins) |

---

## 🆘 Aide

- **Bug en prod** → check les logs Vercel : `vercel logs --level error -p smartbudget-api --since 1h`
- **Bug Netlify** → dashboard https://app.netlify.com → Site → Deploys
- **DB hs** → console Neon https://console.neon.tech
- **Tester un endpoint** : `curl https://smartbudget-api.vercel.app/api/health`

---

## 📝 Crédits

Projet par **Mathis Delmas**.
Tech stack & architecture : Next.js + Expo + monorepo workspaces, déployé sur Netlify + Vercel + Neon.
