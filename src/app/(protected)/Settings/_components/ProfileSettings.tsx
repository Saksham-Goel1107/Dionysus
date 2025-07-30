import Image from 'next/image';
import React from 'react';

export default function ProfileSettings() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900 sm:p-6 md:p-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex w-full flex-shrink-0 flex-col items-center gap-2 md:w-auto">
          <Image
            src="/gemini.png"
            alt="Avatar"
            priority
            width={100}
            height={100}
            className="h-20 w-20 rounded-full border-4 border-blue-200 shadow sm:h-24 sm:w-24"
          />
          <button className="btn btn-outline w-full text-xs sm:text-sm md:w-auto" disabled>
            Change Avatar
          </button>
        </div>
        <div className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Full Name
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="Your name"
              disabled
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Email Address
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="Your email"
              disabled
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Username
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="Username"
              disabled
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Phone Number
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="Phone number"
              disabled
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Bio
          </label>
          <textarea
            className="input input-bordered w-full text-sm"
            placeholder="Short bio"
            rows={3}
            disabled
          />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Location
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="City, Country"
              disabled
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Website
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="https://yourwebsite.com"
              disabled
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 border-t pt-6 md:flex-row md:justify-between">
        <div className="flex w-full justify-center gap-2 sm:gap-4 md:w-auto md:justify-start">
          <button className="btn btn-outline w-1/2 text-xs sm:text-sm md:w-auto" disabled>
            Reset Profile
          </button>
          <button className="btn btn-error w-1/2 text-xs sm:text-sm md:w-auto" disabled>
            Delete Account
          </button>
        </div>
        <button
          className="btn btn-primary w-full px-6 text-xs sm:px-8 sm:text-sm md:w-auto"
          disabled
        >
          Save Changes
        </button>
      </div>
    </section>
  );
}
