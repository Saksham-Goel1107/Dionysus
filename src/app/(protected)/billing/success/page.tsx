"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyAndUpdateCredits } from "../actions";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

function PaymentProcessor() {  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAlreadyProcessed, setIsAlreadyProcessed] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get("session_id");
      const creditsStr = searchParams.get("credits");
      
      if (!sessionId || !creditsStr) {
        toast({
          title: "Error",
          description: "Missing payment information",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      try {
        const credits = parseInt(creditsStr, 10);
        const result = await verifyAndUpdateCredits(sessionId, credits);
        
        if (result.success) {
          if (result.alreadyProcessed) {
            // Transaction was already processed before
            setIsAlreadyProcessed(true);
            toast({
              title: "Already Processed",
              description: "This transaction was already processed. No additional credits added.",
              variant: "default",
            });
          } else {
            // New successful transaction
            await utils.project.getMyCredits.invalidate();
            setIsSuccess(true);
            toast({
              title: "Credits Added",
              description: `${credits} credits have been added to your account.`,
            });
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to add credits to your account",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, toast, utils.project.getMyCredits]);
  return (
    <>
      {isProcessing ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-12 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Processing your payment...</h2>
          <p className="text-muted-foreground">Please don't close this page.</p>
        </div>
      ) : isAlreadyProcessed ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-amber-100 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-8 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Nothing to do here again</h2>
          <p className="text-muted-foreground">
            This transaction was already processed and credits were already added to your account.
          </p>
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => router.push("/billing")}>
              Go to Billing
            </Button>
            <Button onClick={() => router.push("/create")}>Create Project</Button>
          </div>
        </div>
      ) : isSuccess ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-8 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Payment Successful!</h2>
          <p className="text-muted-foreground">
            Your credits have been added to your account.
          </p>
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => router.push("/billing")}>
              Go to Billing
            </Button>
            <Button onClick={() => router.push("/create")}>Create Project</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-red-100 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-8 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Payment Processing Failed</h2>
          <p className="text-muted-foreground">
            We couldn't process your payment. Please try again.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push("/billing")}>Return to Billing</Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function BillingSuccessPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-12 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Loading payment details...</h2>
        </div>
      }>
        <PaymentProcessor />
      </Suspense>
    </div>
  );
}
