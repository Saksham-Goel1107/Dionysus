'use client';

import { format } from 'date-fns';
import { Clock, Percent, Sparkles, Users, Gift } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
          className="flex w-full items-center gap-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20 dark:text-purple-300"
          disabled={isLoading}
        >
          <Gift className="h-4 w-4" />
          {isLoading ? 'Loading Special Offers...' : `View Special Offers (${globalPlans.length})`}
          <Sparkles className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Special Offers
          </DialogTitle>
          <DialogDescription>
            Limited-time deals you can use once! Apply one to get a discount on your purchase.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-gray-500">Loading special offers...</div>
            </div>
          ) : globalPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Gift className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No special offers available
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check back later for new deals and discounts!
              </p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {globalPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                            <Percent className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                              {plan.name}
                            </h3>
                            {plan.description && (
                              <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                                {plan.description}
                              </p>
                            )}
                            <div className="mt-3 flex items-center gap-6 text-sm text-purple-600 dark:text-purple-400">
                              {plan.expiresAt && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Expires {format(new Date(plan.expiresAt), 'MMM d, yyyy')}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Many people already used this
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col items-end gap-3">
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 px-4 py-2 text-lg text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        >
                          {plan.discount}% OFF
                        </Badge>
                        <Button
                          onClick={() => handleApplyPlan(plan.id)}
                          disabled={applyingPlan === plan.id}
                          className="bg-purple-600 px-6 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                          size="lg"
                        >
                          {applyingPlan === plan.id ? 'Applying...' : 'Apply Offer'}
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
