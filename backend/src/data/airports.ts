export interface Airport {
  code: string;
  name: string;
}

export interface City {
  name: string;
  country: string;
  countryCode: string;
  emoji: string;
  airports: Airport[];
  image: string;
  popular?: boolean;
}

export const cities: City[] = [
  // ========== FRANCE ==========
  { name: 'Paris', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'CDG', name: 'Charles de Gaulle' }, { code: 'ORY', name: 'Orly' }, { code: 'BVA', name: 'Beauvais' }], image: 'paris eiffel tower', popular: true },
  { name: 'Lyon', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'LYS', name: 'Saint-Exupéry' }], image: 'lyon france' },
  { name: 'Marseille', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'MRS', name: 'Provence' }], image: 'marseille calanques' },
  { name: 'Nice', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'NCE', name: 'Côte d\'Azur' }], image: 'nice french riviera' },
  { name: 'Toulouse', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'TLS', name: 'Blagnac' }], image: 'toulouse france' },
  { name: 'Bordeaux', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'BOD', name: 'Mérignac' }], image: 'bordeaux france' },
  { name: 'Nantes', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'NTE', name: 'Atlantique' }], image: 'nantes france' },
  { name: 'Strasbourg', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'SXB', name: 'Entzheim' }], image: 'strasbourg france' },
  { name: 'Montpellier', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'MPL', name: 'Méditerranée' }], image: 'montpellier france' },
  { name: 'Lille', country: 'France', countryCode: 'FR', emoji: '🇫🇷', airports: [{ code: 'LIL', name: 'Lesquin' }], image: 'lille france' },

  // ========== EUROPE ==========
  { name: 'Londres', country: 'Royaume-Uni', countryCode: 'GB', emoji: '🇬🇧', airports: [{ code: 'LHR', name: 'Heathrow' }, { code: 'LGW', name: 'Gatwick' }, { code: 'STN', name: 'Stansted' }, { code: 'LTN', name: 'Luton' }], image: 'london big ben', popular: true },
  { name: 'Barcelone', country: 'Espagne', countryCode: 'ES', emoji: '🇪🇸', airports: [{ code: 'BCN', name: 'El Prat' }], image: 'barcelona sagrada familia', popular: true },
  { name: 'Madrid', country: 'Espagne', countryCode: 'ES', emoji: '🇪🇸', airports: [{ code: 'MAD', name: 'Barajas' }], image: 'madrid spain' },
  { name: 'Rome', country: 'Italie', countryCode: 'IT', emoji: '🇮🇹', airports: [{ code: 'FCO', name: 'Fiumicino' }, { code: 'CIA', name: 'Ciampino' }], image: 'rome colosseum', popular: true },
  { name: 'Milan', country: 'Italie', countryCode: 'IT', emoji: '🇮🇹', airports: [{ code: 'MXP', name: 'Malpensa' }, { code: 'BGY', name: 'Bergamo' }], image: 'milan italy' },
  { name: 'Venise', country: 'Italie', countryCode: 'IT', emoji: '🇮🇹', airports: [{ code: 'VCE', name: 'Marco Polo' }], image: 'venice canal' },
  { name: 'Florence', country: 'Italie', countryCode: 'IT', emoji: '🇮🇹', airports: [{ code: 'FLR', name: 'Peretola' }], image: 'florence italy' },
  { name: 'Naples', country: 'Italie', countryCode: 'IT', emoji: '🇮🇹', airports: [{ code: 'NAP', name: 'Capodichino' }], image: 'naples italy' },
  { name: 'Amsterdam', country: 'Pays-Bas', countryCode: 'NL', emoji: '🇳🇱', airports: [{ code: 'AMS', name: 'Schiphol' }], image: 'amsterdam canals', popular: true },
  { name: 'Berlin', country: 'Allemagne', countryCode: 'DE', emoji: '🇩🇪', airports: [{ code: 'BER', name: 'Brandenburg' }], image: 'berlin germany' },
  { name: 'Munich', country: 'Allemagne', countryCode: 'DE', emoji: '🇩🇪', airports: [{ code: 'MUC', name: 'Franz Josef Strauss' }], image: 'munich germany' },
  { name: 'Francfort', country: 'Allemagne', countryCode: 'DE', emoji: '🇩🇪', airports: [{ code: 'FRA', name: 'Frankfurt' }], image: 'frankfurt skyline' },
  { name: 'Lisbonne', country: 'Portugal', countryCode: 'PT', emoji: '🇵🇹', airports: [{ code: 'LIS', name: 'Humberto Delgado' }], image: 'lisbon portugal', popular: true },
  { name: 'Porto', country: 'Portugal', countryCode: 'PT', emoji: '🇵🇹', airports: [{ code: 'OPO', name: 'Francisco Sá Carneiro' }], image: 'porto portugal' },
  { name: 'Prague', country: 'Tchéquie', countryCode: 'CZ', emoji: '🇨🇿', airports: [{ code: 'PRG', name: 'Václav Havel' }], image: 'prague czech republic', popular: true },
  { name: 'Vienne', country: 'Autriche', countryCode: 'AT', emoji: '🇦🇹', airports: [{ code: 'VIE', name: 'Schwechat' }], image: 'vienna austria' },
  { name: 'Budapest', country: 'Hongrie', countryCode: 'HU', emoji: '🇭🇺', airports: [{ code: 'BUD', name: 'Ferenc Liszt' }], image: 'budapest hungary' },
  { name: 'Athènes', country: 'Grèce', countryCode: 'GR', emoji: '🇬🇷', airports: [{ code: 'ATH', name: 'Elefthérios-Venizélos' }], image: 'athens parthenon', popular: true },
  { name: 'Santorin', country: 'Grèce', countryCode: 'GR', emoji: '🇬🇷', airports: [{ code: 'JTR', name: 'Santorin' }], image: 'santorini greece' },
  { name: 'Crète', country: 'Grèce', countryCode: 'GR', emoji: '🇬🇷', airports: [{ code: 'HER', name: 'Héraklion' }], image: 'crete greece' },
  { name: 'Dublin', country: 'Irlande', countryCode: 'IE', emoji: '🇮🇪', airports: [{ code: 'DUB', name: 'Dublin' }], image: 'dublin ireland' },
  { name: 'Édimbourg', country: 'Écosse', countryCode: 'GB', emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', airports: [{ code: 'EDI', name: 'Edinburgh' }], image: 'edinburgh scotland' },
  { name: 'Copenhague', country: 'Danemark', countryCode: 'DK', emoji: '🇩🇰', airports: [{ code: 'CPH', name: 'Kastrup' }], image: 'copenhagen denmark' },
  { name: 'Stockholm', country: 'Suède', countryCode: 'SE', emoji: '🇸🇪', airports: [{ code: 'ARN', name: 'Arlanda' }], image: 'stockholm sweden' },
  { name: 'Oslo', country: 'Norvège', countryCode: 'NO', emoji: '🇳🇴', airports: [{ code: 'OSL', name: 'Gardermoen' }], image: 'oslo norway' },
  { name: 'Helsinki', country: 'Finlande', countryCode: 'FI', emoji: '🇫🇮', airports: [{ code: 'HEL', name: 'Vantaa' }], image: 'helsinki finland' },
  { name: 'Reykjavik', country: 'Islande', countryCode: 'IS', emoji: '🇮🇸', airports: [{ code: 'KEF', name: 'Keflavík' }], image: 'reykjavik iceland aurora', popular: true },
  { name: 'Varsovie', country: 'Pologne', countryCode: 'PL', emoji: '🇵🇱', airports: [{ code: 'WAW', name: 'Chopin' }], image: 'warsaw poland' },
  { name: 'Cracovie', country: 'Pologne', countryCode: 'PL', emoji: '🇵🇱', airports: [{ code: 'KRK', name: 'Jean-Paul II' }], image: 'krakow poland' },
  { name: 'Bucarest', country: 'Roumanie', countryCode: 'RO', emoji: '🇷🇴', airports: [{ code: 'OTP', name: 'Henri Coandă' }], image: 'bucharest romania' },
  { name: 'Istanbul', country: 'Turquie', countryCode: 'TR', emoji: '🇹🇷', airports: [{ code: 'IST', name: 'Istanbul' }, { code: 'SAW', name: 'Sabiha Gökçen' }], image: 'istanbul blue mosque', popular: true },
  { name: 'Bruxelles', country: 'Belgique', countryCode: 'BE', emoji: '🇧🇪', airports: [{ code: 'BRU', name: 'Zaventem' }, { code: 'CRL', name: 'Charleroi' }], image: 'brussels belgium' },
  { name: 'Genève', country: 'Suisse', countryCode: 'CH', emoji: '🇨🇭', airports: [{ code: 'GVA', name: 'Genève' }], image: 'geneva switzerland' },
  { name: 'Zurich', country: 'Suisse', countryCode: 'CH', emoji: '🇨🇭', airports: [{ code: 'ZRH', name: 'Zurich' }], image: 'zurich switzerland' },
  { name: 'Dubrovnik', country: 'Croatie', countryCode: 'HR', emoji: '🇭🇷', airports: [{ code: 'DBV', name: 'Dubrovnik' }], image: 'dubrovnik croatia' },
  { name: 'Split', country: 'Croatie', countryCode: 'HR', emoji: '🇭🇷', airports: [{ code: 'SPU', name: 'Split' }], image: 'split croatia' },
  { name: 'Palma de Majorque', country: 'Espagne', countryCode: 'ES', emoji: '🇪🇸', airports: [{ code: 'PMI', name: 'Son Sant Joan' }], image: 'mallorca spain beach' },
  { name: 'Ibiza', country: 'Espagne', countryCode: 'ES', emoji: '🇪🇸', airports: [{ code: 'IBZ', name: 'Ibiza' }], image: 'ibiza spain' },
  { name: 'Tenerife', country: 'Espagne', countryCode: 'ES', emoji: '🇪🇸', airports: [{ code: 'TFS', name: 'Tenerife Sud' }], image: 'tenerife canary islands' },
  { name: 'Séville', country: 'Espagne', countryCode: 'ES', emoji: '🇪🇸', airports: [{ code: 'SVQ', name: 'San Pablo' }], image: 'seville spain' },
  { name: 'Malaga', country: 'Espagne', countryCode: 'ES', emoji: '🇪🇸', airports: [{ code: 'AGP', name: 'Costa del Sol' }], image: 'malaga spain' },

  // ========== AFRIQUE / MOYEN-ORIENT ==========
  { name: 'Marrakech', country: 'Maroc', countryCode: 'MA', emoji: '🇲🇦', airports: [{ code: 'RAK', name: 'Ménara' }], image: 'marrakech morocco', popular: true },
  { name: 'Casablanca', country: 'Maroc', countryCode: 'MA', emoji: '🇲🇦', airports: [{ code: 'CMN', name: 'Mohammed V' }], image: 'casablanca morocco' },
  { name: 'Tanger', country: 'Maroc', countryCode: 'MA', emoji: '🇲🇦', airports: [{ code: 'TNG', name: 'Ibn Battouta' }], image: 'tangier morocco' },
  { name: 'Tunis', country: 'Tunisie', countryCode: 'TN', emoji: '🇹🇳', airports: [{ code: 'TUN', name: 'Carthage' }], image: 'tunis tunisia' },
  { name: 'Le Caire', country: 'Égypte', countryCode: 'EG', emoji: '🇪🇬', airports: [{ code: 'CAI', name: 'Le Caire' }], image: 'cairo pyramids egypt' },
  { name: 'Dubaï', country: 'Émirats arabes unis', countryCode: 'AE', emoji: '🇦🇪', airports: [{ code: 'DXB', name: 'Dubai International' }], image: 'dubai skyline', popular: true },
  { name: 'Abu Dhabi', country: 'Émirats arabes unis', countryCode: 'AE', emoji: '🇦🇪', airports: [{ code: 'AUH', name: 'Zayed International' }], image: 'abu dhabi' },
  { name: 'Dakar', country: 'Sénégal', countryCode: 'SN', emoji: '🇸🇳', airports: [{ code: 'DSS', name: 'Blaise Diagne' }], image: 'dakar senegal' },
  { name: 'Le Cap', country: 'Afrique du Sud', countryCode: 'ZA', emoji: '🇿🇦', airports: [{ code: 'CPT', name: 'Cape Town' }], image: 'cape town south africa' },
  { name: 'Nairobi', country: 'Kenya', countryCode: 'KE', emoji: '🇰🇪', airports: [{ code: 'NBO', name: 'Jomo Kenyatta' }], image: 'nairobi kenya safari' },
  { name: 'Zanzibar', country: 'Tanzanie', countryCode: 'TZ', emoji: '🇹🇿', airports: [{ code: 'ZNZ', name: 'Abeid Amani Karume' }], image: 'zanzibar beach' },
  { name: 'Maurice', country: 'Maurice', countryCode: 'MU', emoji: '🇲🇺', airports: [{ code: 'MRU', name: 'SSR International' }], image: 'mauritius beach' },
  { name: 'La Réunion', country: 'France', countryCode: 'RE', emoji: '🇷🇪', airports: [{ code: 'RUN', name: 'Roland Garros' }], image: 'reunion island' },

  // ========== ASIE ==========
  { name: 'Tokyo', country: 'Japon', countryCode: 'JP', emoji: '🇯🇵', airports: [{ code: 'NRT', name: 'Narita' }, { code: 'HND', name: 'Haneda' }], image: 'tokyo japan skyline', popular: true },
  { name: 'Osaka', country: 'Japon', countryCode: 'JP', emoji: '🇯🇵', airports: [{ code: 'KIX', name: 'Kansai' }], image: 'osaka japan' },
  { name: 'Kyoto', country: 'Japon', countryCode: 'JP', emoji: '🇯🇵', airports: [{ code: 'KIX', name: 'Kansai (Osaka)' }], image: 'kyoto temples japan' },
  { name: 'Bangkok', country: 'Thaïlande', countryCode: 'TH', emoji: '🇹🇭', airports: [{ code: 'BKK', name: 'Suvarnabhumi' }, { code: 'DMK', name: 'Don Mueang' }], image: 'bangkok thailand temples', popular: true },
  { name: 'Phuket', country: 'Thaïlande', countryCode: 'TH', emoji: '🇹🇭', airports: [{ code: 'HKT', name: 'Phuket' }], image: 'phuket thailand beach' },
  { name: 'Bali', country: 'Indonésie', countryCode: 'ID', emoji: '🇮🇩', airports: [{ code: 'DPS', name: 'Ngurah Rai' }], image: 'bali indonesia rice terraces', popular: true },
  { name: 'Singapour', country: 'Singapour', countryCode: 'SG', emoji: '🇸🇬', airports: [{ code: 'SIN', name: 'Changi' }], image: 'singapore marina bay' },
  { name: 'Kuala Lumpur', country: 'Malaisie', countryCode: 'MY', emoji: '🇲🇾', airports: [{ code: 'KUL', name: 'KLIA' }], image: 'kuala lumpur twin towers' },
  { name: 'Hanoï', country: 'Vietnam', countryCode: 'VN', emoji: '🇻🇳', airports: [{ code: 'HAN', name: 'Nội Bài' }], image: 'hanoi vietnam' },
  { name: 'Hô Chi Minh-Ville', country: 'Vietnam', countryCode: 'VN', emoji: '🇻🇳', airports: [{ code: 'SGN', name: 'Tân Sơn Nhất' }], image: 'ho chi minh city vietnam' },
  { name: 'Séoul', country: 'Corée du Sud', countryCode: 'KR', emoji: '🇰🇷', airports: [{ code: 'ICN', name: 'Incheon' }], image: 'seoul south korea' },
  { name: 'Pékin', country: 'Chine', countryCode: 'CN', emoji: '🇨🇳', airports: [{ code: 'PEK', name: 'Capital' }, { code: 'PKX', name: 'Daxing' }], image: 'beijing great wall china' },
  { name: 'Shanghai', country: 'Chine', countryCode: 'CN', emoji: '🇨🇳', airports: [{ code: 'PVG', name: 'Pudong' }], image: 'shanghai skyline' },
  { name: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', emoji: '🇭🇰', airports: [{ code: 'HKG', name: 'Chek Lap Kok' }], image: 'hong kong skyline' },
  { name: 'New Delhi', country: 'Inde', countryCode: 'IN', emoji: '🇮🇳', airports: [{ code: 'DEL', name: 'Indira Gandhi' }], image: 'delhi india taj mahal' },
  { name: 'Mumbai', country: 'Inde', countryCode: 'IN', emoji: '🇮🇳', airports: [{ code: 'BOM', name: 'Chhatrapati Shivaji' }], image: 'mumbai india' },
  { name: 'Maldives', country: 'Maldives', countryCode: 'MV', emoji: '🇲🇻', airports: [{ code: 'MLE', name: 'Velana International' }], image: 'maldives overwater bungalow', popular: true },
  { name: 'Sri Lanka', country: 'Sri Lanka', countryCode: 'LK', emoji: '🇱🇰', airports: [{ code: 'CMB', name: 'Bandaranaike' }], image: 'sri lanka' },
  { name: 'Katmandou', country: 'Népal', countryCode: 'NP', emoji: '🇳🇵', airports: [{ code: 'KTM', name: 'Tribhuvan' }], image: 'kathmandu nepal himalaya' },

  // ========== AMÉRIQUES ==========
  { name: 'New York', country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', airports: [{ code: 'JFK', name: 'John F. Kennedy' }, { code: 'EWR', name: 'Newark' }, { code: 'LGA', name: 'LaGuardia' }], image: 'new york city skyline', popular: true },
  { name: 'Los Angeles', country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', airports: [{ code: 'LAX', name: 'Los Angeles' }], image: 'los angeles california' },
  { name: 'Miami', country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', airports: [{ code: 'MIA', name: 'Miami International' }], image: 'miami beach' },
  { name: 'San Francisco', country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', airports: [{ code: 'SFO', name: 'San Francisco' }], image: 'san francisco golden gate' },
  { name: 'Las Vegas', country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', airports: [{ code: 'LAS', name: 'Harry Reid' }], image: 'las vegas strip' },
  { name: 'Chicago', country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', airports: [{ code: 'ORD', name: 'O\'Hare' }], image: 'chicago skyline' },
  { name: 'Montréal', country: 'Canada', countryCode: 'CA', emoji: '🇨🇦', airports: [{ code: 'YUL', name: 'Trudeau' }], image: 'montreal canada' },
  { name: 'Toronto', country: 'Canada', countryCode: 'CA', emoji: '🇨🇦', airports: [{ code: 'YYZ', name: 'Pearson' }], image: 'toronto canada' },
  { name: 'Vancouver', country: 'Canada', countryCode: 'CA', emoji: '🇨🇦', airports: [{ code: 'YVR', name: 'Vancouver' }], image: 'vancouver canada mountains' },
  { name: 'Mexico', country: 'Mexique', countryCode: 'MX', emoji: '🇲🇽', airports: [{ code: 'MEX', name: 'Benito Juárez' }], image: 'mexico city' },
  { name: 'Cancún', country: 'Mexique', countryCode: 'MX', emoji: '🇲🇽', airports: [{ code: 'CUN', name: 'Cancún' }], image: 'cancun mexico beach', popular: true },
  { name: 'La Havane', country: 'Cuba', countryCode: 'CU', emoji: '🇨🇺', airports: [{ code: 'HAV', name: 'José Martí' }], image: 'havana cuba' },
  { name: 'Bogotá', country: 'Colombie', countryCode: 'CO', emoji: '🇨🇴', airports: [{ code: 'BOG', name: 'El Dorado' }], image: 'bogota colombia' },
  { name: 'Lima', country: 'Pérou', countryCode: 'PE', emoji: '🇵🇪', airports: [{ code: 'LIM', name: 'Jorge Chávez' }], image: 'lima peru machu picchu' },
  { name: 'Buenos Aires', country: 'Argentine', countryCode: 'AR', emoji: '🇦🇷', airports: [{ code: 'EZE', name: 'Ezeiza' }], image: 'buenos aires argentina' },
  { name: 'Rio de Janeiro', country: 'Brésil', countryCode: 'BR', emoji: '🇧🇷', airports: [{ code: 'GIG', name: 'Galeão' }], image: 'rio de janeiro christ redeemer', popular: true },
  { name: 'São Paulo', country: 'Brésil', countryCode: 'BR', emoji: '🇧🇷', airports: [{ code: 'GRU', name: 'Guarulhos' }], image: 'sao paulo brazil' },

  // ========== OCÉANIE ==========
  { name: 'Sydney', country: 'Australie', countryCode: 'AU', emoji: '🇦🇺', airports: [{ code: 'SYD', name: 'Kingsford Smith' }], image: 'sydney opera house', popular: true },
  { name: 'Melbourne', country: 'Australie', countryCode: 'AU', emoji: '🇦🇺', airports: [{ code: 'MEL', name: 'Tullamarine' }], image: 'melbourne australia' },
  { name: 'Auckland', country: 'Nouvelle-Zélande', countryCode: 'NZ', emoji: '🇳🇿', airports: [{ code: 'AKL', name: 'Auckland' }], image: 'auckland new zealand' },
  { name: 'Papeete', country: 'Polynésie française', countryCode: 'PF', emoji: '🇵🇫', airports: [{ code: 'PPT', name: 'Faa\'a' }], image: 'tahiti bora bora', popular: true },
  { name: 'Nouméa', country: 'Nouvelle-Calédonie', countryCode: 'NC', emoji: '🇳🇨', airports: [{ code: 'NOU', name: 'La Tontouta' }], image: 'new caledonia' },
];

export function searchCities(query: string): (City & { matchType: 'city' | 'airport' | 'country' })[] {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  return cities
    .map((city) => {
      const cityNorm = city.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const countryNorm = city.country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const airportMatch = city.airports.some(
        (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
      );

      if (cityNorm.includes(q)) return { ...city, matchType: 'city' as const, score: cityNorm.startsWith(q) ? 0 : 1 };
      if (airportMatch) return { ...city, matchType: 'airport' as const, score: 2 };
      if (countryNorm.includes(q)) return { ...city, matchType: 'country' as const, score: 3 };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.score - b!.score)
    .slice(0, 8) as (City & { matchType: 'city' | 'airport' | 'country' })[];
}
