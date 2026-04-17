import { env } from '../config/env';
import { withAffiliate } from '../config/affiliates';

export type AddonCategory = 'esim' | 'insurance' | 'transfer' | 'fork';

export interface AddonOption {
  id: string;
  category: AddonCategory;
  provider: string;
  name: string;
  description: string;
  price: number;
  priceLabel?: string;
  bookingUrl: string;
  features: string[];
  icon: string;
  recommended?: boolean;
}

type Region = 'europe' | 'north_america' | 'latin_america' | 'asia' | 'middle_east' | 'africa' | 'oceania' | 'global';

function detectRegion(destination: string): Region {
  const d = destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const map: Array<{ region: Region; keywords: string[] }> = [
    { region: 'europe', keywords: ['france', 'paris', 'espagne', 'spain', 'madrid', 'barcelone', 'barcelona', 'italie', 'italy', 'rome', 'milan', 'venise', 'florence', 'portugal', 'lisbonne', 'porto', 'allemagne', 'germany', 'berlin', 'munich', 'pays-bas', 'netherlands', 'amsterdam', 'belgique', 'belgium', 'bruxelles', 'suisse', 'switzerland', 'geneve', 'zurich', 'royaume-uni', 'uk', 'london', 'londres', 'angleterre', 'grece', 'greece', 'athenes', 'santorin', 'mykonos', 'crete', 'irlande', 'ireland', 'dublin', 'autriche', 'austria', 'vienne', 'prague', 'budapest', 'croatie', 'croatia', 'pologne', 'poland', 'varsovie', 'copenhague', 'stockholm', 'oslo', 'helsinki', 'reykjavik', 'islande', 'iceland'] },
    { region: 'north_america', keywords: ['usa', 'etats-unis', 'united states', 'new york', 'los angeles', 'miami', 'san francisco', 'las vegas', 'chicago', 'boston', 'washington', 'seattle', 'orlando', 'hawaii', 'canada', 'montreal', 'toronto', 'vancouver'] },
    { region: 'latin_america', keywords: ['mexique', 'mexico', 'cancun', 'tulum', 'bresil', 'brazil', 'rio', 'sao paulo', 'argentine', 'argentina', 'buenos aires', 'perou', 'peru', 'lima', 'cusco', 'machu picchu', 'colombie', 'colombia', 'bogota', 'medellin', 'chili', 'chile', 'santiago', 'cuba', 'havane', 'republique dominicaine', 'punta cana', 'costa rica', 'panama'] },
    { region: 'asia', keywords: ['japon', 'japan', 'tokyo', 'kyoto', 'osaka', 'thailande', 'thailand', 'bangkok', 'phuket', 'chiang mai', 'vietnam', 'hanoi', 'ho chi minh', 'cambodge', 'cambodia', 'siem reap', 'indonesie', 'indonesia', 'bali', 'jakarta', 'malaisie', 'malaysia', 'kuala lumpur', 'singapour', 'singapore', 'philippines', 'manila', 'chine', 'china', 'pekin', 'beijing', 'shanghai', 'coree', 'korea', 'seoul', 'inde', 'india', 'delhi', 'mumbai', 'goa', 'sri lanka', 'maldives', 'taiwan', 'hong kong'] },
    { region: 'middle_east', keywords: ['dubai', 'emirats', 'uae', 'abu dhabi', 'qatar', 'doha', 'arabie', 'saudi', 'ryad', 'riyadh', 'oman', 'jordanie', 'jordan', 'amman', 'petra', 'israel', 'tel aviv', 'jerusalem', 'turquie', 'turkey', 'istanbul', 'cappadoce'] },
    { region: 'africa', keywords: ['maroc', 'morocco', 'marrakech', 'casablanca', 'tanger', 'tunisie', 'tunisia', 'egypte', 'egypt', 'le caire', 'cairo', 'luxor', 'senegal', 'dakar', 'afrique du sud', 'south africa', 'cape town', 'johannesburg', 'kenya', 'nairobi', 'tanzanie', 'tanzania', 'zanzibar', 'madagascar', 'maurice', 'mauritius', 'seychelles', 'reunion'] },
    { region: 'oceania', keywords: ['australie', 'australia', 'sydney', 'melbourne', 'brisbane', 'nouvelle-zelande', 'new zealand', 'auckland', 'fidji', 'fiji', 'polynesie', 'tahiti', 'bora bora'] },
  ];

  for (const { region, keywords } of map) {
    if (keywords.some((k) => d.includes(k))) return region;
  }
  return 'global';
}

