// Smarter booking URLs — best we can do without affiliate partner APIs.
// Each strategy tries to land on the specific product page rather than
// a generic search results page.

/** Wraps a URL with Google "I'm Feeling Lucky" — redirects to the
 *  first matching result. Works ~80% of the time for landmarks/famous
 *  activities. Falls back gracefully to Google search if no clear winner. */
const googleLucky = (query: string, site?: string) => {
  const q = site ? `${query} site:${site}` : query;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&btnI=1`;
};

const slugify = (s: string) =>
  s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

/** Activity booking URL — uses GetYourGuide search with full context. */
export function buildActivityBookingUrl(activityName: string, destination: string): string {
  const cleanDest = destination.split(',')[0].trim();
  // GetYourGuide search with destination keyword — usually puts the right
  // product on top.
  const q = `${cleanDest} ${activityName}`;
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(q)}&searchSource=3`;
}

/** Alternative deep-link via Google "Feeling Lucky" for famous landmarks. */
export function buildActivityLuckyUrl(activityName: string, destination: string): string {
  const cleanDest = destination.split(',')[0].trim();
  return googleLucky(`${activityName} ${cleanDest} billet réservation`, 'getyourguide.com');
}

/** Hotel booking URL with Booking.com. Includes destination filter
 *  so the hotel name search is scoped to the right city. */
export function buildHotelBookingUrl(hotelName: string, destination: string): string {
  const cleanDest = destination.split(',')[0].trim();
  const params = new URLSearchParams({
    ss: `${hotelName} ${cleanDest}`,
    ssne: cleanDest,
    ssne_untouched: cleanDest,
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

/** Restaurant — opens TheFork search scoped to the destination. */
export function buildRestaurantUrl(restaurantName: string, destination: string): string {
  const cleanDest = destination.split(',')[0].trim();
  return `https://www.thefork.fr/search?cityName=${encodeURIComponent(cleanDest)}&searchInput=${encodeURIComponent(restaurantName)}`;
}

/** Wikipedia "summary" URL — useful for landmarks where we just want
 *  the info page, not a booking. */
export function buildWikipediaUrl(name: string): string {
  return `https://fr.wikipedia.org/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`;
}
