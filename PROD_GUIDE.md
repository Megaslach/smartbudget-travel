# Production guide — SmartBudget Travel

Tout ce qu'il faut faire / payer / configurer pour passer de "ça marche en démo" à "production solide qui peut prendre des paiements 24/7".

---

## 🎯 TL;DR — la roadmap

| Catégorie | Actuel | Cible prod | Coût/mois |
|---|---|---|---|
| **Vols (prix réels)** | SerpAPI + Sky Scrapper free | **Amadeus Self-Service** ou **Duffel** | ~50-200€ |
| **Hôtels** | SerpAPI + Hotellook free | **Hotellook + Booking direct** ou **Amadeus Hotel Search** | ~50-150€ |
| **Activités** | Liens GetYourGuide non-affilié | **GetYourGuide Partner Program** (commissions) | 0€ (commissions reverse) |
| **Voitures** | Liens Kayak non-affilié | **Rentalcars Partner** | 0€ (commissions) |
| **eSIM / Assurance** | Liens en dur | **Airalo Partner**, **Heymondo affiliate** | 0€ (commissions) |
| **IA / itinéraire** | OpenAI gpt-4o-mini | Garder + ajouter **GPT-4o** pour premium | ~30-100€ selon trafic |
| **Images** | Pexels free 200/h | **Pexels Pro** ou **Unsplash+** | 50-100€ |
| **Cartes** | Apple/Google Maps deep links | **Mapbox** (carte interactive embarquée) | ~50€ |
| **Email** | Aucun (ou Gmail SMTP) | **Resend** ou **Postmark** | 0-15€ |
| **Notifs push** | Aucune | **Expo Push** (gratuit) ou **OneSignal** | 0€ |
| **Monitoring** | Vercel basic + Vercel logs | **Sentry** + **Better Stack** | 0-30€ |
| **Analytics** | Aucune | **PostHog** ou **Mixpanel** | 0€ free tier |
| **iOS App Store** | — | Apple Developer Program | 99€/an |
| **Google Play** | — | Google Play Developer | 25€ one-time |
| **iOS in-app purchase** | Stripe (refusé par Apple) | **RevenueCat** + IAP | 0€ jusqu'à 2.5k$ MTR |

**Coût total estimé** pour une app live qui peut servir 1000 utilisateurs actifs : **~200-400€/mois** + ~125€ de frais one-shot Apple/Google.

---

## 1️⃣ APIs Vol — la priorité absolue

### ❌ Ce qu'il faut arrêter d'utiliser

- **Sky Scrapper RapidAPI** : non officiel, rate-limité, parfois en panne, données pas à jour. À jeter.
- **SerpAPI Google Flights** : excellent pour démos mais 50€/mois pour 5000 requêtes. OK comme backup, pas comme primaire.

### ✅ Ce qu'il faut utiliser en prod

#### **Amadeus Self-Service API** — recommandation #1
- **Pourquoi** : c'est le GDS (Global Distribution System) qu'utilisent les vraies agences de voyage. Données fiables, prix réels, possibilité de réservation.
- **Plan gratuit** : 2000 calls/mois pour tester
- **Plan prod** : à partir de 250€/mois (10k calls), pay-as-you-go au-delà
- **Inscription** : https://developers.amadeus.com → Self-Service
- **Endpoints clés** : `flight-offers-search`, `flight-offers-pricing`, `flight-create-orders`
- **Avantage différentiateur** : tu peux **vraiment booker** depuis ton app (commission 8-12%) au lieu de juste rediriger

#### **Duffel** — alternative moderne
- API plus propre, doc excellente, prix transparents
- Plan starter : ~150€/mois
- https://duffel.com/

#### **Travelpayouts** (déjà configuré chez toi)
- Excellent pour la **monétisation** (commissions sur Skyscanner, Aviasales)
- Garde-le comme couche d'affiliation au-dessus d'Amadeus

**Mon plan** : Amadeus en primaire pour les données + Travelpayouts pour wrapper les liens de réservation = double revenue (data + commissions).

---

## 2️⃣ APIs Hôtels

### ❌ À remplacer
- **SerpAPI Google Hotels** : OK mais cher
- **RapidAPI hotel scrapers** : pas fiable

### ✅ Stack recommandé

