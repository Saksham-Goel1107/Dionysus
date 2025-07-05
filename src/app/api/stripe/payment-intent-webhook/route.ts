// api/stripe/payment-intent-webhook

import { db } from '@/server/db';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('Payment intent webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  if (event.type === 'payment_intent.succeeded') {
    const credits = Number(paymentIntent.metadata?.['credits']);
    const userId = paymentIntent.metadata?.['userId'];

    if (!userId || !credits) {
      console.error('Missing userId or credits in webhook', { userId, credits });
      return NextResponse.json({ error: 'Missing userId or credits' }, { status: 400 });
    }

    try {
      // Check if this transaction was already processed
      const existingTransaction = await db.stripeTransaction.findFirst({
        where: {
          sessionId: paymentIntent.id,
          isCompleted: true,
        },
      });

      // If already processed, don't duplicate
      if (existingTransaction) {
        return NextResponse.json({ message: 'Transaction already processed' }, { status: 200 });
      }

      // Create the transaction record first
      const transaction = await db.stripeTransaction.create({
        data: {
          userId,
          credits,
          sessionId: paymentIntent.id,
          isCompleted: false, // Start as not completed
        },
      });

      // Update user credits
      await db.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: credits,
          },
        },
      });

      // Mark as completed after credits are added
      await db.stripeTransaction.update({
        where: { id: transaction.id },
        data: { isCompleted: true },
      });

      return NextResponse.json({ message: 'Credits added successfully!' }, { status: 200 });
    } catch (error) {
      console.error('Error processing payment intent webhook', error);
      return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'ok' });
}
