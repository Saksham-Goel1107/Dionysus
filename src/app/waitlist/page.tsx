import { ModeToggle } from '@/app/components/ThemeToggle';
import { Waitlist } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    return redirect('/sync-user');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="absolute -left-32 -top-32 z-0 h-96 w-96 animate-pulse rounded-full bg-blue-600 opacity-30 blur-3xl" />
      <div className="absolute bottom-0 right-0 z-0 h-80 w-80 animate-pulse rounded-full bg-purple-700 opacity-20 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 z-0 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 opacity-10 blur-2xl" />
      <div className="animate-fade-in relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90 sm:p-8">
        <div className="absolute right-2 top-2">
          <ModeToggle />
        </div>
        <div className="mb-6 flex flex-col items-center">
          <h1 className="mb-1 text-center text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300 sm:text-4xl">
            Join the Dionysus Waitlist
          </h1>
          <p className="max-w-xs text-center text-base text-gray-500 dark:text-gray-400">
            Be the first to experience Dionysus, your AI-powered GitHub assistant. Enter your email
            to join the waitlist and get early access.
          </p>
        </div>
        <div className="flex w-full flex-col items-center">
          <Waitlist
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
      </div>
    </div>
  );
}
