import { openai } from '../config/openai';
import { BudgetEstimate } from './budgetService';

export interface SmartTip {
  type: 'saving' | 'timing' | 'alternative' | 'insider' | 'warning';
  icon: string;
  title: string;
  description: string;
  potentialSaving?: number;
  isPremium: boolean;
}

export interface FlexibleDate {
  startDate: string;
  endDate: string;
  estimatedSaving: number;
  label: string;
}

export interface AiTipsResult {
  tips: SmartTip[];
  flexibleDates?: FlexibleDate[];
  bestBookingWindow: string;
  priceOutlook: 'rising' | 'stable' | 'falling';
  priceOutlookNote: string;
}

interface TipsInput {
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
  budget: BudgetEstimate;
  isPremium: boolean;
}

export async function generateSmartTips(input: TipsInput): Promise<AiTipsResult> {
  const { destination, departureCity, startDate, endDate, duration, people, budget, isPremium } = input;

  const prompt = `Tu es un expert voyage. Analyse ce budget et donne des conseils intelligents.

**Voyage:** ${departureCity} → ${destination}, ${startDate} au ${endDate} (${duration} nuits), ${people} pers.
**Budget estimé:** ${budget.total}€ total (vols: ${budget.flights.avgPrice}€/pers, hébergement: ${budget.accommodation.avgPerNight}€/nuit)
**Données réelles:** Vols=${budget.flights.isRealData ? 'OUI' : 'estimation'}, Hôtels=${budget.accommodation.isRealData ? 'OUI' : 'estimation'}

Retourne UNIQUEMENT ce JSON:
{
  "tips": [
    ${isPremium ? `
    {"type":"saving","icon":"💰","title":"<conseil économie>","description":"<détail précis avec montant>","potentialSaving":<montant€>,"isPremium":false},
    {"type":"timing","icon":"📅","title":"<meilleur moment pour réserver>","description":"<explication basée sur la saisonnalité>","isPremium":false},
    {"type":"alternative","icon":"✈️","title":"<alternative vol moins cher>","description":"<aéroport/compagnie/jour alternatif>","potentialSaving":<montant€>,"isPremium":true},
    {"type":"insider","icon":"🏨","title":"<astuce hébergement>","description":"<quartier moins cher, type alternatif>","potentialSaving":<montant€>,"isPremium":true},
    {"type":"insider","icon":"🍽️","title":"<astuce restauration locale>","description":"<où manger local pour économiser>","potentialSaving":<montant€>,"isPremium":true},
    {"type":"alternative","icon":"📆","title":"<dates alternatives moins chères>","description":"<décaler de X jours pour économiser>","potentialSaving":<montant€>,"isPremium":true},
    {"type":"warning","icon":"⚠️","title":"<à surveiller>","description":"<hausse/baisse attendue, événement local>","isPremium":false}
    ` : `
    {"type":"saving","icon":"💰","title":"<conseil économie principal>","description":"<détail>","potentialSaving":<montant€>,"isPremium":false},
    {"type":"timing","icon":"📅","title":"<quand réserver>","description":"<explication courte>","isPremium":false},
    {"type":"alternative","icon":"✈️","title":"<Débloquez les alternatives Premium>","description":"Passez en Premium pour voir les vols/dates alternatifs moins chers","isPremium":true}
    `}
  ],
  ${isPremium ? `"flexibleDates": [
    {"startDate":"<date -3j>","endDate":"<date -3j>","estimatedSaving":<économie€>,"label":"3 jours avant"},
    {"startDate":"<date +3j>","endDate":"<date +3j>","estimatedSaving":<économie€>,"label":"3 jours après"},
    {"startDate":"<date -7j>","endDate":"<date -7j>","estimatedSaving":<économie€>,"label":"1 semaine avant"}
  ],` : ''}
  "bestBookingWindow":"<ex: Réservez 6-8 semaines avant le départ>",
  "priceOutlook":"<rising|stable|falling>",
  "priceOutlookNote":"<explication tendance prix pour cette destination/période>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Expert voyage. JSON uniquement. Conseils réalistes basés sur les tendances du marché.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No AI response');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      tips: parsed.tips || [],
      flexibleDates: parsed.flexibleDates || undefined,
      bestBookingWindow: parsed.bestBookingWindow || 'Réservez le plus tôt possible',
      priceOutlook: parsed.priceOutlook || 'stable',
      priceOutlookNote: parsed.priceOutlookNote || '',
    };
  } catch (error) {
    console.error('AI Tips generation failed:', error);
    return {
      tips: [
        { type: 'timing', icon: '📅', title: 'Réservez à l\'avance', description: 'Les meilleurs prix sont généralement disponibles 6-8 semaines avant le départ.', isPremium: false },
        { type: 'saving', icon: '💰', title: 'Comparez les prix', description: 'Utilisez les liens de réservation pour comparer les offres.', isPremium: false },
      ],
      bestBookingWindow: 'Réservez 6-8 semaines avant le départ',
      priceOutlook: 'stable',
      priceOutlookNote: 'Tendance stable pour cette période.',
    };
  }
}