#### **Hotellook (Travelpayouts)** — déjà actif chez toi ✓
- Prix réels, large catalogue
- 0€ tant que tu génères des commissions
- Garde-le

#### **Booking.com Connectivity API**
- **Le must** mais demande approbation (1-2 mois)
- Programme "Booking.com Connectivity Partner"
- Commission ~15-25% sur les réservations
- https://partner.booking.com/en-gb/help/articles/booking-com-connectivity-api

#### **Amadeus Hotel Search** (en complément)
- Si tu prends Amadeus pour les vols, l'API hôtel est dans le même contrat
- Pratique pour avoir une seule facture

**Mon plan** : Hotellook (déjà OK) + commencer la candidature Booking Connectivity dès maintenant (long process).

---

## 3️⃣ Activités, voitures, add-ons — monétisation

Toutes sont en commission, **0€/mois mais revenue-share**. Inscris-toi tout de suite à :

| Programme | Commission | Lien |
|---|---|---|
| **GetYourGuide Partner** | 8% | https://partner.getyourguide.com |
| **Viator Partner** | 6-12% | https://www.partnerportal.viator.com |
| **Rentalcars Affiliate** | 4-7% | https://affiliate.rentalcars.com |
| **Airalo Partner** (eSIM) | 10% | https://www.airalo.com/partners |
| **Heymondo Affiliate** (assurance) | 25% | https://heymondo.com/affiliates/ |
| **Welcome Pickups Affiliate** (transferts) | 10% | https://www.welcomepickups.com/affiliates/ |
| **Wise / Revolut affiliates** (CB voyage) | 10-30€/signup | https://wise.com/affiliates |

**Action immédiate** : créer un compte chez chacun (1h de boulot), récupérer les marqueurs / partner IDs, les ajouter dans les env vars Vercel. Le code est déjà prêt à wrapper les liens (`affiliateService.ts`).

---

## 4️⃣ IA & génération d'itinéraires

### Setup actuel
- OpenAI `gpt-4o-mini` (rapide, ~3€ / 1M tokens) — bon défaut

### Recommandations prod

#### **Tier free (utilisateurs gratuits)**
- Garder `gpt-4o-mini` pour les conseils basiques
- Cache agressif côté backend : si quelqu'un a déjà demandé "Tokyo 7j famille", on cache la réponse 24h

#### **Tier premium**
- Passer à **`gpt-4o`** (plus cher mais résultats plus fins, ~30€ / 1M tokens)
- Ou tester **Claude 3.5 Sonnet** via Anthropic API (souvent meilleurs itinéraires de voyage)

