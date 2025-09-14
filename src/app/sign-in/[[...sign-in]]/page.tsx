import { ModeToggle } from '@/app/components/ThemeToggle';
import { SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
export default async function Page() {
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Background Elements */}
      <div className="absolute -left-32 -top-32 z-0 h-96 w-96 animate-pulse rounded-full bg-blue-600 opacity-30 blur-3xl" />
      <div className="absolute bottom-0 right-0 z-0 h-80 w-80 animate-pulse rounded-full bg-purple-700 opacity-20 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 z-0 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 opacity-10 blur-2xl" />

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Content */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12 lg:py-12">
          <div className="mx-auto max-w-md space-y-8">
            {/* Logo/Brand */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <h1 className="mb-2 text-4xl font-bold text-white">Dionysus</h1>
              <p className="text-xl text-gray-300">AI-Powered GitHub Analytics</p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Code Analysis</h3>
                  <p className="text-gray-300">
                    Get intelligent insights and recommendations for your codebase
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Team Collaboration</h3>
                  <p className="text-gray-300">
                    Enhanced teamwork with meeting transcription and insights
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-600">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Repository Insights</h3>
                  <p className="text-gray-300">Comprehensive analytics and performance metrics</p>
                </div>
              </div>
            </div>

            {/* Stats/Testimonial */}
            <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <span className="text-lg font-bold text-white">S</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Sarah Chen</p>
                  <p className="text-sm text-gray-300">Senior Developer at TechCorp</p>
                </div>
              </div>
              <p className="italic text-gray-200">
                &ldquo;Dionysus transformed how our team analyzes code quality and collaboration.
                The AI insights are game-changing.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="absolute right-4 top-4 lg:right-12 lg:top-12">
              <ModeToggle />
            </div>

            <div className="mb-8 text-center lg:hidden">
              <h1 className="mb-2 text-3xl font-bold text-white">Dionysus</h1>
              <p className="text-gray-300">AI-Powered GitHub Analytics</p>
            </div>

            <div className="animate-fade-in flex flex-col items-center rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90 sm:p-8">
              <div className="mb-6 flex flex-col items-center">
                <h2 className="mb-1 text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300 sm:text-4xl">
                  Welcome Back
                </h2>
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
        </div>
      </div>
    </div>
  );
}
