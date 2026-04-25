import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

type Plan = 'oneshot' | 'annual';

const getPriceIdForPlan = (plan: Plan): string => {
  if (plan === 'oneshot') return env.STRIPE_PRICE_ID_ONESHOT;
  if (plan === 'annual') return env.STRIPE_PRICE_ID_ANNUAL;
  throw new Error(`Plan inconnu: ${plan}`);
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const computePremiumUntil = (plan: Plan, from: Date = new Date()): Date => {
  if (plan === 'oneshot') return addDays(from, 30);
  if (plan === 'annual') return addDays(from, 365);
  throw new Error(`Plan inconnu: ${plan}`);
};

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    const plan = (req.body?.plan as Plan) || 'oneshot';
    if (plan !== 'oneshot' && plan !== 'annual') {
      res.status(400).json({ error: 'Plan invalide. Attendu: oneshot | annual' });
      return;
    }

    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      res.status(500).json({ error: `STRIPE_PRICE_ID_${plan.toUpperCase()} non configure` });
      return;
    }

    const now = new Date();
    const isCurrentlyPremium = user.premiumUntil && user.premiumUntil > now;
    if (isCurrentlyPremium && plan === 'annual') {
      res.status(400).json({ error: 'Vous avez deja un abonnement annuel actif' });
      return;
    }

    let customerId: string;
    const existingSub = await prisma.subscription.findUnique({ where: { userId: user.id } });

    if (existingSub) {
      customerId = existingSub.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: customerId,
          status: 'pending',
        },
      });
    }

    const mode: 'payment' | 'subscription' = plan === 'oneshot' ? 'payment' : 'subscription';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${env.CLIENT_URL}/dashboard?upgraded=true&plan=${plan}`,
      cancel_url: `${env.CLIENT_URL}/pricing?cancelled=true`,
      metadata: { userId: user.id, plan },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('CreateCheckoutSession error:', error?.message || error, error?.type, error?.statusCode);
    res.status(500).json({ error: error?.message || 'Erreur lors de la création de la session de paiement' });
  }
};

export const createPortalSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!subscription?.stripeCustomerId) {
      res.status(400).json({ error: "Aucun abonnement à gérer" });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.CLIENT_URL}/profile`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('CreatePortalSession error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur lors de la création du portail' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          metadata?: { userId?: string; plan?: string };
          subscription?: string;
          mode?: string;
        };
        const userId = session.metadata?.userId;
        const plan = (session.metadata?.plan as Plan) || 'oneshot';

        if (userId) {
          const premiumUntil = computePremiumUntil(plan);

          await prisma.user.update({
            where: { id: userId },
            data: {
              isPremium: true,
              premiumUntil,
              premiumPlan: plan,
            },
          });

          await prisma.subscription.update({
            where: { userId },
            data: {
              status: 'active',
              stripeSubscriptionId: (session.subscription as string) || null,
            },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as { subscription?: string; customer?: string };
        if (invoice.subscription) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription },
          });
          if (sub) {
            const user = await prisma.user.findUnique({ where: { id: sub.userId } });
            const plan = (user?.premiumPlan as Plan) || 'annual';
            const premiumUntil = computePremiumUntil(plan);
            await prisma.user.update({
              where: { id: sub.userId },
              data: { isPremium: true, premiumUntil },
            });
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: 'active' },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as { id: string };
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (sub) {
          await prisma.user.update({
            where: { id: sub.userId },
            data: { isPremium: false, premiumUntil: null, premiumPlan: null },
          });

          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'cancelled' },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Erreur webhook' });
  }
};