#### **Cache + queue**
- Mettre **Upstash Redis** (gratuit jusqu'à 10k req/jour) pour cacher
- Pour les itinéraires premium qui prennent 30s+, utiliser un **job queue** (Inngest, Trigger.dev) — l'utilisateur reçoit une notif push quand c'est prêt au lieu d'attendre

### Action immédiate
1. Créer un compte Anthropic (https://console.anthropic.com), tester Claude 3.5 sur 2-3 itinéraires, comparer
2. Créer Upstash : https://upstash.com → Redis → DB gratuite
3. Mettre l'URL dans `REDIS_URL` env var (le backend en aura besoin)

---

## 5️⃣ Images

### Actuel
- Pexels free 200 req/h ✓

### Prod
- **Pexels Pro** : 50€/mois pour 5000 req/h
- OU **Unsplash+** : 99€/mois pour 100k req/mois
- L'idéal : **CDN ton propre catalogue** d'images de destinations populaires (Cloudflare Images, 5€/mois)

**Action** : on garde Pexels free pour l'instant, on monte si on hit la limite.

---

## 6️⃣ Cartes

### Actuel
- Pas de carte dans l'app mobile (juste deep links Apple/Google Maps)
- Carte Leaflet sur le web ✓

### Recommandation
- **Mapbox** sur mobile + web : 50€/mois pour 50k chargements
- Permet une carte interactive avec markers personnalisés, exactement comme sur le web
- Setup mobile : `@rnmapbox/maps`

---

## 7️⃣ Email transactionnel

### Actuel
- Aucun (pas d'envoi d'emails)

### Tu en auras besoin pour
- Confirmation de compte
- Reset password
- Reçus de paiement
- Alertes de prix (côté backend, déjà codé mais pas envoyé)

### Recommandation
- **Resend** : gratuit jusqu'à 3000 emails/mois, 20€/mois pour 50k
- API ultra simple, intégration en 5 min
- DKIM + SPF gérés automatiquement
- https://resend.com

---

## 8️⃣ Push notifications

### Actuel
- Aucune

### Cas d'usage prod
- "Le prix de ton vol Tokyo a baissé de 80€"
- "Ton ami X a accepté ton invitation"
- "Ton voyage à Lisbonne approche, voici ton itinéraire"

### Stack
- **Expo Push** : gratuit, intégré nativement à ton app Expo
- Côté backend : `expo-server-sdk` (npm) — 5 lignes de code
- Plus tard, si volume : **OneSignal** (gratuit jusqu'à 10k devices)

---

## 9️⃣ Monitoring & alerting

### Actuel
- Vercel logs (basique)
- Pas d'alerting

### Recommandation
- **Sentry** : 0€ free tier (5k events/mois), 30€/mois pro
  - Capture toutes les erreurs JS (mobile + web + backend)
  - Source maps pour stack traces lisibles
- **Better Stack (Logtail)** : 0€ free tier, alertes Slack/email
  - Logs centralisés
  - Uptime monitoring (ping de `/api/health` toutes les minutes)

### Action immédiate
1. Créer compte Sentry (https://sentry.io)
2. `npx @sentry/wizard@latest -i react-native` dans `mobile/`
3. Pareil pour `frontend/` et `backend/`
4. Compte Better Stack pour ping `/api/health`

---

## 🔟 Analytics produit

### Actuel
- Aucune

### Pourquoi c'est vital en prod
- Comprendre quelles fonctionnalités sont utilisées
- Mesurer le funnel de conversion (free → premium)
- Voir où les users abandonnent (étape du wizard, page de paiement…)

### Recommandation
- **PostHog** : gratuit jusqu'à 1M events/mois, EU-hosted (RGPD)
  - Tracking événements + replay sessions + feature flags
- Alternative : **Mixpanel** (1k events/mois gratuit, plus orienté funnel)

---

## 1️⃣1️⃣ Paiements

### Actuel
- Stripe Checkout via browser (mobile) — **Apple va refuser pour iOS**

### Prod iOS
- **RevenueCat** + **IAP Apple/Google**
  - Apple **impose** IAP pour les apps non-physical-goods (= 30% commission Apple)
  - RevenueCat unifie Apple IAP + Google Play Billing + Stripe (web)
  - Gratuit jusqu'à 2.5k$/mois MTR (Monthly Tracked Revenue)
- https://www.revenuecat.com

### Prod Android
- Soit Google Play Billing (15% commission)
- Soit garder Stripe (mais pas pour Android Play Store, juste si side-loading)

### Plan
1. Apple Developer Program 99€/an
2. Configurer le compte App Store Connect
3. Créer 2 IAP : `oneshot_4_99` (consumable) + `annual_29` (auto-renewable subscription)
4. Wrapper avec RevenueCat (pareil pour Google Play)
5. Migrer le code mobile pour appeler `Purchases.purchasePackage()` au lieu d'ouvrir Stripe

---

## 1️⃣2️⃣ Hosting & DB

### Actuel
- Frontend : Netlify (gratuit)
- Backend : Vercel Pro (?) — confirme ton plan
- DB : Neon free tier

### Recommandations prod

| Service | Plan recommandé | Coût |
|---|---|---|
| **Vercel** | Pro (1 dev) | 20$/mois |
| **Neon** | Launch | 19$/mois (3 GB, branching, point-in-time restore) |
| **Netlify** | Free suffit | 0€ |

**Pourquoi Neon Launch** : le plan free a juste 0.5 GB et peut auto-pause après 5 jours d'inactivité. Pour de la prod, il te faut le **branching** (créer une DB de staging, faire des tests sans casser la prod) et le **point-in-time restore** (revenir à n'importe quel moment des 30 derniers jours en cas de drame — comme l'écrasement qu'on vient de vivre).

---

## 1️⃣3️⃣ Sécurité

### À faire avant la prod
- [ ] Activer 2FA sur tous les comptes (Vercel, Netlify, Neon, Stripe, GitHub, Apple, Google Play)
- [ ] **Mettre les vraies clés Stripe en mode live** (actuellement test). 5 min sur le dashboard Stripe.
- [ ] Configurer le webhook Stripe en mode live (pas test) sur `https://smartbudget-api.vercel.app/api/webhook`
- [ ] Rate limiting sur les endpoints publics (`express-rate-limit` — 5 lignes de code)
- [ ] CORS strict (déjà en place, à vérifier)
- [ ] Variables d'env en mode "Sensitive" sur Vercel
- [ ] Politique de mot de passe : minimum 8 caractères + 1 majuscule + 1 chiffre

---

## 1️⃣4️⃣ Légal — RGPD & CGU

### Obligatoire avant de prendre des paiements
- **CGU + Politique de confidentialité** : utilise un générateur (Termly, iubenda) ~10€/mois
- **Mentions légales** : nom du gestionnaire, SIRET, adresse de facturation
- **Cookies** : bannière de consentement (Cookiebot ou Termly)
- **Email RGPD** : `privacy@smartbudget.app` qui répond aux demandes (export/delete)
- Le code a déjà l'API `deleteAccount` ✓

### Hébergement EU
- Neon : actuellement `eu-central-1` (Frankfurt) ✓
- Vercel : à vérifier — sinon migrer vers Vercel `cdg1` (Paris)
- Pexels : USA (mais c'est juste des images, pas de PII donc OK)

---

## 📋 Checklist de mise en prod

Quand tu seras prêt, voilà l'ordre :

### Semaine 1 — Légal & paiements
- [ ] Apple Developer Program (99€)
- [ ] Google Play Developer (25€)
- [ ] Stripe en mode Live (config webhooks, pricing en EUR)
- [ ] CGU + Privacy Policy (Termly)
- [ ] Compte société / auto-entrepreneur si pas déjà fait

### Semaine 2 — Infra & monitoring
- [ ] Neon Launch plan (19$)
- [ ] Vercel Pro (20$)
- [ ] Sentry (gratuit + clé)
- [ ] PostHog (gratuit + clé)
- [ ] Resend pour les emails (clé API)
- [ ] Domaine custom : `smartbudget.app` ou `.travel` (~12€/an)

### Semaine 3 — APIs travel
- [ ] Demander Amadeus Self-Service production
- [ ] Inscription tous les programmes affiliés (GetYourGuide, Viator, Rentalcars, Airalo, Heymondo)
- [ ] Récupérer les marqueurs et les ajouter aux env vars Vercel
- [ ] Tester chaque cascade

### Semaine 4 — Mobile prod
- [ ] EAS Build production (Android + iOS)
- [ ] RevenueCat setup avec IAP Apple/Google
- [ ] App Store Connect : screenshots, description, mots-clés
- [ ] Play Console : screenshots, description, classification
- [ ] Soumission TestFlight + soft launch sur 10 betatesters
- [ ] Ajustements suite aux retours
- [ ] Soumission release publique

### Estimation totale
- **Setup** (one-shot) : ~150€ (Apple + Google + Termly setup)
- **Mensuel** stabilisé (1000 utilisateurs actifs) : ~250-400€
- **ROI** : avec 5% conversion (50 abonnés annuels @ 29€ = 1450€/mois) tu es rentable. Avec les commissions affiliées en plus, c'est beaucoup mieux.

---

## 🚀 Prochaines actions concrètes

1. **Cette semaine** : créer les comptes affiliés (GetYourGuide, Viator, Rentalcars, Airalo, Heymondo) — 1h, 0€, gain immédiat dès qu'un user clique
2. **Cette semaine** : Amadeus Self-Service free tier (2000 calls/mois) — remplace Sky Scrapper
3. **Ce mois** : Apple Developer + Stripe Live + RevenueCat — pré-requis App Store
4. **Ce mois** : Sentry + PostHog — instrumentation pour comprendre ce qui se passe
5. **Avant lancement** : audit légal (CGU, Privacy) + Neon Launch (backup au cas où)

Dis-moi sur quoi tu veux qu'on attaque en priorité — je peux écrire le code d'intégration de n'importe lequel.
