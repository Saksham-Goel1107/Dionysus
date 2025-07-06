'use client';
import React, { useState } from 'react';
import { generateCouponCode } from '../(protected)/billing/couponUtils';

export default function CouponGenerator() {
  const [discount, setDiscount] = useState(10);
  const [minutes, setMinutes] = useState(10);
  const [coupon, setCoupon] = useState('');
  const [status, setStatus] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Generating...');
    try {
      const code = await generateCouponCode(discount, minutes);
      if (typeof code === 'string') {
        setCoupon(code);
        setStatus('Coupon generated!');
      } else {
        setStatus('Error generating coupon.');
        setCoupon('');
      }
    } catch (err) {
      setStatus('Error generating coupon.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-6">
      <form onSubmit={handleGenerate} className="flex flex-col gap-4 w-full max-w-xs">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Discount (%)</span>
          <input
            type="number"
            min={1}
            max={99}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="border rounded px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Valid For (minutes)</span>
          <input
            type="number"
            min={1}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="border rounded px-2 py-1"
            required
          />
        </label>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mt-2 shadow"
        >
          Generate Coupon
        </button>
      </form>
      {status && <div className="text-sm text-gray-600">{status}</div>}
      {coupon && (
        <div className="w-full max-w-xl break-all bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-4 text-center">
          <div className="font-semibold mb-2">Coupon Code:</div>
          <div className="font-mono text-blue-700 dark:text-blue-300 text-sm select-all">
            {coupon}
          </div>
        </div>
      )}
    </div>
  );
}
