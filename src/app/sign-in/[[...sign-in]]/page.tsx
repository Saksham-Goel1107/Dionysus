import { SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const { userId } = await auth();
  const sparams = await searchParams;
  const isAddingAccount = Boolean(sparams?.__clerk_add_account);

  if (userId && !isAddingAccount) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600 opacity-30 rounded-full blur-3xl z-0 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-700 opacity-20 rounded-full blur-2xl z-0 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 opacity-10 rounded-full blur-2xl z-0" />
        <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl bg-white/90 dark:bg-gray-950/90 border border-gray-200 dark:border-gray-800 flex flex-col items-center animate-fade-in z-10 backdrop-blur-md">
          <div className="mb-6 flex flex-col items-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight mb-1 text-center">
              You are already signed in
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center text-base max-w-xs">
              Would you like to go to your dashboard or sign in with another account?
            </p>
          </div>
          <div className="w-full flex flex-col items-center gap-3">
            <Link href="/dashboard" className="w-full">
              <button className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Go to Dashboard
              </button>
            </Link>
            <Link href="/sign-in?__clerk_add_account=true" className="w-full">
              <button className="w-full py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold border border-gray-300 dark:border-gray-700">
                Sign in with another account
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600 opacity-30 rounded-full blur-3xl z-0 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-700 opacity-20 rounded-full blur-2xl z-0 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 opacity-10 rounded-full blur-2xl z-0" />
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl bg-white/90 dark:bg-gray-950/90 border border-gray-200 dark:border-gray-800 flex flex-col items-center animate-fade-in z-10 backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight mb-1">
            Welcome Back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center text-base max-w-xs">
            Sign in to continue to Dionysus, your AI-powered GitHub assistant.
          </p>
        </div>
        <div className="w-full flex flex-col items-center">
          <SignIn
            appearance={{
              elements: {
                card: 'shadow-none bg-transparent border-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold',
                footerAction: 'text-center',
              },
            }}
          />
        </div>
        <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-blue-600">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-blue-600">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
