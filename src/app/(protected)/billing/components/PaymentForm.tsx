import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { createPaymentIntent } from "../actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import "./payment-form.css";
import React, { useState, useEffect } from "react";
import "./payment-form.css";


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

// Initialize appearance options for Stripe Elements
const appearance = {
  theme: 'flat' as const,
  variables: {
    colorPrimary: '#0f172a',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '4px',
  },
};

interface PaymentFormProps {
  creditsToBuy: number;
  price: string;
  onSuccess: () => void;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({ creditsToBuy, price, onSuccess }) => {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const utils = api.useUtils();
  
  // Create PaymentIntent as soon as the page loads
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        const result = await createPaymentIntent(creditsToBuy);
        
        if (result.clientSecret) {
          setClientSecret(result.clientSecret);
        } else {
          setErrorMessage("Failed to initialize payment. Please try again.");
          toast({
            title: "Payment Setup Failed",
            description: "There was a problem setting up your payment. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        setErrorMessage(error.message || "Failed to initialize payment");
        toast({
          title: "Payment Setup Failed",
          description: error.message || "There was a problem setting up your payment",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePayment();
  }, [creditsToBuy, toast]);
    const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      // Stripe.js has not yet loaded or we don't have a clientSecret
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }
        
      // Confirm the payment with the clientSecret from our backend
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
        
          },
        },
      });
      
      if (error) {
        if (error.payment_intent && error.payment_intent.status === 'succeeded') {
          
          const successfulIntent = error.payment_intent;
          
          await processSuccessfulPayment(successfulIntent, true);
          return;
        }
       try {
          const checkResult = await fetch(`/api/stripe/check-payment-status?payment_intent_id=${clientSecret.split('_secret_')[0]}`, {
            method: 'GET',
          });
          
          if (checkResult.ok) {
            const statusData = await checkResult.json();
            if (statusData.success || statusData.processed) {
              await processSuccessfulPayment({ id: clientSecret.split('_secret_')[0] }, true);
              return;
            }
          }
        } catch (checkError) {
          console.error("Failed to check payment status:", checkError);
        }
        
        console.error("Payment confirmation error:", error);
        throw new Error(error.message || "Payment failed. Please check your card details and try again.");
      }
      
      // If we get here, no errors occurred during payment
      if (paymentIntent.status === "succeeded") {
        // Process the successful payment
        await processSuccessfulPayment(paymentIntent);
      } else if (paymentIntent.status === "processing") {
        // Payment is still processing, but likely successful - handle as success
        await processSuccessfulPayment(paymentIntent);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}. Please try again later.`);
      }
    } catch (error: any) {
      // Final error handling
      setErrorMessage(error.message || "An unexpected error occurred");
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
    // Helper function to process a successful payment
  const processSuccessfulPayment = async (paymentIntent: any, fromErrorHandler: boolean = false) => {
    let alreadyProcessed = false;
    try {
      const response = await fetch('/api/stripe/payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      
      if (!response.ok) {
        console.warn("Credit application response was not ok, but payment was successful");
        // The webhook likely processed or will process this payment
      } else {
        const result = await response.json();
        
        if (result.alreadyProcessed) {
          alreadyProcessed = true;
          console.info("Credits were already processed for this payment (by webhook)");
        } else if (!result.success) {
          console.warn("Credit application reported failure, but payment was successful:", result.error);
        }
      }
    } catch (apiError) {
      // Log but don't throw - we consider payment successful if Stripe says so
      console.error("Error from credit application API, but payment was successful:", apiError);
    }
   
    // Invalidate queries to refresh UI data
    await utils.project.getMyCredits.invalidate();
    await utils.project.getMyTransactions.invalidate();
    
    toast({
      title: "Payment Successful",
      description: alreadyProcessed 
        ? "Your payment was successful. Credits have already been added to your account." 
        : `${creditsToBuy} credits have been added to your account.`,
      variant: "default",
    });
    
    onSuccess();
    setIsRedirecting(true);
      // Mark this as a new successful payment in sessionStorage
    // This will be used by the success page to determine which UI to show
    sessionStorage.setItem(`payment_${paymentIntent.id}_new`, 'true');
    
    setTimeout(() => {
      router.push(`/billing/success?session_id=${paymentIntent.id}&credits=${creditsToBuy}`);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Setting up your payment...</p>
      </div>
    );
  }
  
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-emerald-600">Payment successful!</p>
        <p className="text-sm text-muted-foreground">Redirecting to confirmation page...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="card-element" className="text-sm font-medium">
            Card details
          </label>          <div id="card-element-container" className="rounded-md border border-input bg-background p-6 focus-within:ring-1 focus-within:ring-ring relative min-h-[60px]">
            <CardElement 
              id="card-element" 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                    iconColor: '#ef4444',
                  },
                },
                hidePostalCode: true,
              }}
              onChange={e => {
                if (e.error) {
                  setErrorMessage(e.error.message || "Invalid card details");
                } else {
                  setErrorMessage("");
                }
              }}
            />
          </div>
        </div>
      
        <div className="py-2 px-3 bg-muted/50 rounded-md flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Payment summary</span>
          </div>
          <span className="font-semibold">₹{price}</span>
        </div>
      </div>
        <Button 
        type="submit" 
        disabled={!stripe || !clientSecret || isProcessing || isRedirecting} 
        className="w-full"
        size="lg"
      >      {isRedirecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Redirecting...
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Processing payment...
          </>
        ) : (
          `Complete payment for ${creditsToBuy} credits`
        )}
      </Button>
    </form>
  );
};

export default function PaymentForm({ creditsToBuy, price, onSuccess }: PaymentFormProps) {
  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        appearance,
        fonts: [
          {
            cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
          }
        ],
      }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Complete your purchase</CardTitle>
          <CardDescription>
            You're buying {creditsToBuy} credits for ₹{price}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutForm creditsToBuy={creditsToBuy} price={price} onSuccess={onSuccess} />
        </CardContent>
      </Card>
    </Elements>
  );
}
