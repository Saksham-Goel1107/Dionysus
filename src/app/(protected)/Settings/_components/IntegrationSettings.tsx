import React from 'react';

export default function IntegrationSettings() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900 sm:p-6 md:p-10">
      <h2 className="mb-4 text-2xl font-bold text-blue-700">Integration Settings</h2>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">GitHub</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>
            Connect
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Slack</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>
            Connect
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Google Drive</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>
            Connect
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Notion</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>
            Connect
          </button>
        </div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Zapier</span>
          <button className="btn btn-outline btn-xs sm:btn-sm w-full sm:w-auto" disabled>
            Connect
          </button>
        </div>
      </div>
    </section>
  );
}
