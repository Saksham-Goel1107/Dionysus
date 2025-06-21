"use client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { api } from "@/trpc/react";
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
import PaymentForm from "./components/PaymentForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Transaction = {
  id: string;
  createdAt: string | number | Date;
  credits: number;
};

const BillingPage = () => {
  const { data: user } = api.project.getMyCredits.useQuery();
  const { data: transactions } = api.project.getMyTransactions.useQuery();
  const [creditsToBuy, setCreditsToBuy] = React.useState<number[]>([100]);
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const creditsToBuyAmount = creditsToBuy[0]!;
  const price = ((creditsToBuyAmount / 50) * 75).toFixed(2);

  const utils = api.useUtils();
  
  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    // Refresh transaction history and credits
    void utils.project.getMyTransactions.invalidate();
    void utils.project.getMyCredits.invalidate();
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
          className="cursor-grab active:cursor-grabbing"
        />
        <div className="h-4"></div>
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogTrigger asChild>
            <Button>
              Buy {creditsToBuyAmount} credits for ₹{price}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader className="mb-4">
              <DialogTitle>Purchase Credits</DialogTitle>
              <DialogDescription>
                Enter your card details to purchase {creditsToBuyAmount} credits.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2">
              <PaymentForm 
                creditsToBuy={creditsToBuyAmount} 
                price={price}
                onSuccess={handlePaymentSuccess} 
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-8"></div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <div>
        <h2 className="text-xl font-semibold">Purchase History</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View your credit purchase history
        </p>
          </div>
          <div>
        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          {transactions?.length ?? 0} {transactions?.length === 1 ? "purchase" : "purchases"}
        </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.length ? (
            transactions.map((transaction: Transaction) => (
          <TableRow key={transaction.id} className="hover:bg-muted transition">
            <TableCell>
              <div>
            <span className="font-medium">
              {new Date(transaction.createdAt).toLocaleDateString()}
            </span>
            <span className="block text-xs text-muted-foreground">
              {new Date(transaction.createdAt).toLocaleTimeString()}
            </span>
              </div>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
            +{transaction.credits} credits
              </span>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            Success
              </span>
            </TableCell>
            <TableCell className="text-right">
              <span className="font-medium">₹{((transaction.credits / 50) * 75).toFixed(2)}</span>
            </TableCell>
          </TableRow>
            ))
          ) : (
            <TableRow>
          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
            <div className="flex flex-col items-center gap-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-muted-foreground">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>No purchase history yet</span>
            </div>
          </TableCell>
            </TableRow>
          )}
        </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
