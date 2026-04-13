# SmartBudget Travel

SaaS de simulation de budget voyage avec génération d'itinéraire IA.

## Architecture

```
projet-web/
├── backend/                    # API Express + Prisma + PostgreSQL
│   ├── prisma/schema.prisma    # Schéma BDD
│   └── src/
│       ├── config/             # env, prisma, openai, stripe
│       ├── controllers/        # authController, simulationController, tripController, stripeController
│       ├── middleware/          # auth (JWT), premiumGuard
│       ├── routes/             # authRoutes, simulationRoutes, tripRoutes, stripeRoutes
│       ├── services/           # budgetService, aiService
│       ├── validators/         # schemas (Zod)
│       └── server.ts           # Entry point
│
├── frontend/                   # Next.js 14 (App Router) + TailwindCSS
│   └── src/
│       ├── app/                # Pages (Home, Login, Register, Dashboard, Simulation, Pricing)
│       ├── components/
│       │   ├── atoms/          # Button, Input, Label, Card, Loader, Badge
│       │   ├── molecules/      # FormField, BudgetResultCard, PricingCard, Navbar
│       │   ├── organisms/      # SimulationForm, ResultsSection, PricingSection, DashboardPanel
│       │   └── templates/      # AuthLayout, DashboardLayout, LandingLayout
│       ├── context/            # AuthContext
│       ├── lib/                # API client
│       └── types/              # TypeScript interfaces
```

## Prérequis

- **Node.js** >= 18
- **PostgreSQL** en local ou distant
- **Clé OpenAI** (pour la génération d'itinéraire)
- **Compte Stripe** en mode test (pour le paywall)

## Installation & Lancement

### 1. Backend

```bash
cd backend
cp .env.example .env
# Remplir les variables dans .env (DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, STRIPE_SECRET_KEY, etc.)
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Le serveur démarre sur `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Remplir NEXT_PUBLIC_API_URL et NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev
```

L'application démarre sur `http://localhost:3000`.

## Stack technique

| Couche          | Technologie                       |
|-----------------|-----------------------------------|
| Frontend        | Next.js 14 (App Router), React 18 |
| Styling         | TailwindCSS, Framer Motion        |
| Architecture UI | Atomic Design                     |
| Backend         | Node.js, Express, TypeScript      |
| BDD             | PostgreSQL via Prisma              |
| Auth            | JWT (jsonwebtoken + bcryptjs)      |
| IA              | OpenAI API (GPT-3.5-turbo)        |
| Paiement        | Stripe Checkout (mode test)        |
| Validation      | Zod                               |

## Endpoints API

| Méthode | Route                        | Auth | Premium | Description                     |
|---------|------------------------------|------|---------|---------------------------------|
| POST    | /api/auth/register           | Non  | Non     | Inscription                     |
| POST    | /api/auth/login              | Non  | Non     | Connexion                       |
| GET     | /api/auth/me                 | Oui  | Non     | Profil utilisateur              |
| POST    | /api/simulate                | Oui  | Non     | Simuler un budget               |
| GET     | /api/user/simulations        | Oui  | Non     | Historique des simulations      |
| POST    | /api/generate-trip           | Oui  | Oui     | Générer un itinéraire IA        |
| POST    | /api/create-checkout-session | Oui  | Non     | Créer une session Stripe        |
| POST    | /api/webhook                 | Non  | Non     | Webhook Stripe                  |

## Configuration Stripe (mode test)

1. Créer un produit + prix récurrent dans le dashboard Stripe
2. Récupérer `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`
3. Pour tester le webhook en local : `stripe listen --forward-to localhost:4000/api/webhook`
4. Carte de test : `4242 4242 4242 4242`
