import React from 'react';

export default function NotificationSettings() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900 sm:p-6 md:p-10">
      <h2 className="mb-4 text-2xl font-bold text-blue-700">Notification Settings</h2>
      <form className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Email Notifications
          </span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Push Notifications
          </span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            SMS Notifications
          </span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Weekly Summary
          </span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Product Updates
          </span>
          <input type="checkbox" className="toggle" disabled />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="btn btn-primary w-full px-6 text-xs sm:w-auto sm:px-8 sm:text-sm"
            disabled
          >
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}
