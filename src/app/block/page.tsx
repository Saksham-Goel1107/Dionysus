import React from 'react';

export default function BlockPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="max-w-lg w-full bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-700">
        <h1 className="text-4xl font-bold mb-4 text-red-500">Access Restricted</h1>
        <p className="mb-6 text-lg text-gray-200">
          Sorry, our service is not available in your country at this time.<br />
          If you believe this is a mistake, please contact support.
        </p>
        <div className="text-sm text-gray-400">
          Your access has been blocked due to regional restrictions.<br />
          Thank you for your understanding.
        </div>
      </div>
    </div>
  );
}
