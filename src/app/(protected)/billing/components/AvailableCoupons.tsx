'use client';

import React, { useState, useEffect } from 'react';
import { Coupon } from '../appwriteCoupons';
import { Button } from '@/components/ui/button';
import { Tag, Clock, Info, Check, AlertCircle, X, CheckCircle, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AvailableCouponsProps {
  onSelectCoupon: (coupon: { code: string; discount: number; name: string }) => void;
  appliedCoupon: { code: string; discount: number } | null;
  cartTotal: number; // Actual cart total from parent component
}

export default function AvailableCoupons({ 
  onSelectCoupon, 
  appliedCoupon, 
  cartTotal 
}: AvailableCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponUsageStatus, setCouponUsageStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Check the usage status of one-time coupons
  const checkCouponUsageStatus = React.useCallback(async (oneTimeCoupons: Coupon[]) => {
    try {
      const res = await fetch('/api/coupons/check-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponIds: oneTimeCoupons.map(c => c.$id)
        }),
      });
      
      if (!res.ok) throw new Error('Failed to check coupon usage status');
      
      const data = await res.json();
      setCouponUsageStatus(data.usageStatus || {});
    } catch (err) {
      console.error('Error checking coupon usage:', err);
      toast({
        title: "Warning",
        description: "Could not verify coupon usage history. Some restrictions may not be displayed correctly.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/coupons');
        if (!res.ok) throw new Error('Failed to fetch coupons');
        const data = await res.json();
        setCoupons(data.coupons || []);
        
        // Get usage status for one-time coupons
        if (data.coupons?.length) {
          const oneTimeCoupons = data.coupons.filter((c: Coupon) => c.isOneTimeUse);
          if (oneTimeCoupons.length) {
            await checkCouponUsageStatus(oneTimeCoupons);
          }
        }
      } catch (err) {
        console.error('Error fetching coupons:', err);
        setError('Unable to load available coupons');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [checkCouponUsageStatus, toast]);
  
  // Check if the minimum order value requirement is met
  const meetsMinOrderValue = (coupon: Coupon) => {
    return !coupon.minimumOrderValue || cartTotal >= coupon.minimumOrderValue;
  };

  // Check if this is the first use of a one-time coupon
  const isFirstUse = (coupon: Coupon) => {
    if (!coupon.isOneTimeUse) return true;
    // If we have status data, use it; otherwise assume it can be used (will be validated on apply)
    return coupon.$id ? couponUsageStatus[coupon.$id] !== true : true;
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        <div className="animate-pulse flex justify-center items-center">
          <div className="h-4 w-4 bg-gray-300 rounded-full mr-2"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-2 text-center text-sm text-red-500 flex items-center justify-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        {error}
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="py-2 text-center text-sm text-gray-500">
        No coupons available for you at this time.
      </div>
    );
  }

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <h3 className="font-medium text-sm mb-2">Available Coupons</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {coupons.map((coupon) => {
          const isApplied = appliedCoupon?.code === coupon.code;
          const meetsMinValue = meetsMinOrderValue(coupon);
          const canUseAgain = isFirstUse(coupon);
          const canApply = meetsMinValue && canUseAgain;
          
          return (
            <div
              key={coupon.$id}
              className={cn(
                "border rounded-md p-3 relative transition-all",
                isApplied 
                  ? "border-green-500 bg-green-50" 
                  : canApply
                    ? "hover:border-blue-300 hover:bg-blue-50/50"
                    : "border-gray-200 bg-gray-50"
              )}
            >
              {isApplied && (
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                  <div className="bg-green-500 text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <Tag className="h-3 w-3 mr-1 text-blue-500" />
                    <span className="font-semibold text-sm">{coupon.name}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{coupon.description}</div>
                </div>
                <div className="text-green-600 font-bold">{coupon.discount}% OFF</div>
              </div>
              
              {/* Restrictions section */}
              {(coupon.isOneTimeUse || (typeof coupon.minimumOrderValue === 'number' && coupon.minimumOrderValue > 0)) && (
                <div className="mt-2 border-t pt-2 border-dashed border-gray-200">
                  <div className="flex flex-col gap-1.5">
                    {coupon.isOneTimeUse && (
                      <div className={cn(
                        "flex items-center text-xs",
                        canUseAgain ? "text-gray-600" : "text-red-500"
                      )}>
                        {canUseAgain ? (
                          <CheckCircle className="h-3 w-3 mr-1.5" />
                        ) : (
                          <X className="h-3 w-3 mr-1.5" />
                        )}
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          One-time use
                          {!canUseAgain && " - Already used"}
                        </span>
                      </div>
                    )}
                    
                    {typeof coupon.minimumOrderValue === 'number' && coupon.minimumOrderValue > 0 && (
                      <div className={cn(
                        "flex items-center text-xs",
                        meetsMinValue ? "text-gray-600" : "text-amber-600"
                      )}>
                        {meetsMinValue ? (
                          <CheckCircle className="h-3 w-3 mr-1.5" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1.5" />
                        )}
                        <span className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Min. order: ${(coupon.minimumOrderValue ?? 0).toFixed(2)}
                          {!meetsMinValue && ` - Current: $${cartTotal.toFixed(2)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Expires: {formatExpiryDate(coupon.expiresAt)}</span>
                </div>
                
                <Button
                  size="sm"
                  variant={isApplied ? "outline" : canApply ? "default" : "outline"}
                  className={cn(
                    "text-xs py-1 h-7",
                    isApplied 
                      ? "border-green-500 text-green-700" 
                      : !canApply && "text-gray-400 border-gray-300"
                  )}
                  onClick={() => onSelectCoupon({
                    code: coupon.code,
                    discount: coupon.discount,
                    name: coupon.name
                  })}
                  disabled={isApplied || !canApply}
                >
                  {isApplied ? "Applied" : canApply ? "Apply" : "Cannot Apply"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
