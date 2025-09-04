'use client';

import { format } from 'date-fns';
import { Clock, Percent, Sparkles, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  onPlanApplied?: (discount: number, planName: string) => void;
}

export default function GlobalPlans({ onPlanApplied }: GlobalPlansProps) {
  const [globalPlans, setGlobalPlans] = useState<GlobalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingPlan, setApplyingPlan] = useState<string | null>(null);

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
        onPlanApplied(data.discount, data.planName);
      }

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading special offers...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (globalPlans.length === 0) {
    return null; // Don't show anything if no plans available
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
          <Sparkles className="h-5 w-5" />
          Special Offers
        </CardTitle>
        <CardDescription className="text-purple-700 dark:text-purple-300">
          Limited-time deals you can use once! Apply one before checkout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {globalPlans.map((plan) => (
          <div
            key={plan.id}
            className="flex items-center justify-between rounded-lg border border-purple-200 bg-white/50 p-4 dark:border-purple-700 dark:bg-black/20"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Percent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {plan.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-4 text-xs text-purple-600 dark:text-purple-400">
                    {plan.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires {format(new Date(plan.expiresAt), 'MMM d, yyyy')}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {plan._count.usages} people used this
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                {plan.discount}% OFF
              </Badge>
              <Button
                onClick={() => handleApplyPlan(plan.id)}
                disabled={applyingPlan === plan.id}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
              >
                {applyingPlan === plan.id ? 'Applying...' : 'Apply'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
