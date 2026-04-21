import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Readable } from 'stream';

// Initialize Firebase Admin once
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const db = getFirestore(firebaseConfig.firestoreDatabaseId);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Helper to get raw body if needed in some environments
async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false, // Disabling bodyParser to handle raw Stripe body
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).send('Webhook Error: Missing signature or secret');
  }

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session: any = event.data.object;
        const uid = session.metadata?.uid;
        const plan = session.metadata?.plan || "pro";

        if (uid) {
          await db.collection("users").doc(uid).update({
            subscriptionStatus: plan,
            plan: plan, // Including both for compatibility and request
            updatedAt: new Date(),
          });
          console.log(`✅ User ${uid} upgraded to PRO`);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription: any = event.data.object;
        const uid = subscription.metadata?.uid;
        const status = subscription.status;
        const plan = subscription.metadata?.plan || "pro";

        if (uid) {
          const newStatus = status === "active" ? plan : "free";
          await db.collection("users").doc(uid).update({
            subscriptionStatus: newStatus,
            plan: newStatus,
            updatedAt: new Date(),
          });
          if (newStatus !== "free") {
            console.log(`✅ User ${uid} upgraded to PRO`);
          } else {
            console.log(`❌ User ${uid} downgraded to FREE`);
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription: any = event.data.object;
        const uid = subscription.metadata?.uid;

        if (uid) {
          await db.collection("users").doc(uid).update({
            subscriptionStatus: "free",
            plan: "free",
            updatedAt: new Date(),
          });
          console.log(`❌ User ${uid} downgraded to FREE`);
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
}
