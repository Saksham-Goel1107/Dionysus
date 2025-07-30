'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyAndUpdateCredits } from '../actions';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/trpc/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import confetti from 'canvas-confetti';

function PaymentProcessor() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAlreadyProcessed, setIsAlreadyProcessed] = useState(false);
  const [noTransaction, setNoTransaction] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState<number>(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();
  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams?.get('session_id');
      const creditsStr = searchParams?.get('credits');

      if (!sessionId || !creditsStr) {
        setNoTransaction(true);
        setIsProcessing(false);
        return;
      }

      try {
        const credits = parseInt(creditsStr, 10);
        setCreditsAmount(credits);

        // Check if there's a stored flag in sessionStorage indicating this is
        // a fresh payment that succeeded (from PaymentForm redirect)
        const isNewPayment = sessionStorage.getItem(`payment_${sessionId}_new`) === 'true';

        if (isNewPayment) {
          // This is a brand new payment coming from PaymentForm
          // Clear the flag immediately to ensure it only works once
          sessionStorage.removeItem(`payment_${sessionId}_new`);
          // Always show success for new payments from PaymentForm redirect
          setIsSuccess(true);

          // Trigger confetti effect for success
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }, 300);

          // Play success sound
          const audio = new Audio('/success.mp3');
          audio.play().catch((err) => console.error('Error playing success sound:', err));

          toast({
            title: 'Payment Successful',
            description: `${credits} credits have been added to your account.`,
            variant: 'default',
          });

          // Still verify and update the credits in the backend
          await verifyAndUpdateCredits(sessionId, credits);

          // Refresh credits data
          await utils.project.getMyCredits.invalidate();
          await utils.project.getMyTransactions.invalidate();

          setIsProcessing(false);
          return;
        }

        // Regular flow for visits that aren't coming directly from PaymentForm
        let alreadyProcessed = false;
        try {
          const checkResponse = await fetch(
            `/api/stripe/check-payment-status?payment_intent_id=${sessionId}`,
          );
          const checkResult = await checkResponse.json();

          if (checkResult.processed) {
            alreadyProcessed = true;
          }
        } catch (checkError) {
          console.error('Error checking payment status:', checkError);
          // Continue with normal verification flow
        }

        // Verify and update credits regardless of the check result
        const result = await verifyAndUpdateCredits(sessionId, credits);

        if (result.success) {
          if (result.alreadyProcessed || alreadyProcessed) {
            // Transaction was already processed before
            setIsAlreadyProcessed(true);
          } else {
            // This is a new successful transaction
            setIsSuccess(true);

            // Trigger confetti effect on success
            setTimeout(() => {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
            }, 300);

            toast({
              title: 'Payment Successful',
              description: `${credits} credits have been added to your account.`,
              variant: 'default',
            });
          }

          // Refresh credits data
          await utils.project.getMyCredits.invalidate();
          await utils.project.getMyTransactions.invalidate();
        } else {
          toast({
            title: 'Payment Processing Issue',
            description:
              'There was an issue adding credits to your account. Please contact support if you were charged.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Error processing payment:', error);
        toast({
          title: 'Error Processing Payment',
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, toast, utils.project.getMyCredits, utils.project.getMyTransactions]);
  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="border-b pb-6 text-center">
        <CardTitle className="text-2xl">Payment Status</CardTitle>
        <CardDescription>
          {isProcessing
            ? 'Processing your transaction...'
            : isSuccess
              ? `Successfully added ${creditsAmount} credits to your account`
              : isAlreadyProcessed
                ? 'Transaction previously processed'
                : noTransaction
                  ? 'No transaction details found'
                  : 'Transaction could not be processed'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6 pt-8">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold">Processing your payment...</h2>
              <p className="max-w-md text-muted-foreground">
                Please don&apos;t close this page. We&apos;re confirming your payment and adding
                credits to your account.
              </p>
            </div>
          </div>
        ) : isAlreadyProcessed ? (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="rounded-full bg-amber-100 p-4 ring-4 ring-amber-50">
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold">Already Processed</h2>
              <p className="text-muted-foreground">
                This transaction was previously processed and credits were already added to your
                account. No additional credits have been added.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-4 text-sm">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Your credits are ready to use</span>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="rounded-full bg-green-100 p-4 ring-4 ring-green-50">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold">Payment Successful!</h2>
              <p className="text-muted-foreground">
                Your payment was processed successfully and {creditsAmount} credits have been added
                to your account. You can now use these credits to create new projects.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-900">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span>{creditsAmount} credits added to your account</span>
            </div>
          </div>
        ) : noTransaction ? (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="rounded-full bg-muted p-4">
              <AlertTriangle className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold">No Transaction Found</h2>
              <p className="text-muted-foreground">
                We couldn&apos;t find any transaction details. If you were attempting to make a
                payment, please go back to the billing page and try again.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="rounded-full bg-red-100 p-4 ring-4 ring-red-50">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold">Payment Processing Issue</h2>
              <p className="text-muted-foreground">
                We encountered an issue while processing your payment. If you believe this is an
                error or your card was charged, please contact our support team.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center gap-4 border-t pb-6 pt-2">
        {!isProcessing && (
          <>
            <Button variant="outline" onClick={() => router.push('/billing')} className="px-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Billing
            </Button>

            {(isSuccess || isAlreadyProcessed) && (
              <Button onClick={() => router.push('/create')} className="px-6">
                Create Project
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default function BillingSuccessPage() {
  return (
    <div className="container mx-auto flex max-w-5xl flex-col items-center py-12">
      <div className="mb-12">
        <h1 className="mb-2 text-3xl font-bold">Payment Confirmation</h1>
      </div>

      <div className="flex flex-col items-center justify-center">
        <Suspense
          fallback={
            <Card className="w-full max-w-2xl shadow-lg">
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <h2 className="text-xl font-semibold">Loading payment status...</h2>
                  <p className="text-muted-foreground">
                    Please wait while we fetch your payment details
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        >
          <PaymentProcessor />
        </Suspense>
      </div>
    </div>
  );
}
