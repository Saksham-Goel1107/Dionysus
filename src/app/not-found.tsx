'use client';

import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 text-white">
      <div className="absolute left-[-100px] top-[-100px] z-0 h-[300px] w-[300px] rounded-full bg-blue-500 opacity-30 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] z-0 h-[350px] w-[350px] rounded-full bg-pink-500 opacity-30 blur-3xl" />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="mb-2 animate-pulse bg-gradient-to-r from-blue-400 via-pink-400 to-red-600 bg-clip-text text-[8rem] font-extrabold text-transparent drop-shadow-lg">
          404
        </h1>
        <p className="mb-6 text-center text-3xl font-semibold text-gray-200 drop-shadow md:text-4xl">
          Oops! Page not found.
        </p>
        <Link
          href="/dashboard"
          className="inline-block transform rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-red-500 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-red-600 focus:outline-none focus:ring-4 focus:ring-blue-400"
        >
          Go To Dashboard
        </Link>
      </div>
    </div>
  );
}
