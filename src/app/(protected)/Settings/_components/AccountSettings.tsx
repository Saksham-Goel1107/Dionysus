import React from 'react';

export default function AccountSettings() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900 sm:p-6 md:p-10">
      <h2 className="mb-4 text-2xl font-bold text-blue-700">Account Settings</h2>
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Language
          </label>
          <select className="input input-bordered w-full text-sm" disabled>
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Timezone
          </label>
          <select className="input input-bordered w-full text-sm" disabled>
            <option>UTC</option>
            <option>GMT+1</option>
            <option>GMT-5</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Date Format
          </label>
          <select className="input input-bordered w-full text-sm" disabled>
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Theme
          </label>
          <select className="input input-bordered w-full text-sm" disabled>
            <option>System</option>
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Account Status
          </label>
          <div className="flex items-center gap-2">
            <span className="badge badge-success">Active</span>
            <button className="btn btn-outline btn-xs" disabled>
              Request Deactivation
            </button>
          </div>
        </div>
        <div className="mt-4 flex justify-end sm:col-span-2">
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
