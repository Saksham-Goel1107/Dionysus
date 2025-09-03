'use client';

import { Button } from '@/components/ui/button';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  convertCurrency,
  formatCurrency,
  getCurrencyByCode,
  getExchangeRates,
  SUPPORTED_CURRENCIES,
  type Currency,
} from '@/lib/currencyConverter';
import { api } from '@/trpc/react';
import { InfoIcon, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { useEffect, useMemo } from 'react';

declare global {
  interface Window {
    toast?: {
      success: (msg: string) => void;
    };
  }
}

const UserProfile = dynamic(() => import('@clerk/nextjs').then((mod) => mod.UserProfile), {
  ssr: false,
  loading: () => <p className="p-4 text-center">Loading Profile...</p>,
});

const PaymentForm = dynamic(() => import('./components/PaymentForm'), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  ),
});
// import PaymentForm from './components/PaymentForm'; // Removed to prevent SSR issues
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUser } from '@clerk/nextjs';
import { BarChart2 } from 'lucide-react';
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
  const { data: transactions, isLoading: isTransactionsLoading } =
    api.project.getMyTransactions.useQuery();
  const [creditsToBuy, setCreditsToBuy] = React.useState<number[]>([100]);
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [isGraphOpen, setIsGraphOpen] = React.useState(false);
  const [discount, setDiscount] = React.useState<number | null>(null);
  const [discountCountry, setDiscountCountry] = React.useState<string | null>(null);
  const [checkingDiscount, setCheckingDiscount] = React.useState(false);
  const [discountError, setDiscountError] = React.useState<string | null>(null);
  const [hasProPlan, sethasProPlan] = React.useState(false);
  const [isCheckingPlan, setIsCheckingPlan] = React.useState(false);
  const [mfaEnabled, setMfaEnabled] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [couponInput, setCouponInput] = React.useState('');
  const [couponStatus, setCouponStatus] = React.useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    discount: number;
    code: string;
  } | null>(null);

  // Currency conversion state
  const [selectedCurrency, setSelectedCurrency] = React.useState<Currency>(
    getCurrencyByCode('INR') || SUPPORTED_CURRENCIES[0]!,
  );
  const [exchangeRates, setExchangeRates] = React.useState<Record<string, number>>({});
  const [isLoadingRates, setIsLoadingRates] = React.useState(false);

  // Filter state
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [showAllHistory, setShowAllHistory] = React.useState(false);
  const [filters, setFilters] = React.useState({
    dateFrom: '',
    dateTo: '',
    amountOperator: 'all' as 'all' | 'greater' | 'less' | 'equal',
    amountValue: '',
    minAmount: '',
    maxAmount: '',
    creditsOperator: 'all' as 'all' | 'greater' | 'less' | 'equal',
    creditsValue: '',
  });

  const { user: clerkUser } = useUser();
  const router = useRouter();
  const creditsToBuyAmount = creditsToBuy[0]!;
  const basePrice = (creditsToBuyAmount / 50) * 75;
  let totalDiscount = discount || 0;
  if (hasProPlan) totalDiscount += 10;
  if (mfaEnabled) totalDiscount += 10;
  if (appliedCoupon) totalDiscount += appliedCoupon.discount;
  const discountedPriceINR = basePrice * (1 - totalDiscount / 100);

  // Convert price to selected currency
  const convertedPrice = convertCurrency(
    discountedPriceINR,
    'INR',
    selectedCurrency.code,
    exchangeRates,
  );
  const formattedPrice = formatCurrency(convertedPrice, selectedCurrency);

  // Calculate discount breakdown
  const discountParts: string[] = useMemo(() => {
    const parts: string[] = [];
    if (hasProPlan) parts.push('10% discount for Premium users');
    if (mfaEnabled) parts.push('10% discount for MFA');
    if (discount && discountCountry) parts.push(`${discount}% discount for ${discountCountry}`);
    if (appliedCoupon) parts.push(`${appliedCoupon.discount}% discount on Coupon`);
    return parts;
  }, [hasProPlan, mfaEnabled, discount, discountCountry, appliedCoupon]);
  const discountBreakdown = discountParts.join(' + ');

  const utils = api.useUtils();

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = transactions.filter((transaction) => {
      // Validate transaction object structure for security
      if (
        !transaction ||
        typeof transaction !== 'object' ||
        !transaction.id ||
        !transaction.createdAt ||
        typeof transaction.credits !== 'number'
      ) {
        return false;
      }

      // Date filtering with proper validation
      if (filters.dateFrom || filters.dateTo) {
        const transactionDate = new Date(transaction.createdAt);
        if (isNaN(transactionDate.getTime())) return false; // Invalid date

        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (isNaN(fromDate.getTime()) || transactionDate < fromDate) return false;
        }

        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo + 'T23:59:59');
          if (isNaN(toDate.getTime()) || transactionDate > toDate) return false;
        }
      }

      // Amount filtering with minAmount and maxAmount range
      if (filters.minAmount || filters.maxAmount) {
        const amountINR = (transaction.credits / 50) * 75;
        const amountInCurrency = convertCurrency(
          amountINR,
          'INR',
          selectedCurrency.code,
          exchangeRates,
        );

        if (filters.minAmount) {
          const minAmount = parseFloat(filters.minAmount);
          if (isNaN(minAmount) || minAmount < 0 || amountInCurrency < minAmount) return false;
        }

        if (filters.maxAmount) {
          const maxAmount = parseFloat(filters.maxAmount);
          if (isNaN(maxAmount) || maxAmount < 0 || amountInCurrency > maxAmount) return false;
        }
      }

      // Credits filtering with validation
      if (filters.creditsOperator !== 'all' && filters.creditsValue) {
        const filterCredits = parseInt(filters.creditsValue);
        if (isNaN(filterCredits) || filterCredits < 0) return false; // Invalid or negative credits

        if (filters.creditsOperator === 'greater' && transaction.credits <= filterCredits)
          return false;
        if (filters.creditsOperator === 'less' && transaction.credits >= filterCredits)
          return false;
        if (filters.creditsOperator === 'equal' && transaction.credits !== filterCredits)
          return false;
      }

      return true;
    });

    // Apply view limit if not showing all
    if (!showAllHistory && filtered.length > 10) {
      filtered = filtered.slice(0, 10);
    }

    return filtered;
  }, [transactions, filters, selectedCurrency, exchangeRates, showAllHistory]);

  // Secure filter input validation
  const handleFilterChange = (field: string, value: string) => {
    // Sanitize and validate input
    let sanitizedValue = value.trim();

    if (field === 'minAmount' || field === 'maxAmount' || field === 'creditsValue') {
      // Only allow positive numbers
      sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, '');
      const numValue = parseFloat(sanitizedValue);
      if (numValue < 0 || sanitizedValue.split('.').length > 2) return; // Prevent negative or invalid numbers
    }

    if (field === 'dateFrom' || field === 'dateTo') {
      // Validate date format
      if (sanitizedValue && isNaN(new Date(sanitizedValue).getTime())) return;
    }

    setFilters((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      amountOperator: 'all',
      amountValue: '',
      minAmount: '',
      maxAmount: '',
      creditsOperator: 'all',
      creditsValue: '',
    });
  };

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.creditsOperator !== 'all';

  // Load exchange rates when component mounts or currency changes
  React.useEffect(() => {
    const loadExchangeRates = async () => {
      setIsLoadingRates(true);
      try {
        const rates = await getExchangeRates();
        setExchangeRates(rates);
      } catch (error) {
        console.error('Failed to load exchange rates:', error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    loadExchangeRates();
  }, []);

  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    void utils.project.getMyTransactions.invalidate();
    void utils.project.getMyCredits.invalidate();
    const notify = () => {
      const title = '🎉 Credits Purchased!';
      const body = `You have successfully purchased ${creditsToBuyAmount} credits for ${formattedPrice}. Thank you for your purchase!`;
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
      } catch {
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
      navigator.geolocation.getCurrentPosition(async (position) => {
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
      });
    } catch {
      setDiscountError('Could not check discount. Please try again.');
      setCheckingDiscount(false);
    }
  };
  useEffect(() => {
    (async () => {
      setIsCheckingPlan(true);
      try {
        const res = await fetch('/api/user/pro-status');
        if (!res.ok) throw new Error('Failed to fetch pro status');
        const data = await res.json();
        sethasProPlan(Boolean(data.pro));
      } catch {
        sethasProPlan(false);
      } finally {
        setIsCheckingPlan(false);
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
    <div className="mx-auto w-full max-w-4xl px-2 sm:px-4 md:px-0">
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-semibold sm:text-xl">Buy Credits</h2>
        <div className="h-2"></div>
        <p className="text-sm text-muted-foreground">You currently have {user?.credits} credits.</p>
        <div className="h-2"></div>
        <div className="rounded-md border-blue-200 bg-blue-50 px-2 py-2 text-blue-700 sm:px-4">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <InfoIcon className="size-4" />
            <p className="text-sm">Each credit allows you to index 1 file in a repository.</p>
          </div>
          <p className="mt-1 text-xs sm:text-sm">
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
          <div className="mt-1 flex w-full flex-col items-start gap-2 text-sm text-green-700 sm:flex-row sm:items-center sm:gap-2">
            <span className="block w-full text-left sm:w-auto">
              Multi Factor Authentication is enabled. You get additional 10% discount on every
              purchase.
            </span>
          </div>
        )}

        {!mfaEnabled && (
          <div className="mt-1 flex w-full flex-col items-start gap-2 text-sm text-red-600 sm:flex-row sm:items-center sm:gap-2">
            <span className="block w-full text-left sm:w-auto">
              Enable Multi Factor Authentication to get additional 10% discount on every purchase.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-0 mt-2 w-full sm:ml-2 sm:mt-0 sm:w-auto"
              onClick={() => setShowProfile(true)}
            >
              Open Security Settings &rarr;
            </Button>
            {showProfile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-0">
                <div className="relative mx-0 my-4 flex h-[90vh] max-h-none w-[80vw] max-w-none flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:mx-2">
                  <button
                    className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl text-gray-500 shadow hover:text-gray-700 focus:outline-none sm:right-3 sm:top-3"
                    onClick={() => {
                      setShowProfile(false);
                      router.push('/billing');
                    }}
                    aria-label="Close"
                    type="button"
                  >
                    ×
                  </button>
                  <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
                    <UserProfile />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-2">
          {isCheckingPlan ? (
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking plan-based discounts...
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const items: { key: string; label: string; tone?: 'emerald' | 'amber' | 'gray' }[] =
                  [];
                if (hasProPlan)
                  items.push({
                    key: 'pro',
                    label: 'Discount for Premium users — 10% off',
                    tone: 'emerald',
                  });
                if (mfaEnabled)
                  items.push({ key: 'mfa', label: 'Discount for MFA — 10% off', tone: 'emerald' });
                if (discount && discountCountry)
                  items.push({
                    key: 'country',
                    label: `Discount of ${discount}% for ${discountCountry}`,
                    tone: 'emerald',
                  });
                if (appliedCoupon)
                  items.push({
                    key: 'coupon',
                    label: `Discount of ${appliedCoupon.discount}% on Coupon`,
                    tone: 'amber',
                  });

                return items.map((item) => (
                  <span
                    key={item.key}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                      item.tone === 'emerald'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.tone === 'amber'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {item.label}
                  </span>
                ));
              })()}

              {!hasProPlan && (
                <Button variant="ghost" size="sm" onClick={() => router.push('/subscriptions')}>
                  Manage plan
                </Button>
              )}
            </div>
          )}
        </div>

        {totalDiscount > 0 && (
          <div className="mt-1 text-sm text-green-700">
            🎉 {totalDiscount}% discount applied! New price:{' '}
            <span className="font-bold">{formattedPrice}</span>
          </div>
        )}
        {discountError && <div className="mt-1 text-sm text-red-600">{discountError}</div>}
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

        {/* Price Display */}
        <div className="mt-4 rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Price for {creditsToBuyAmount} credits:</span>
            <span className="text-lg font-bold">{formattedPrice}</span>
          </div>
          {selectedCurrency.code !== 'INR' && (
            <div className="mt-1 text-xs text-muted-foreground">
              Original price: ₹{discountedPriceINR.toFixed(2)}
            </div>
          )}
        </div>

        <div className="h-4"></div>

        {/* Currency Selector */}
        <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <label htmlFor="currency-selector" className="text-sm font-medium">
            Currency:
          </label>
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            className="w-full sm:w-48"
          />
          {isLoadingRates && (
            <span className="text-xs text-muted-foreground">Updating rates...</span>
          )}
        </div>

        {/* Coupon code UI */}
        <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Enter coupon code"
            className="w-full rounded border px-2 py-1 sm:w-64"
          />
          <Button onClick={handleApplyCoupon} variant="outline">
            Apply Coupon
          </Button>
        </div>
        {couponStatus && <div className="mb-2 mt-1 text-sm">{couponStatus}</div>}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              Buy {creditsToBuyAmount} credits for {formattedPrice}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md md:max-w-lg">
            <DialogHeader className="mb-4">
              <DialogTitle>Purchase Credits</DialogTitle>
              <DialogDescription>
                Enter your card details to purchase {creditsToBuyAmount} credits.
              </DialogDescription>
            </DialogHeader>
            <div className="px-4 pb-4 pt-2">
              <PaymentForm
                creditsToBuy={creditsToBuyAmount}
                price={discountedPriceINR.toFixed(2)}
                discountBreakdown={discountBreakdown}
                onSuccess={handlePaymentSuccess}
              />
              {selectedCurrency.code !== 'INR' && (
                <div className="mt-4 rounded-md border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <p className="text-xs">
                    <strong>Note:</strong> Payment will be processed in Indian Rupees (₹
                    {discountedPriceINR.toFixed(2)}). The {selectedCurrency.name} amount (
                    {formattedPrice}) is shown for reference only.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-8"></div>
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-start justify-between gap-2 border-b p-4 pb-2 sm:flex-row sm:items-center sm:gap-0 sm:p-6 sm:pb-4">
          <div className="w-full">
            <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
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
                  <div className="flex w-full flex-col items-center">
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
                      <div className="w-full text-center text-muted-foreground">
                        Not enough data <br /> Buy more credits to see it
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              View your credit purchase history
            </p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              It may show full price instead of discountedPrice but the price deducted was
              discounted if the discount got applied
            </p>
          </div>
          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilterModal(true)}
                disabled={isTransactionsLoading}
                className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                  hasActiveFilters
                    ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-blue-100 hover:from-blue-100 hover:to-blue-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title="Filter transactions"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 transition-transform group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                    />
                  </svg>
                  <span>Filter</span>
                  {hasActiveFilters && (
                    <span className="animate-pulse rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                      {filteredTransactions.length}
                    </span>
                  )}
                </div>
              </button>

              {transactions && transactions.length > 10 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  disabled={isTransactionsLoading}
                  className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  title={showAllHistory ? 'Show recent transactions' : 'Show all transactions'}
                >
                  <svg
                    className="h-4 w-4 transition-transform group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {showAllHistory ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    )}
                  </svg>
                  <span>{showAllHistory ? 'Show Recent' : 'View All'}</span>
                  <span className="text-xs text-gray-500">
                    ({showAllHistory ? '10' : transactions.length})
                  </span>
                </button>
              )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 shadow-sm">
              {isTransactionsLoading ? (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading history...</span>
                </span>
              ) : (
                <span className="text-lg font-semibold text-blue-800">
                  {hasActiveFilters ? filteredTransactions.length : (transactions?.length ?? 0)}{' '}
                  {(hasActiveFilters
                    ? filteredTransactions.length
                    : (transactions?.length ?? 0)) === 1
                    ? 'purchase'
                    : 'purchases'}
                </span>
              )}
            </div>
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
                filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction: Transaction) => (
                    <TableRow key={transaction.id} className="transition hover:bg-muted">
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
                        <span className="rounded bg-green-50 px-2 py-1 font-semibold text-green-700">
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
                          {formatCurrency(
                            convertCurrency(
                              (transaction.credits / 50) * 75,
                              'INR',
                              selectedCurrency.code,
                              exchangeRates,
                            ),
                            selectedCurrency,
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <span>No transactions match your filters</span>
                        <button
                          onClick={clearFilters}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      {isTransactionsLoading ? (
                        <div className="inline-flex items-center gap-2 text-sm">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span aria-live="polite">Loading purchase history...</span>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-none bg-white shadow-2xl dark:bg-gray-900 sm:max-w-lg">
          <DialogHeader className="space-y-3 pb-2">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                  />
                </svg>
              </div>
              Filter Transactions
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
              Filter your purchase history by date range, amount, or credits to find specific
              transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Date Range Filters */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    min="2025-08-01"
                    max="2025-09-03"
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:bg-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    min="2025-08-01"
                    max="2025-09-03"
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:bg-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Amount Filter */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                Amount Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Minimum amount"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  min="0"
                  step="1"
                  className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-700"
                />
                <input
                  type="number"
                  placeholder="Maximum amount"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  min="0"
                  step="0.01"
                  className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-700"
                />
              </div>
            </div>

            {/* Credits Filter */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Credits Filter
              </label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={filters.creditsOperator}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      creditsOperator: e.target.value as any,
                    }))
                  }
                  className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:bg-gray-700"
                >
                  <option value="all">All</option>
                  <option value="greater">Greater than</option>
                  <option value="less">Less than</option>
                  <option value="equal">Equal to</option>
                </select>
                <input
                  type="number"
                  placeholder="Credits"
                  value={filters.creditsValue}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, creditsValue: e.target.value }))
                  }
                  disabled={filters.creditsOperator === 'all'}
                  className="col-span-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-700 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Filter Results Summary */}
            {hasActiveFilters && (
              <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow-sm">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    <span className="font-bold">{filteredTransactions.length}</span> of{' '}
                    <span className="font-bold">{transactions?.length || 0}</span> transactions
                    match your filters
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-medium transition-all duration-200 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear All
            </Button>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowFilterModal(false)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingPage;