const ESIM_CATALOG: Record<Region, Array<{ gb: string; days: number; price: number; recommended?: boolean }>> = {
  europe: [
    { gb: '1 GB', days: 7, price: 4.5 },
    { gb: '5 GB', days: 30, price: 16, recommended: true },
    { gb: '20 GB', days: 30, price: 42 },
  ],
  north_america: [
    { gb: '1 GB', days: 7, price: 4.5 },
    { gb: '5 GB', days: 30, price: 16, recommended: true },
    { gb: '20 GB', days: 30, price: 42 },
  ],
  latin_america: [
    { gb: '1 GB', days: 7, price: 8 },
    { gb: '3 GB', days: 15, price: 17, recommended: true },
    { gb: '10 GB', days: 30, price: 42 },
  ],
  asia: [
    { gb: '1 GB', days: 7, price: 4.5 },
    { gb: '5 GB', days: 30, price: 16, recommended: true },
    { gb: '20 GB', days: 30, price: 42 },
  ],
  middle_east: [
    { gb: '1 GB', days: 7, price: 9 },
    { gb: '5 GB', days: 30, price: 29, recommended: true },
    { gb: '20 GB', days: 30, price: 69 },
  ],
  africa: [
    { gb: '1 GB', days: 7, price: 9 },
    { gb: '5 GB', days: 30, price: 27, recommended: true },
    { gb: '10 GB', days: 30, price: 44 },
  ],
  oceania: [
    { gb: '1 GB', days: 7, price: 7 },
    { gb: '5 GB', days: 30, price: 22, recommended: true },
    { gb: '20 GB', days: 30, price: 56 },
  ],
  global: [
    { gb: '1 GB', days: 7, price: 7 },
    { gb: '5 GB', days: 30, price: 25, recommended: true },
    { gb: '20 GB', days: 30, price: 60 },
  ],
};

function buildAiraloUrl(destination: string): string {
  const base = `https://www.airalo.com/?search=${encodeURIComponent(destination)}`;
  if (!env.AIRALO_AFFILIATE_ID) return base;
  return `${base}&aff=${encodeURIComponent(env.AIRALO_AFFILIATE_ID)}`;
}

function buildEsimOptions(destination: string, duration: number, people: number): AddonOption[] {
  const region = detectRegion(destination);
  const catalog = ESIM_CATALOG[region];
  const url = buildAiraloUrl(destination);

  return catalog
    .filter((item) => item.days >= Math.min(duration, 30))
    .slice(0, 3)
    .map((item, i) => ({
      id: `esim-${i}`,
      category: 'esim' as const,
      provider: 'Airalo',
      name: `eSIM ${item.gb} · ${item.days} jours`,
      description: `Data mobile pour ${people} personne${people > 1 ? 's' : ''} · activation instantanée, pas de frais d'itinérance`,
      price: Math.round(item.price * people),
      priceLabel: `${item.price}€ × ${people}`,
      bookingUrl: url,
      features: ['Activation en 5 min', 'Pas de carte SIM physique', 'Compatible iPhone/Android récents'],
      icon: '📱',
      recommended: item.recommended,
    }));
}

