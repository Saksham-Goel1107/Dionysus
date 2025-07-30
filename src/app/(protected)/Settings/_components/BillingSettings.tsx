import React from 'react';

export default function BillingSettings() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900 sm:p-6 md:p-10">
      <h2 className="mb-4 text-2xl font-bold text-blue-700">Billing Settings</h2>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Current Plan
          </label>
          <input className="input input-bordered w-full text-sm" placeholder="Pro" disabled />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Payment Method
          </label>
          <input
            className="input input-bordered w-full text-sm"
            placeholder="Visa **** 4242"
            disabled
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <button className="btn btn-outline w-full text-xs sm:w-auto sm:text-sm" disabled>
            Update Payment
          </button>
          <button className="btn btn-outline w-full text-xs sm:w-auto sm:text-sm" disabled>
            View Invoices
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <button className="btn btn-error w-full text-xs sm:w-auto sm:text-sm" disabled>
            Cancel Subscription
          </button>
          <button className="btn btn-outline w-full text-xs sm:w-auto sm:text-sm" disabled>
            Upgrade Plan
          </button>
        </div>
      </div>
    </section>
  );
}
