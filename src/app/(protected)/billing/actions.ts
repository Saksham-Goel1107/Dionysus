"use server";

import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function verifyAndUpdateCredits(sessionId: string, creditsAmount: number): Promise<{ success: boolean; alreadyProcessed?: boolean }> {
  try {
    // Verify the session is legitimate and completed
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Only proceed if payment status is paid
    if (session.payment_status !== "paid") {
      console.error("Payment not completed:", session.payment_status);
      return { success: false };
    }

    const { userId } = await auth();
    if (!userId || userId.toString() !== session.client_reference_id) {
      console.error("User ID mismatch or missing");
      return { success: false };
    }
    
    // Check if this session has already been processed
    const existingTransaction = await db.stripeTransaction.findFirst({
      where: {
        userId: userId.toString(),
        sessionId: sessionId,
        isCompleted: true
      }
    });
    
    // If we already have a completed transaction for this session, don't process again
    if (existingTransaction) {
      console.log("Transaction already processed:", sessionId);
      return { success: true, alreadyProcessed: true }; // Return with alreadyProcessed flag
    }
      // Record the transaction
    const transaction = await db.stripeTransaction.create({
      data: {
        userId: userId.toString(),
        credits: creditsAmount,
        sessionId: sessionId, // Store session ID to prevent duplicate processing
        isCompleted: false, // Explicitly set to false initially
      },
    });

    // Update user credits
    await db.user.update({
      where: { id: userId.toString() },
      data: {
        credits: {
          increment: creditsAmount,
        },
      },
    });
      // Mark the transaction as completed
    await db.stripeTransaction.update({
      where: { id: transaction.id },
      data: { isCompleted: true }
    });

    return { success: true, alreadyProcessed: false };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { success: false };
  }
}

export async function createPaymentIntent(credits: number): Promise<{ clientSecret: string | null }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized!");
    }
    
    // Calculate amount based on credits
    const amount = Math.round((credits / 50) * 75 * 100); // In cents (e.g. 1500 = $15.00)
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      metadata: {
        credits,
        userId: userId.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    // Return client_secret to the client
    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return { clientSecret: null };
  }
}

// Process payment after it's completed
export async function processCompletedPayment(paymentIntentId: string): Promise<{ success: boolean; alreadyProcessed?: boolean }> {
  try {
    // Retrieve the payment intent to verify and get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Only proceed if payment is successful
    if (paymentIntent.status !== "succeeded") {
      console.error("Payment not completed:", paymentIntent.status);
      return { success: false };
    }
    
    const credits = Number(paymentIntent.metadata.credits);
    const paymentUserId = paymentIntent.metadata.userId;
    
    const { userId } = await auth();
    if (!userId || userId.toString() !== paymentUserId) {
      console.error("User ID mismatch or missing");
      return { success: false };
    }
    
    // Check if this payment has already been processed
    const existingTransaction = await db.stripeTransaction.findFirst({
      where: {
        userId: userId.toString(),
        sessionId: paymentIntentId, // We'll use paymentIntentId in place of sessionId
        isCompleted: true
      }
    });
    
    // If we already have a completed transaction for this payment, don't process again
    if (existingTransaction) {
      console.log("Transaction already processed:", paymentIntentId);
      return { success: true, alreadyProcessed: true };
    }
    
    // Record the transaction
    const transaction = await db.stripeTransaction.create({
      data: {
        userId: userId.toString(),
        credits,
        sessionId: paymentIntentId, // Use paymentIntentId as identifier
        isCompleted: false,
      },
    });

    // Update user credits
    await db.user.update({
      where: { id: userId.toString() },
      data: {
        credits: {
          increment: credits,
        },
      },
    });
    
    // Mark the transaction as completed
    await db.stripeTransaction.update({
      where: { id: transaction.id },
      data: { isCompleted: true }
    });

    return { success: true, alreadyProcessed: false };
  } catch (error) {
    console.error("Error processing payment:", error);
    return { success: false };
  }
}
