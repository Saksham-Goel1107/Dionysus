'use client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

declare global {
  interface Window {
    toast?: {
      success: (msg: string) => void;
    };
  }
}
import { api } from '@/trpc/react';
import { InfoIcon } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

const UserProfile = dynamic(() => import('@clerk/nextjs').then((mod) => mod.UserProfile), {
  ssr: false,
  loading: () => <p className="p-4 text-center">Loading Profile...</p>,
});
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PaymentForm from './components/PaymentForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BarChart2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { validateCouponCode } from './couponUtils';

const india_discount = true;
const india_discount_value = 10;
const us_discount = true;
const us_discount_value = 5;

type Transaction = {
  id: string;
  createdAt: string | number | Date;
  credits: number;
};

const BillingPage = () => {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);
  const { data: user } = api.project.getMyCredits.useQuery();
  const { data: transactions } = api.project.getMyTransactions.useQuery();
  const [creditsToBuy, setCreditsToBuy] = React.useState<number[]>([100]);
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [isGraphOpen, setIsGraphOpen] = React.useState(false);
  const [discount, setDiscount] = React.useState<number | null>(null);
  const [discountCountry, setDiscountCountry] = React.useState<string | null>(null);
  const [checkingDiscount, setCheckingDiscount] = React.useState(false);
  const [discountError, setDiscountError] = React.useState<string | null>(null);
  const [hasProPlan, sethasProPlan] = React.useState(false);
  const [mfaEnabled, setMfaEnabled] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [couponInput, setCouponInput] = React.useState('');
  const [couponStatus, setCouponStatus] = React.useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    discount: number;
    code: string;
  } | null>(null);
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const creditsToBuyAmount = creditsToBuy[0]!;
  const basePrice = (creditsToBuyAmount / 50) * 75;
  let totalDiscount = discount || 0;
  if (hasProPlan) totalDiscount += 10;
  if (mfaEnabled) totalDiscount += 10;
  if (appliedCoupon) totalDiscount += appliedCoupon.discount;
  const discountedPrice = (basePrice * (1 - totalDiscount / 100)).toFixed(2);
  const price = basePrice.toFixed(2);

  // Calculate discount breakdown
  const discountParts: string[] = useMemo(() => {
    const parts: string[] = [];
    if (hasProPlan) parts.push('10% Pro Plan');
    if (mfaEnabled) parts.push('10% MFA');
    if (discount && discountCountry) parts.push(`${discount}% ${discountCountry}`);
    if (appliedCoupon) parts.push(`${appliedCoupon.discount}% Coupon`);
    return parts;
  }, [hasProPlan, mfaEnabled, discount, discountCountry, appliedCoupon]);
  const discountBreakdown = discountParts.join(' + ');

  const utils = api.useUtils();

  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    void utils.project.getMyTransactions.invalidate();
    void utils.project.getMyCredits.invalidate();
    const notify = () => {
      const title = '🎉 Credits Purchased!';
      const body = `You have successfully purchased ${creditsToBuyAmount} credits for ₹${discountedPrice}. Thank you for your purchase!`;
      const icon = '/public/logo.png';
      try {
        if (window.Notification) {
          const redirectToDashboard = () => {
            window.location.href = '/dashboard';
          };
          if (Notification.permission === 'granted') {
            const notification = new Notification(title, { body, icon });
            notification.onclick = redirectToDashboard;
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                const notification = new Notification(title, { body, icon });
                notification.onclick = redirectToDashboard;
              }
            });
          }
        } else {
          if (window?.toast) {
            window.toast.success(body);
          }
        }
      } catch (err) {
        if (window?.toast) {
          window.toast.success(body);
        }
      }
    };
    notify();
  };

  useEffect(() => {
    if (clerkUser?.totpEnabled || clerkUser?.twoFactorEnabled) {
      setMfaEnabled(true);
    } else {
      setMfaEnabled(false);
    }
  }, [clerkUser]);

  const checkDiscount = async () => {
    setCheckingDiscount(true);
    setDiscountError(null);
    try {
      if (!navigator.geolocation) {
        setDiscountError('Geolocation is not supported by your browser.');
        setCheckingDiscount(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await res.json();
          const country = data.address?.country?.toLowerCase() || '';
          setDiscountCountry(country.charAt(0).toUpperCase() + country.slice(1));
          let appliedDiscount = null;
          if (country === 'india' && india_discount) {
            appliedDiscount = india_discount_value;
          } else if (country === 'united states' && us_discount) {
            appliedDiscount = us_discount_value;
          }
          // Add more countries as needed
          if (appliedDiscount && appliedDiscount > 0) {
            setDiscount(appliedDiscount);
          } else {
            setDiscount(null);
          }
          setCheckingDiscount(false);
        },
        (error) => {
          setDiscountError('Location permission denied or unavailable.');
          setCheckingDiscount(false);
        },
      );
    } catch (err) {
      setDiscountError('Could not check discount. Please try again.');
      setCheckingDiscount(false);
    }
  };
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/pro-status');
        if (!res.ok) throw new Error('Failed to fetch pro status');
        const data = await res.json();
        sethasProPlan(data.pro);
      } catch (error) {
        sethasProPlan(false);
      }
    })();
  }, []);

  // Coupon apply logic
  const handleApplyCoupon = async () => {
    setCouponStatus('Checking...');
    const result = await validateCouponCode(couponInput.trim());
    if (!result) {
      setCouponStatus('Invalid or expired coupon code.');
      return;
    }
    if (result.success === false && result.status === 429) {
      setCouponStatus(result.message || 'Rate limit exceeded. Please try again later.');
      return;
    }
    if (appliedCoupon && appliedCoupon.code === couponInput.trim()) {
      setCouponStatus('Coupon already used.');
      return;
    }
    setAppliedCoupon({ discount: result.discount ?? 0, code: couponInput.trim() });
    setCouponStatus(`Coupon applied! ${result.discount}% off.`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-0">
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold">Buy Credits</h2>
        <div className="h-2"></div>
        <p className="text-sm text-muted-foreground">You currently have {user?.credits} credits.</p>
        <div className="h-2"></div>
        <div className="rounded-md border-blue-200 bg-blue-50 px-2 py-2 sm:px-4 text-blue-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <InfoIcon className="size-4" />
            <p className="text-sm">Each credit allows you to index 1 file in a repository.</p>
          </div>
          <p className="text-xs sm:text-sm mt-1">
            E.g. If your project has 100 files, you will need 100 credits to index it.
          </p>
        </div>
        <div className="h-4"></div>
        <Button
          onClick={checkDiscount}
          disabled={checkingDiscount}
          variant="outline"
          className="mb-2"
        >
          {checkingDiscount ? 'Checking...' : 'Check for Discounts'}
        </Button>
        {mfaEnabled && (
          <div className="text-green-700 text-sm mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 w-full">
            <span className="block w-full sm:w-auto text-left">
              Multi Factor Authentication is enabled. You get additional 10% discount on every
              purchase.
            </span>
          </div>
        )}

        {!mfaEnabled && (
          <div className="text-red-600 text-sm mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 w-full">
            <span className="block w-full sm:w-auto text-left">
              Enable Multi Factor Authentication to get additional 10% discount on every purchase.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-0 sm:ml-2 mt-2 sm:mt-0 w-full sm:w-auto"
              onClick={() => setShowProfile(true)}
            >
              Open Security Settings &rarr;
            </Button>
            {showProfile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-0">
                <div className="relative bg-white rounded-2xl shadow-2xl w-[80vw] h-[90vh] max-w-none max-h-none flex flex-col overflow-hidden border border-gray-200 mx-0 sm:mx-2 my-4">
                  <button
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-gray-700 text-2xl z-10 focus:outline-none bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
                    onClick={() => {
                      setShowProfile(false);
                      router.push('/billing');
                    }}
                    aria-label="Close"
                    type="button"
                  >
                    ×
                  </button>
                  <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-4 scrollbar-hide">
                    <UserProfile />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {hasProPlan && (
          <div className="text-green-700 text-sm mt-1">
            Pro/Advance Plan: Additional 10% discount applied!
          </div>
        )}
        {discountCountry && (
          <div className="text-sm mt-1">
            Location: <span className="font-semibold">{discountCountry}</span>
          </div>
        )}
        {totalDiscount > 0 && (
          <div className="text-green-700 text-sm mt-1">
            🎉 {totalDiscount}% discount applied! New price:{' '}
            <span className="font-bold">₹{discountedPrice}</span>
            {discountBreakdown && (
              <span className="block text-xs text-green-700 mt-1">
                (Includes {discountBreakdown})
              </span>
            )}
          </div>
        )}
        {discountError && <div className="text-red-600 text-sm mt-1">{discountError}</div>}
        <div className="h-2"></div>
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
        {/* Coupon code UI */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Enter coupon code"
            className="border rounded px-2 py-1 w-full sm:w-64"
          />
          <Button onClick={handleApplyCoupon} variant="outline">
            Apply Coupon
          </Button>
        </div>
        {couponStatus && <div className="text-sm mt-1 mb-2">{couponStatus}</div>}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              Buy {creditsToBuyAmount} credits for ₹{discountedPrice}
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
                price={discountedPrice}
                discountBreakdown={discountBreakdown}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-8"></div>
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4 border-b gap-2 sm:gap-0">
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
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
                      <svg
                        width="100%"
                        height="180"
                        viewBox={`0 0 320 180`}
                        className="max-w-full"
                        style={{ display: 'block' }}
                      >
                        {/* Axes */}
                        <line x1="30" y1="10" x2="30" y2="160" stroke="#888" strokeWidth="1" />
                        <line x1="30" y1="160" x2="310" y2="160" stroke="#888" strokeWidth="1" />
                        {/* Line graph */}
                        {(() => {
                          const maxCredits = Math.max(...transactions.map((t) => t.credits));
                          const minCredits = Math.min(...transactions.map((t) => t.credits));
                          const range = maxCredits - minCredits || 1;
                          const points = transactions.map((t, i) => {
                            const x = 30 + i * (260 / (transactions.length - 1));
                            const y = 160 - ((t.credits - minCredits) / range) * 130;
                            return { x, y };
                          });
                          const path = points
                            .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
                            .join(' ');
                          return (
                            <>
                              <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                              {points.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2563eb" />
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    ) : (
                      <div className="text-center w-full text-muted-foreground">
                        Not enough data <br /> Buy more credits to see it
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              View your credit purchase history
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              It may show full price instead of discountedPrice but the price deducted was
              discounted if the discount got applied
            </p>
          </div>
          <div className="w-full sm:w-auto flex justify-end">
            <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {transactions?.length ?? 0} {transactions?.length === 1 ? 'purchase' : 'purchases'}
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
                      <span className="font-medium">
                        ₹{((transaction.credits / 50) * 75).toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        width="32"
                        height="32"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="text-muted-foreground"
                      >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path
                          d="M8 12h8M12 8v8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
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
