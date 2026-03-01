import { eq, getDb, subscriptions, users } from "@changelogkit/db";
import { NextRequest, NextResponse } from "next/server";

import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import type { PlanKey } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const userId = session.metadata?.userId;
      const plan = (session.metadata?.plan ?? "starter") as PlanKey;

      if (!userId) {
        console.error("[webhook] Missing userId in checkout metadata");
        break;
      }

      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Update user plan and stripe customer id
      await db
        .update(users)
        .set({
          plan,
          stripeCustomerId: session.customer as string,
        })
        .where(eq(users.id, userId));

      // Upsert subscription record
      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const subData = {
        userId,
        stripeSubscriptionId: sub.id,
        status: sub.status,
        plan,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      };

      if (existing) {
        await db
          .update(subscriptions)
          .set(subData)
          .where(eq(subscriptions.userId, userId));
      } else {
        await db.insert(subscriptions).values(subData);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      const plan = (sub.metadata?.plan ?? "starter") as PlanKey;

      if (!userId) {
        console.error("[webhook] Missing userId in subscription metadata");
        break;
      }

      await db
        .update(users)
        .set({ plan })
        .where(eq(users.id, userId));

      await db
        .update(subscriptions)
        .set({
          status: sub.status,
          plan,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        })
        .where(eq(subscriptions.userId, userId));
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;

      if (!userId) {
        console.error("[webhook] Missing userId in subscription metadata");
        break;
      }

      // Downgrade to free
      await db
        .update(users)
        .set({ plan: "free" })
        .where(eq(users.id, userId));

      await db
        .delete(subscriptions)
        .where(eq(subscriptions.userId, userId));
      break;
    }

    default:
      // Ignore other events
      break;
  }
}
