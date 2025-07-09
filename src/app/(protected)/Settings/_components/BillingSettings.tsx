import React from 'react';

export default function BillingSettings() {
  return (
    <section className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-10 flex flex-col gap-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Billing Settings</h2>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
            Current Plan
          </label>
          <input className="input input-bordered w-full text-sm" placeholder="Pro" disabled />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
            Payment Method
          </label>
          <input
            className="input input-bordered w-full text-sm"
            placeholder="Visa **** 4242"
            disabled
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button className="btn btn-outline w-full sm:w-auto text-xs sm:text-sm" disabled>
            Update Payment
          </button>
          <button className="btn btn-outline w-full sm:w-auto text-xs sm:text-sm" disabled>
            View Invoices
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button className="btn btn-error w-full sm:w-auto text-xs sm:text-sm" disabled>
            Cancel Subscription
          </button>
          <button className="btn btn-outline w-full sm:w-auto text-xs sm:text-sm" disabled>
            Upgrade Plan
          </button>
        </div>
      </div>
    </section>
  );
}
