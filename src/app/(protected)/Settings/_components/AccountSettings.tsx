import React from 'react';

export default function AccountSettings() {
  return (
    <section className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-10 flex flex-col gap-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Account Settings</h2>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
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
          <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
            Timezone
          </label>
          <select className="input input-bordered w-full text-sm" disabled>
            <option>UTC</option>
            <option>GMT+1</option>
            <option>GMT-5</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
            Date Format
          </label>
          <select className="input input-bordered w-full text-sm" disabled>
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
            Theme
          </label>
          <select className="input input-bordered w-full text-sm" disabled>
            <option>System</option>
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex flex-col gap-2 mt-2">
          <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
            Account Status
          </label>
          <div className="flex items-center gap-2">
            <span className="badge badge-success">Active</span>
            <button className="btn btn-outline btn-xs" disabled>
              Request Deactivation
            </button>
          </div>
        </div>
        <div className="sm:col-span-2 flex justify-end mt-4">
          <button
            className="btn btn-primary px-6 sm:px-8 w-full sm:w-auto text-xs sm:text-sm"
            disabled
          >
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}
