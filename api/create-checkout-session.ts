import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase Admin once
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const db = getFirestore(firebaseConfig.firestoreDatabaseId);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, plan } = req.body;

  if (!uid || !plan) {
    return res.status(400).json({ error: "Missing uid or plan" });
  }

  const prices: Record<string, any> = {
    pro: {
      price_data: {
        currency: "eur",
        product_data: {
          name: "Edgio PRO - Mensual",
          description: "Suscripción mensual con acceso completo a análisis premium",
        },
        unit_amount: 2900,
        recurring: { interval: "month" },
      },
      quantity: 1,
    },
    annual: {
      price_data: {
        currency: "eur",
        product_data: {
          name: "Edgio ANNUAL - Suscripción Anual",
          description: "Un año completo de Edgio con 2 meses de regalo",
        },
        unit_amount: 29000,
        recurring: { interval: "year" },
      },
      quantity: 1,
    },
  };

  if (!prices[plan]) {
    return res.status(400).json({ error: `Invalid plan: ${plan}` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [prices[plan]],
      mode: "subscription",
      success_url: `${req.headers.origin || "http://" + req.headers.host}/?payment=success`,
      cancel_url: `${req.headers.origin || "http://" + req.headers.host}/?payment=cancel`,
      subscription_data: {
        metadata: { uid, plan },
      },
      metadata: { uid, plan },
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
}
