import cron from 'node-cron';
import prisma from '../config/prisma';
import { estimateBudget } from './budgetService';
import { sendEmail, priceAlertEmailHtml } from './emailService';
import { env } from '../config/env';

async function checkOneSimulation(simId: string): Promise<void> {
  const sim = await prisma.simulation.findUnique({
    where: { id: simId },
    include: { user: { select: { email: true } } },
  });
  if (!sim || !sim.priceAlertEnabled) return;

  // Skip if trip already started
  const start = sim.startDate ? new Date(sim.startDate) : null;
  if (start && start < new Date()) return;

  try {
    const current = await estimateBudget({
      destination: sim.destination,
      departureCity: sim.departureCity,
      startDate: sim.startDate,
      endDate: sim.endDate,
      duration: sim.duration,
      people: sim.people,
    });

    await prisma.priceSnapshot.create({
      data: {
        simulationId: sim.id,
        total: current.total,
        flightPrice: current.flights.avgPrice,
        hotelPrice: current.accommodation.avgPerNight,
        breakdown: JSON.stringify(current),
      },
    });

    const reference = sim.lastPriceTotal ?? sim.budget;
    const diff = current.total - reference;
    const diffPercent = reference > 0 ? Math.round((diff / reference) * 100) : 0;

    await prisma.simulation.update({
      where: { id: sim.id },
      data: { lastPriceTotal: current.total, lastPriceCheckAt: new Date() },
    });

    if (Math.abs(diffPercent) >= sim.priceAlertThreshold) {
      const userName = sim.user.email.split('@')[0];
      const simulationUrl = `${env.CLIENT_URL}/dashboard?sim=${sim.id}`;
      await sendEmail(
        sim.user.email,
        `${diff < 0 ? '📉' : '📈'} Prix ${diff < 0 ? 'en baisse' : 'en hausse'} : ${sim.destination}`,
        priceAlertEmailHtml({
          userName,
          destination: sim.destination,
          oldTotal: Math.round(reference),
          newTotal: Math.round(current.total),
          diff: Math.round(diff),
          diffPercent,
          simulationUrl,
        })
      );
      console.log(`📨 Alert sent to ${sim.user.email} for ${sim.destination} (${diffPercent}%)`);
    }
  } catch (err) {
    console.error(`Price alert check failed for sim ${sim.id}:`, err);
  }
}

export async function runPriceAlertChecks(): Promise<{ checked: number }> {
  const sims = await prisma.simulation.findMany({
    where: { priceAlertEnabled: true },
    select: { id: true },
  });
  console.log(`🔔 Running price alerts for ${sims.length} simulations`);
  // Sequential to avoid rate-limit on upstream APIs
  for (const s of sims) {
    await checkOneSimulation(s.id);
  }
  return { checked: sims.length };
}

export function startPriceAlertCron(): void {
  const expression = env.PRICE_ALERT_CRON;
  if (!cron.validate(expression)) {
    console.warn(`⚠️  Invalid PRICE_ALERT_CRON "${expression}", skipping`);
    return;
  }
  cron.schedule(expression, () => {
    runPriceAlertChecks().catch((err) => console.error('Cron error:', err));
  });
  console.log(`⏰ Price alert cron scheduled: ${expression}`);
}
