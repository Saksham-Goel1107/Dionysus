import React from 'react';

export default function SecuritySettings() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900 sm:p-6 md:p-10">
      <h2 className="mb-4 text-2xl font-bold text-blue-700">Security Settings</h2>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>
            Change Password
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Two-Factor Authentication
          </span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>
            Enable 2FA
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Login Alerts</span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Device Management
          </span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>
            View Devices
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Session Timeout
          </span>
          <select className="input input-bordered w-full text-sm sm:w-32" disabled>
            <option>30 min</option>
            <option>1 hour</option>
            <option>2 hours</option>
          </select>
        </div>
      </div>
    </section>
  );
}
