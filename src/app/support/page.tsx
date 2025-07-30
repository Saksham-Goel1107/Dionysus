'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Navbar } from '../components/navbar';
import Link from 'next/link';

export default function SupportPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      setChecking(true);
      return;
    }
    if (userId) {
      router.replace('/supportAuth');
      return;
    }
    setChecking(false);
  }, [userId, isLoaded, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 p-4 dark:from-gray-900 dark:to-gray-800">
        <div className="relative flex w-full max-w-4xl flex-col gap-10 rounded-2xl border border-blue-200 bg-white p-8 shadow-2xl dark:border-blue-800 dark:bg-gray-900">
          <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
            Support & Help Center
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-gray-700 dark:text-gray-300">
            Welcome to the Dionysus Support Center. We&apos;re here to help with any questions,
            issues, or feedback about your account, billing, privacy, technical problems, or
            anything else. Browse our resources, reach out, or join the community!
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex min-h-[220px] flex-col items-center rounded-xl border border-blue-200 bg-blue-100 p-6 shadow dark:border-blue-700 dark:bg-blue-900">
              <span className="mb-2 text-3xl">📚</span>
              <h3 className="mb-1 text-center font-bold text-blue-700 dark:text-blue-200">
                Documentation
              </h3>
              <p className="mb-2 text-center text-sm text-gray-700 dark:text-gray-300">
                Find guides, API docs, and tutorials to help you get the most out of Dionysus.
              </p>
              <a href="/docs" className="font-medium text-blue-700 underline dark:text-blue-300">
                Go to Docs
              </a>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-green-200 bg-green-100 p-6 shadow dark:border-green-700 dark:bg-green-900">
              <span className="mb-2 text-3xl">💬</span>
              <h3 className="mb-1 font-bold text-green-700 dark:text-green-200">Community & FAQ</h3>
              <p className="mb-2 text-center text-sm text-gray-700 dark:text-gray-300">
                Join our GitHub Discussions, browse FAQs, and connect with other users for tips and
                support.
              </p>
              <a
                href="https://github.com/Saksham-Goel1107/Dionysus/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-green-700 underline dark:text-green-400"
              >
                Join Github Discussions
              </a>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-yellow-200 bg-yellow-100 p-6 shadow dark:border-yellow-700 dark:bg-yellow-900">
              <span className="mb-2 text-3xl">📧</span>
              <h3 className="mb-1 font-bold text-yellow-700 dark:text-yellow-200">
                Contact Support
              </h3>
              <p className="mb-2 text-center text-sm text-gray-700 dark:text-gray-300">
                Need help? Email us directly or open a GitHub issue for technical support.
              </p>
              <a
                href="mailto:sakshamgoel1107@gmail.com"
                className="font-medium text-yellow-700 underline dark:text-yellow-400"
              >
                Email Support
              </a>
              <a
                href="https://github.com/Saksham-Goel1107/dionysus/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 font-medium text-yellow-700 underline dark:text-yellow-400"
              >
                Open GitHub Issue
              </a>
            </div>
          </div>

          {/* New: Feature Highlight Section */}
          <div className="mt-10 flex flex-col gap-8 md:flex-row">
            <div className="flex flex-1 flex-col gap-2 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-100 p-6 shadow-lg dark:border-blue-800 dark:from-gray-800 dark:to-gray-900">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
                Quick Links
              </h3>
              <ul className="space-y-1 text-base text-blue-700 dark:text-blue-300">
                <li>
                  <a href="/docs" className="underline">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/terms" className="underline">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="underline">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-blue-100 p-6 shadow dark:border-green-700 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center gap-2 text-base font-semibold text-green-700 dark:text-green-300">
                <span>💡</span>General Tips
              </div>
              <ul className="ml-2 list-inside list-disc text-xs text-gray-700 dark:text-gray-300">
                <li>Check the FAQ and documentation for instant answers.</li>
                <li>For urgent issues, use email or GitHub for fastest response.</li>
                <li>Never share your password or exported files with anyone.</li>
                <li>All support requests are confidential and handled promptly.</li>
                <li>We value your feedback to improve Dionysus for everyone!</li>
              </ul>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-yellow-100 p-6 shadow dark:border-red-700 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center gap-2 text-base font-semibold text-red-700 dark:text-red-300">
                <span>⚠️</span>Security & Privacy
              </div>
              <ul className="ml-2 list-inside list-disc text-xs text-gray-700 dark:text-gray-300">
                <li>
                  If you received a data export alert but did <b>not</b> export your data,{' '}
                  <a
                    href="mailto:sakshamgoel1107@gmail.com"
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    contact us immediately
                  </a>
                  .
                </li>
                <li>All exports and sensitive actions are logged for your protection.</li>
                <li>We never store your password or decrypted data.</li>
                <li>
                  For privacy questions, see{' '}
                  <a href="/privacy" className="underline">
                    our policy
                  </a>
                  .
                </li>
              </ul>
            </div>
          </div>

          {/* New: Testimonials Section */}
          <div className="mt-10">
            <h3 className="mb-6 text-center text-2xl font-bold text-blue-700 dark:text-blue-300">
              What Our Users Say
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 p-5 shadow dark:border-blue-700 dark:bg-gray-800">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">🌟</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Aarav S.</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  “Dionysus support is fast, friendly, and always solves my issues. The docs are
                  super helpful too!”
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50 p-5 shadow dark:border-green-700 dark:bg-gray-800">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">🌟</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">Priya G.</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  “I love the community and how quickly I get answers. The team really listens to
                  feedback!”
                </p>
              </div>
            </div>
          </div>

          {/* New: Get Started CTA */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300">
              Ready to explore Dionysus?
            </h3>
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-800 dark:bg-blue-400 dark:text-gray-900 dark:hover:bg-blue-300"
            >
              Create Your Free Account
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              No credit card required
            </span>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Dionysus. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}
