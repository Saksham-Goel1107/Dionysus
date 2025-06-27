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
import { BarChart2 } from "lucide-react";

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
  const [isGraphOpen, setIsGraphOpen] = React.useState(false);
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
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Purchase History
              <Dialog open={isGraphOpen} onOpenChange={setIsGraphOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 flex items-center gap-1"
                    onClick={() => setIsGraphOpen(true)}
                  >
                    <BarChart2 className="h-4 w-4" /> Purchase Graph
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Credits Purchased Over Time</DialogTitle>
                    <DialogDescription>
                      This graph shows the number of credits you have purchased in each transaction.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="w-full flex flex-col items-center">
                    {transactions && transactions.length > 1 ? (
                      <svg width="100%" height="180" viewBox={`0 0 320 180`} className="max-w-full" style={{ display: 'block' }}>
                        {/* Axes */}
                        <line x1="30" y1="10" x2="30" y2="160" stroke="#888" strokeWidth="1" />
                        <line x1="30" y1="160" x2="310" y2="160" stroke="#888" strokeWidth="1" />
                        {/* Line graph */}
                        {(() => {
                          const maxCredits = Math.max(...transactions.map(t => t.credits));
                          const minCredits = Math.min(...transactions.map(t => t.credits));
                          const range = maxCredits - minCredits || 1;
                          const points = transactions.map((t, i) => {
                            const x = 30 + (i * (260 / (transactions.length - 1)));
                            const y = 160 - ((t.credits - minCredits) / range) * 130;
                            return { x, y };
                          });
                          const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                          return <>
                            <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                            {points.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2563eb" />
                            ))}
                          </>;
                        })()}
                      </svg>
                    ) : (
                      <div className="text-center w-full text-muted-foreground">Not enough data <br/> Buy more credits to see it</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </h2>
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
