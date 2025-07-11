'use client';

import React, { useState, useEffect } from 'react';
import { Coupon } from '../appwriteCoupons';
import { Button } from '@/components/ui/button';
import { Tag, Clock, Info, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailableCouponsProps {
  onSelectCoupon: (coupon: { code: string; discount: number; name: string }) => void;
  appliedCoupon: { code: string; discount: number } | null;
}

export default function AvailableCoupons({ onSelectCoupon, appliedCoupon }: AvailableCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/coupons');
        if (!res.ok) throw new Error('Failed to fetch coupons');
        const data = await res.json();
        setCoupons(data.coupons || []);
      } catch (err) {
        console.error('Error fetching coupons:', err);
        setError('Unable to load available coupons');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

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
          
          return (
            <div
              key={coupon.$id}
              className={cn(
                "border rounded-md p-3 relative transition-all",
                isApplied 
                  ? "border-green-500 bg-green-50" 
                  : "hover:border-blue-300 hover:bg-blue-50/50"
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
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Expires: {formatExpiryDate(coupon.expiresAt)}</span>
                </div>
                
                <Button
                  size="sm"
                  variant={isApplied ? "outline" : "default"}
                  className={cn(
                    "text-xs py-1 h-7",
                    isApplied && "border-green-500 text-green-700"
                  )}
                  onClick={() => onSelectCoupon({
                    code: coupon.code,
                    discount: coupon.discount,
                    name: coupon.name
                  })}
                  disabled={isApplied}
                >
                  {isApplied ? "Applied" : "Apply"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
