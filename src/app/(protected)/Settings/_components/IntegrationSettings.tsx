import React from 'react';

export default function IntegrationSettings() {
  return (
    <section className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-10 flex flex-col gap-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Integration Settings</h2>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">GitHub</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>Connect</button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Slack</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>Connect</button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Google Drive</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>Connect</button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Notion</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>Connect</button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Zapier</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>Connect</button>
        </div>
      </div>
    </section>
  );
}
