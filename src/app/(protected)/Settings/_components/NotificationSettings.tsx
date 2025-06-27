import React from 'react';

export default function NotificationSettings() {
  return (
    <section className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-10 flex flex-col gap-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Notification Settings</h2>
      <form className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Email Notifications</span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Push Notifications</span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">SMS Notifications</span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Weekly Summary</span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Product Updates</span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex justify-end mt-4">
          <button className="btn btn-primary px-6 sm:px-8 w-full sm:w-auto text-xs sm:text-sm" disabled>Save Changes</button>
        </div>
      </form>
    </section>
  );
}
