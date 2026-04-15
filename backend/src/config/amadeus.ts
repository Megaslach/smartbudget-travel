import Amadeus from 'amadeus';
import { env } from './env';

let amadeusClient: Amadeus | null = null;

export function getAmadeus(): Amadeus | null {
  if (!env.AMADEUS_CLIENT_ID || !env.AMADEUS_CLIENT_SECRET) {
    return null;
  }

  if (!amadeusClient) {
    amadeusClient = new Amadeus({
      clientId: env.AMADEUS_CLIENT_ID,
      clientSecret: env.AMADEUS_CLIENT_SECRET,
      hostname: env.AMADEUS_ENV === 'production' ? 'production' : 'test',
    });
  }

  return amadeusClient;
}