function buildInsuranceOptions(duration: number, people: number): AddonOption[] {
  const baseUrl = env.CHAPKA_AFFILIATE_URL || 'https://www.chapkadirect.fr/';
  const mondialUrl = env.MONDIAL_ASSISTANCE_URL || 'https://www.mondial-assistance.fr/';

  const tiers = [
    {
      id: 'ins-basic',
      name: 'Essentielle',
      description: 'Couverture médicale + rapatriement jusqu\'à 500 000€',
      perPersonPerDay: 1.9,
      features: ['Frais médicaux 500k€', 'Rapatriement sanitaire', 'Assistance 24/7'],
      provider: 'Chapka',
      url: baseUrl,
    },
    {
      id: 'ins-comfort',
      name: 'Confort',
      description: 'Médical + bagages + annulation jusqu\'à 8 000€',
      perPersonPerDay: 3.2,
      features: ['Frais médicaux 1M€', 'Bagages 2 000€', 'Annulation 8 000€', 'Retard vol'],
      provider: 'Chapka',
      url: baseUrl,
      recommended: true,
    },
    {
      id: 'ins-premium',
      name: 'Tranquillité+',
      description: 'Couverture maximale + activités sportives + annulation toutes causes',
      perPersonPerDay: 5.5,
      features: ['Frais médicaux illimités', 'Bagages 5 000€', 'Annulation 15 000€', 'Sports aventure inclus'],
      provider: 'Mondial Assistance',
      url: mondialUrl,
    },
  ];

  return tiers.map((tier) => ({
    id: tier.id,
    category: 'insurance' as const,
    provider: tier.provider,
    name: `Assurance ${tier.name}`,
    description: tier.description,
    price: Math.round(tier.perPersonPerDay * duration * people),
    priceLabel: `${tier.perPersonPerDay}€/jour/pers × ${duration}j × ${people}`,
    bookingUrl: tier.url,
    features: tier.features,
    icon: '🛡️',
    recommended: tier.recommended,
  }));
}

function buildTransferOption(destination: string, people: number): AddonOption | null {
  const pricePerTransfer = people > 4 ? 75 : people > 2 ? 55 : 35;
  const totalPrice = pricePerTransfer * 2;

  const url = env.WELCOMEPICKUPS_AFFILIATE_URL
    ? `${env.WELCOMEPICKUPS_AFFILIATE_URL}?destination=${encodeURIComponent(destination)}`
    : `https://welcomepickups.com/?destination=${encodeURIComponent(destination)}`;

  return {
    id: 'transfer-airport',
    category: 'transfer',
    provider: 'Welcome Pickups',
    name: 'Transfert aéroport A/R',
    description: `Chauffeur privé aéroport → hôtel (aller + retour) pour ${people} personne${people > 1 ? 's' : ''}`,
    price: totalPrice,
    priceLabel: `${pricePerTransfer}€ × 2 trajets`,
    bookingUrl: url,
    features: ['Véhicule privé', 'Suivi vol en temps réel', 'Pas d\'attente taxi', 'Prix fixe à l\'avance'],
    icon: '🚕',
  };
}

function buildForkOption(destination: string, duration: number): AddonOption {
  const baseUrl = `https://www.thefork.fr/search/?cityName=${encodeURIComponent(destination)}`;
  const url = withAffiliate(baseUrl);

  return {
    id: 'fork-restaurants',
    category: 'fork',
    provider: 'TheFork',
    name: 'Réservations restaurants',
    description: `Jusqu'à -50% dans les meilleurs restaurants de ${destination}`,
    price: 0,
    priceLabel: 'Inclus dans budget food',
    bookingUrl: url,
    features: [`${duration > 3 ? '10+' : '5+'} restos recommandés`, 'Jusqu\'à -50% avec Yums', 'Réservation sans appel'],
    icon: '🍽️',
  };
}

export function generateAddons(input: {
  destination: string;
  duration: number;
  people: number;
}): AddonOption[] {
  const { destination, duration, people } = input;
  const addons: AddonOption[] = [];

  addons.push(...buildEsimOptions(destination, duration, people));
  addons.push(...buildInsuranceOptions(duration, people));

  const transfer = buildTransferOption(destination, people);
  if (transfer) addons.push(transfer);

  addons.push(buildForkOption(destination, duration));

  return addons;
}
