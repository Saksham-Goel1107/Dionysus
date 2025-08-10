import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function BlockPage() {
  const cookiesList = await cookies();
  const redirectCookie = cookiesList.get('middleware_redirect');

  if (!redirectCookie) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white">
      <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-800 p-8 text-center shadow-lg">
        <h1 className="mb-4 text-4xl font-bold text-red-500">Access Restricted</h1>
        <p className="mb-6 text-lg text-gray-200">
          Sorry, our service is not available in your country at this time.
          <br />
          If you believe this is a mistake, please contact support.
        </p>
        <div className="text-sm text-gray-400">
          Your access has been blocked due to regional restrictions.
          <br />
          Thank you for your understanding.
        </div>
      </div>
    </div>
  );
}
