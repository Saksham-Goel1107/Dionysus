"use client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { createCheckoutSession } from "@/lib/stripe";
import { api } from "@/trpc/react";
import { useAuth } from "@clerk/nextjs";
import { Info } from "lucide-react";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Transaction = {
  id: string;
  createdAt: string | number | Date;
  credits: number;
};

const BillingPage = () => {
  const { data: user } = api.project.getMyCredits.useQuery();
  const { data: transactions } = api.project.getMyTransactions.useQuery();
  const [creditsToBuy, setCreditsToBuy] = React.useState<number[]>([100]);
  const [isLoading, setIsLoading] = React.useState(false);
  const creditsToBuyAmount = creditsToBuy[0]!;
  const price = ((creditsToBuyAmount / 50) * 75).toFixed(2);

  const handleBuyCredits = async () => {
    setIsLoading(true);
    try {
      await createCheckoutSession(creditsToBuyAmount);
    } catch (error) {
      console.error("Error starting checkout:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">Buy Credits</h2>
        <div className="h-2"></div>
        <p className="text-sm text-muted-foreground">
          You currently have {user?.credits} credits.
        </p>
        <div className="h-2"></div>
        <div className="rounded-md border-blue-200 bg-blue-50 px-4 py-2 text-blue-700">
          <div className="flex items-center gap-2">
            <Info className="size-4" />
            <p className="text-sm">
              Each credit allows you to index 1 file in a repository.
            </p>
          </div>
          <p className="text-sm">
            E.g. If your project has 100 files, you will need 100 credits to index
            it.
          </p>
        </div>

        <div className="h-4"></div>
        <Slider
          defaultValue={[100]}
          max={1000}
          min={30}
          step={10}
          onValueChange={(value) => setCreditsToBuy(value)}
          value={creditsToBuy}
          className="cursor-grab"
        />
        <div className="h-4"></div>
        <Button onClick={handleBuyCredits} disabled={isLoading}>
          {isLoading
            ? "Processing..."
            : `Buy ${creditsToBuyAmount} credits for ₹${price}`}
        </Button>
      </div>

      <div className="h-8"></div>

      <div className="rounded-lg border bg-card">
        <div className="p-6 pb-4">
          <h2 className="text-xl font-semibold">Purchase History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View your credit purchase history
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.length ? (
              transactions.map((transaction: Transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                    {new Date(transaction.createdAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    +{transaction.credits} credits
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{((transaction.credits / 50) * 75).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No purchase history yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BillingPage;
