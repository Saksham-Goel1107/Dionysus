'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Clock, Crown, Gift, Percent, Sparkles, Star, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GlobalPlan {
  id: string;
  name: string;
  description: string | null;
  discount: number;
  expiresAt: string | null;
  _count: {
    usages: number;
  };
}

interface GlobalPlansProps {
  onPlanApplied?: (discount: number, planName: string, planId: string) => void;
}

export default function GlobalPlans({ onPlanApplied }: GlobalPlansProps) {
  const [globalPlans, setGlobalPlans] = useState<GlobalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingPlan, setApplyingPlan] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchGlobalPlans();
  }, []);

  const fetchGlobalPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/global-plans');

      if (!response.ok) {
        throw new Error('Failed to fetch global plans');
      }

      const data = await response.json();
      setGlobalPlans(data.globalPlans);
    } catch (error: any) {
      console.error('Error fetching global plans:', error);
      // Don't show error toast for this as it's not critical
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPlan = async (planId: string) => {
    try {
      setApplyingPlan(planId);

      const response = await fetch(`/api/global-plans/${planId}/apply`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply global plan');
      }

      const data = await response.json();

      // Remove the applied plan from the list
      setGlobalPlans((prev) => prev.filter((plan) => plan.id !== planId));

      // Notify parent component
      if (onPlanApplied) {
        onPlanApplied(data.discount, data.planName, data.planId);
      }

      // Close modal after successful application
      setIsModalOpen(false);

      toast({
        title: 'Success!',
        description: `${data.planName} applied! You got ${data.discount}% discount.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply global plan.',
        variant: 'destructive',
      });
    } finally {
      setApplyingPlan(null);
    }
  };

  // Don't show anything if no plans available
  if (!isLoading && globalPlans.length === 0) {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={isLoading}
          className={`group relative w-full overflow-hidden border-2 bg-gradient-to-r from-transparent via-transparent to-transparent text-purple-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/25 dark:border-purple-600 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30 dark:text-purple-300`}
        >
          {/* Hover Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-indigo-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Content */}
          <div className="relative flex items-center gap-3 px-2 py-1">
            {/* Icon Badge */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-md">
              <Gift className="h-4 w-4 text-white" aria-hidden="true" />
            </div>

            {/* Text */}
            <div className="flex flex-col items-start">
              <span className="font-semibold leading-tight">
                {isLoading ? 'Loading Special Offers...' : 'Exclusive Offers'}
              </span>
              {!isLoading && globalPlans.length > 0 && (
                <span className="text-xs leading-tight opacity-75">
                  {globalPlans.length} available deal{globalPlans.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Decorative Icons */}
            <div className="ml-auto flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse text-purple-500" aria-hidden="true" />
              <Zap
                className="h-4 w-4 text-indigo-500 transition-transform duration-300 group-hover:rotate-12"
                aria-hidden="true"
              />
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-0 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 shadow-2xl backdrop-blur-xl dark:from-gray-900 dark:via-purple-950/20 dark:to-pink-950/20">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shadow-xl">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-center text-2xl font-bold text-transparent">
            Exclusive Special Offers
          </DialogTitle>
          <DialogDescription className="text-center text-base text-gray-600 dark:text-gray-300">
            Limited-time premium deals crafted just for you. Apply once and save big on your next
            purchase!
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 animate-pulse text-purple-500" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                Discovering amazing offers...
              </p>
            </div>
          ) : globalPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                <Gift className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-gray-100">
                No Active Offers Right Now
              </h3>
              <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
                We&apos;re working on bringing you amazing deals. Check back soon for exclusive
                offers and special discounts!
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Star className="h-4 w-4" />
                <span>New offers added regularly</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pr-4">
              {globalPlans.map((plan, index) => (
                <Card
                  key={plan.id}
                  className="group relative overflow-hidden border-2 border-purple-200/50 bg-gradient-to-r from-white via-purple-50/50 to-pink-50/50 shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 dark:border-purple-700/50 dark:from-gray-900 dark:via-purple-950/20 dark:to-pink-950/20"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-400 blur-2xl"></div>
                    <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-pink-400 blur-2xl"></div>
                  </div>

                  <CardContent className="relative p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-6">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shadow-xl">
                            <Percent className="h-10 w-10 text-white" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {plan.name}
                              </h3>
                              {plan.description && (
                                <p className="mt-2 text-base leading-relaxed text-gray-600 dark:text-gray-300">
                                  {plan.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                              {plan.expiresAt && (
                                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 dark:bg-amber-950/30">
                                  <Clock className="h-4 w-4 text-amber-600" />
                                  <span className="font-medium">
                                    Expires {format(new Date(plan.expiresAt), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 dark:bg-blue-950/30">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Already redeemed by many people</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-4 lg:items-end">
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                              {plan.discount}%
                            </div>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              OFF
                            </div>
                          </div>
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg">
                            <Zap className="h-8 w-8 text-white" />
                          </div>
                        </div>

                        <Button
                          onClick={() => handleApplyPlan(plan.id)}
                          disabled={applyingPlan === plan.id}
                          className="group/btn relative w-full min-w-[160px] overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                          size="lg"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
                          <div className="relative flex items-center gap-3">
                            {applyingPlan === plan.id ? (
                              <>
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                <span>Applying...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-5 w-5 animate-pulse" />
                                <span>Claim Offer</span>
                                <div className="ml-2 transition-transform duration-300 group-hover/btn:translate-x-1">
                                  →
                                </div>
                              </>
                            )}
                          </div>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
