import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

// Initialize Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    // Support both session_id and payment_intent_id
    const sessionId = url.searchParams.get('session_id');
    const paymentIntentId = url.searchParams.get('payment_intent_id');
    let referenceId = sessionId || paymentIntentId;

    if (!referenceId) {
      return NextResponse.json(
        { error: 'Session or payment intent ID is required' },
        { status: 400 },
      );
    }
    // First check our database to see if this payment was already processed
    const result = await db.$queryRaw`
      SELECT * FROM "StripeTransaction" 
      WHERE "sessionId" = ${referenceId} 
      AND "userId" = ${userId.toString()} 
      AND "isCompleted" = true
      LIMIT 1
    `;

    // Check if we have a transaction
    const existingTransaction = Array.isArray(result) && result.length > 0 ? result[0] : null;

    if (existingTransaction) {
      return NextResponse.json({
        success: true,
        processed: true,
        status: 'completed',
        credits: existingTransaction.credits,
      });
    }

    // If not found in our database, check with Stripe
    // The ID could be either a checkout session ID or a payment intent ID

    let isSuccessful = false;
    let paymentStatus = '';

    // Only try to retrieve the correct type based on the ID prefix
    if (sessionId && sessionId.startsWith('cs_')) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        isSuccessful = session.payment_status === 'paid';
        paymentStatus = session.payment_status;
      } catch (checkoutError) {
        console.error('Failed to retrieve checkout session:', checkoutError);
        return NextResponse.json({
          success: false,
          processed: false,
          status: 'invalid',
          error: 'Invalid checkout session reference',
        });
      }
    } else if (paymentIntentId && paymentIntentId.startsWith('pi_')) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        isSuccessful =
          paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing';
        paymentStatus = paymentIntent.status;
      } catch (paymentIntentError) {
        console.error('Failed to retrieve payment intent:', paymentIntentError);
        return NextResponse.json({
          success: false,
          processed: false,
          status: 'invalid',
          error: 'Invalid payment intent reference',
        });
      }
    } else {
      // Unknown or invalid reference
      return NextResponse.json({
        success: false,
        processed: false,
        status: 'invalid',
        error: 'Invalid payment reference',
      });
    }

    return NextResponse.json({
      success: isSuccessful,
      processed: false,
      status: paymentStatus,
    });
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status', details: error.message },
      { status: 500 },
    );
  }
}
