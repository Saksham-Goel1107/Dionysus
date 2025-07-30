import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RateLimitRedirector from './RateLimitRedirector';

export default async function RateLimitPage() {
  const cookiesList = await cookies();
  const redirectCookie = cookiesList.get('middleware_redirect');

  if (!redirectCookie) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white">
      <div className="w-full max-w-lg rounded-xl border border-red-600 bg-gray-800 p-8 text-center shadow-lg">
        <h1 className="mb-4 text-4xl font-bold text-red-500">Security Restriction</h1>
        <p className="mb-6 text-lg text-gray-200">
          Access to this service has been temporarily restricted for security reasons.
          <br />
          This is not an error and will be fixed automatically in some time.
          <br />
          This may be due to unusual activity, hitting a rate limit, or automated bot detection.
        </p>
        <div className="mb-4 text-sm text-gray-400">
          Please try again after some time.
          <br />
          If you believe this is a mistake, contact our support team at{' '}
          <a href="mailto:sakshamgoel1107@gmail.com" className="text-blue-400 underline">
            sakshamgoel1107@gmail.com
          </a>{' '}
          for assistance.
        </div>
        <div className="text-xs text-gray-500">
          Your patience is appreciated as we work to keep our platform secure.
        </div>
        <RateLimitRedirector />
      </div>
    </div>
  );
}
