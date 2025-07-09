'use client';

import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6 relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-blue-500 opacity-30 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-pink-500 opacity-30 rounded-full blur-3xl z-0" />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-[8rem] font-extrabold mb-2 bg-gradient-to-r from-blue-400 via-pink-400 to-red-600 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
          404
        </h1>
        <p className="text-3xl md:text-4xl font-semibold mb-6 text-gray-200 text-center drop-shadow">
          Oops! Page not found.
        </p>
        <Link
          href="/dashboard"
          className="inline-block text-white bg-gradient-to-br from-blue-500 via-purple-500 to-red-500 hover:from-blue-600 hover:to-red-600 font-bold rounded-full text-lg px-10 py-4 shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400"
        >
          Go To Dashboard
        </Link>
      </div>
    </div>
  );
}
