"use server";

import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function verifyAndUpdateCredits(sessionId: string, creditsAmount: number) {
  try {
    // Verify the session is legitimate and completed
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Only proceed if payment status is paid
    if (session.payment_status !== "paid") {
      console.error("Payment not completed:", session.payment_status);
      return false;
    }

    const { userId } = await auth();
    if (!userId || userId.toString() !== session.client_reference_id) {
      console.error("User ID mismatch or missing");
      return false;
    }    // Record the transaction
    await db.stripeTransaction.create({
      data: {
        userId: userId.toString(),
        credits: creditsAmount,
        // Store session ID in metadata or other field if needed
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

    return true;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return false;
  }
}
