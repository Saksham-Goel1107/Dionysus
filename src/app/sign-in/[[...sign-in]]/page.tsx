import { SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ModeToggle } from '@/app/components/ThemeToggle';

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const { userId } = await auth();
  // const sparams = await searchParams;
  // const isAddingAccount = Boolean(sparams?.__clerk_add_account);

  if (userId) {
    return redirect('/sync-user');
  }
  // if (userId && !isAddingAccount) {
  //   return (
  //     <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 overflow-hidden">
  //       <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600 opacity-30 rounded-full blur-3xl z-0 animate-pulse" />
  //       <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-700 opacity-20 rounded-full blur-2xl z-0 animate-pulse" />
  //       <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 opacity-10 rounded-full blur-2xl z-0" />
  //       <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl bg-white/90 dark:bg-gray-950/90 border border-gray-200 dark:border-gray-800 flex flex-col items-center animate-fade-in z-10 backdrop-blur-md">
  //         <div className="mb-6 flex flex-col items-center">
  //           <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight mb-1 text-center">
  //             You are already signed in
  //           </h1>
  //           <p className="text-gray-500 dark:text-gray-400 text-center text-base max-w-xs">
  //             Would you like to go to your dashboard or sign in with another account?
  //           </p>
  //         </div>
  //         <div className="w-full flex flex-col items-center gap-3">
  //           <Link href="/dashboard" className="w-full">
  //             <button className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">
  //               Go to Dashboard
  //             </button>
  //           </Link>
  //           <Link href="/sign-in?__clerk_add_account=true" className="w-full">
  //             <button className="w-full py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold border border-gray-300 dark:border-gray-700">
  //               Sign in with another account
  //             </button>
  //           </Link>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="absolute -left-32 -top-32 z-0 h-96 w-96 animate-pulse rounded-full bg-blue-600 opacity-30 blur-3xl" />
      <div className="absolute bottom-0 right-0 z-0 h-80 w-80 animate-pulse rounded-full bg-purple-700 opacity-20 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 z-0 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 opacity-10 blur-2xl" />
      <div className="animate-fade-in relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90 sm:p-8">
        <div className="absolute right-4 top-4">
          <ModeToggle />
        </div>
        <div className="mb-6 flex flex-col items-center">
          <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300 sm:text-4xl">
            Welcome Back
          </h1>
          <p className="max-w-xs text-center text-base text-gray-500 dark:text-gray-400">
            Sign in to continue to Dionysus, your AI-powered GitHub assistant.
          </p>
        </div>
        <div className="flex w-full flex-col items-center">
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
        <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
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
