import Image from 'next/image';
import React from 'react';

export default function ProfileSettings() {
  return (
    <section className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 md:p-10 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-shrink-0 flex flex-col items-center gap-2 w-full md:w-auto">
          <Image
            src="/gemini.png"
            alt="Avatar"
            priority
            width={100}
            height={100}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-blue-200 shadow"
          />
          <button className="btn btn-outline w-full md:w-auto text-xs sm:text-sm" disabled>
            Change Avatar
          </button>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
              Full Name
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="Your name"
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
              Email Address
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="Your email"
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
              Username
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="Username"
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
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
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
              Location
            </label>
            <input
              className="input input-bordered w-full text-sm"
              placeholder="City, Country"
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 text-sm">
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
      <div className="flex flex-col md:flex-row md:justify-between gap-4 items-center border-t pt-6">
        <div className="flex gap-2 sm:gap-4 w-full md:w-auto justify-center md:justify-start">
          <button className="btn btn-outline w-1/2 md:w-auto text-xs sm:text-sm" disabled>
            Reset Profile
          </button>
          <button className="btn btn-error w-1/2 md:w-auto text-xs sm:text-sm" disabled>
            Delete Account
          </button>
        </div>
        <button
          className="btn btn-primary px-6 sm:px-8 w-full md:w-auto text-xs sm:text-sm"
          disabled
        >
          Save Changes
        </button>
      </div>
    </section>
  );
}
