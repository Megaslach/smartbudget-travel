interface BudgetEstimate {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  total: number;
  currency: string;
}

const COST_PER_DAY_PER_PERSON: Record<string, { accommodation: number; food: number; transport: number; activities: number }> = {
  default: { accommodation: 80, food: 40, transport: 25, activities: 30 },
  paris: { accommodation: 120, food: 55, transport: 20, activities: 40 },
  tokyo: { accommodation: 100, food: 45, transport: 30, activities: 35 },
  new_york: { accommodation: 150, food: 60, transport: 25, activities: 50 },
  bangkok: { accommodation: 35, food: 15, transport: 10, activities: 20 },
  bali: { accommodation: 40, food: 15, transport: 12, activities: 18 },
  london: { accommodation: 130, food: 50, transport: 25, activities: 45 },
  rome: { accommodation: 90, food: 40, transport: 18, activities: 30 },
  barcelona: { accommodation: 85, food: 35, transport: 15, activities: 28 },
  marrakech: { accommodation: 45, food: 20, transport: 10, activities: 15 },
  dubai: { accommodation: 110, food: 50, transport: 30, activities: 45 },
};

function normalizeDestination(destination: string): string {
  return destination.toLowerCase().replace(/[\s-]/g, '_');
}

export function estimateBudget(destination: string, duration: number, people: number): BudgetEstimate {
  const key = normalizeDestination(destination);
  const rates = COST_PER_DAY_PER_PERSON[key] || COST_PER_DAY_PER_PERSON.default;

  const accommodation = rates.accommodation * duration * Math.ceil(people / 2);
  const food = rates.food * duration * people;
  const transport = rates.transport * duration * people;
  const activities = rates.activities * duration * people;
  const total = accommodation + food + transport + activities;

  return {
    accommodation: Math.round(accommodation),
    food: Math.round(food),
    transport: Math.round(transport),
    activities: Math.round(activities),
    total: Math.round(total),
    currency: 'EUR',
  };
}
