import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    if (user.isPremium) {
      res.status(400).json({ error: 'Vous êtes déjà premium' });
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

    console.log('[stripe] CLIENT_URL:', env.CLIENT_URL, 'PRICE_ID:', env.STRIPE_PRICE_ID);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${env.CLIENT_URL}/dashboard?upgraded=true`,
      cancel_url: `${env.CLIENT_URL}/pricing?cancelled=true`,
      metadata: { userId: user.id },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('CreateCheckoutSession error:', error?.message || error, error?.type, error?.statusCode);
    res.status(500).json({ error: error?.message || 'Erreur lors de la création de la session de paiement' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { metadata?: { userId?: string }; subscription?: string };
        const userId = session.metadata?.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { isPremium: true },
          });

          await prisma.subscription.update({
            where: { userId },
            data: {
              status: 'active',
              stripeSubscriptionId: session.subscription as string,
            },
          });
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
            data: { isPremium: false },
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
