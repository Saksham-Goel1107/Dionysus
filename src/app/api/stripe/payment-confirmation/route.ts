import { processCompletedPayment } from "@/app/(protected)/billing/actions";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();
    
    if (!paymentIntentId) {
      return NextResponse.json({ success: false, error: "Missing payment intent ID" }, { status: 400 });
    }
    
    const result = await processCompletedPayment(paymentIntentId);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        alreadyProcessed: result.alreadyProcessed
      });
    } else {
      // Before returning an error, let's check if this payment was already processed
      // If it was, we should still return success to avoid showing an error to the user
      // This handles race conditions with the webhook
      
      try {
        // Check if payment succeeded and was processed by webhook
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2024-12-18.acacia",
        });
        
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // If payment is successful and the error is likely due to the transaction already being processed
        if (paymentIntent.status === "succeeded") {
          const { userId } = await auth();
          
          // Verify this payment belongs to this user
          if (userId && userId.toString() === paymentIntent.metadata.userId) {            // Check if transaction exists in any state using raw query to avoid schema issues
            const existingTransactions = await db.$queryRaw`
              SELECT * FROM "StripeTransaction" 
              WHERE "sessionId" = ${paymentIntentId}
            `;
              // @ts-ignore - Using raw query
            if (existingTransactions && existingTransactions.length > 0) {
              // The transaction exists, so we can safely assume credits were already added
              // or will be added by the webhook
              console.log("Payment was successful but transaction already exists:", paymentIntentId);
              return NextResponse.json({ 
                success: true, 
                alreadyProcessed: true
              });
            }
          }
        }
      } catch (checkError) {
        // If this check fails, we'll just continue with the original error
        console.error("Error checking payment intent status:", checkError);
      }
      
      // If we get here, it's a real error
      return NextResponse.json({ success: false, error: "Failed to process payment" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in payment confirmation API:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 });
  }
}
