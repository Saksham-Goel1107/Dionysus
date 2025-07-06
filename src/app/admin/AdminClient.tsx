'use client';
import CouponGenerator from './CouponGenerator';

export default function AdminClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="bg-white/90 dark:bg-gray-950/90 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-4">Admin Panel</h1>
        <p className="mb-2">Welcome, Saksham! You are authenticated as admin.</p>
        <CouponGenerator />
      </div>
    </div>
  );
}
