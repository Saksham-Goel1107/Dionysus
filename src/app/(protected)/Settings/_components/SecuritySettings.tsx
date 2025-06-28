import React from 'react';

export default function SecuritySettings() {
  return (
    <section className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-10 flex flex-col gap-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Security Settings</h2>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Password</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>Change Password</button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Two-Factor Authentication</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>Enable 2FA</button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Login Alerts</span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Device Management</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>View Devices</button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Session Timeout</span>
          <select className="input input-bordered w-full sm:w-32 text-sm" disabled>
            <option>30 min</option>
            <option>1 hour</option>
            <option>2 hours</option>
          </select>
        </div>
      </div>
    </section>
  );
}
