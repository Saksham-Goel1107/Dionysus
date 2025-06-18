// api/stripe/webhook

import { db } from "@/server/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  console.log("Webhook received:", event.type, session.id);

  if (event.type === "checkout.session.completed") {
    const credits = Number(session.metadata?.["credits"]);
    const userId = session.client_reference_id;

    if (!userId || !credits) {
      console.error("Missing userId or credits in webhook", { userId, credits });
      return NextResponse.json(
        { error: "Missing userId or credits" },
        { status: 400 },
      );
    }

    try {
      // Check if this transaction was already processed
      const existingTransaction = await db.stripeTransaction.findFirst({
        where: {
          userId,
          credits,
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 5), // Last 5 minutes
          },
        },
      });

      // If already processed via success page, don't duplicate
      if (existingTransaction) {
        console.log("Transaction already processed", existingTransaction);
        return NextResponse.json(
          { message: "Transaction already processed" },
          { status: 200 }
        );
      }

      await db.stripeTransaction.create({
        data: {
          userId,
          credits,
        },
      });

      await db.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: credits,
          },
        },
      });

      console.log("Credits added successfully via webhook", { userId, credits });
      return NextResponse.json(
        { message: "Credits added successfully!" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error processing webhook payment", error);
      return NextResponse.json(
        { error: "Error processing payment" },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({ message: "ok" });
}
