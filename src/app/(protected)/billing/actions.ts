"use server";

import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
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
