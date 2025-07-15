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
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-4xl border border-blue-200 dark:border-blue-800 relative flex flex-col gap-10">
          <h1 className="text-4xl font-extrabold text-center mb-2 text-blue-700 dark:text-blue-300 tracking-tight">
            Support & Help Center
          </h1>
          <p className="text-center text-gray-700 dark:text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
            Welcome to the Dionysus Support Center. We&apos;re here to help with any questions,
            issues, or feedback about your account, billing, privacy, technical problems, or
            anything else. Browse our resources, reach out, or join the community!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-xl p-6 flex flex-col items-center shadow border border-blue-200 dark:border-blue-700 min-h-[220px]">
              <span className="text-3xl mb-2">📚</span>
              <h3 className="font-bold text-blue-700 dark:text-blue-200 mb-1 text-center">
                Documentation
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
                Find guides, API docs, and tutorials to help you get the most out of Dionysus.
              </p>
              <a href="/docs" className="text-blue-700 dark:text-blue-300 underline font-medium">
                Go to Docs
              </a>
            </div>
            <div className="bg-green-100 dark:bg-green-900 rounded-xl p-6 flex flex-col items-center shadow border border-green-200 dark:border-green-700">
              <span className="text-3xl mb-2">💬</span>
              <h3 className="font-bold text-green-700 dark:text-green-200 mb-1">Community & FAQ</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
                Join our GitHub Discussions, browse FAQs, and connect with other users for tips and
                support.
              </p>
              <a
                href="https://github.com/Saksham-Goel1107/Dionysus/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 dark:text-green-400 underline font-medium"
              >
                Join Github Discussions
              </a>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 rounded-xl p-6 flex flex-col items-center shadow border border-yellow-200 dark:border-yellow-700">
              <span className="text-3xl mb-2">📧</span>
              <h3 className="font-bold text-yellow-700 dark:text-yellow-200 mb-1">
                Contact Support
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
                Need help? Email us directly or open a GitHub issue for technical support.
              </p>
              <a
                href="mailto:sakshamgoel1107@gmail.com"
                className="text-yellow-700 dark:text-yellow-400 underline font-medium"
              >
                Email Support
              </a>
              <a
                href="https://github.com/Saksham-Goel1107/dionysus/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-700 dark:text-yellow-400 underline font-medium mt-1"
              >
                Open GitHub Issue
              </a>
            </div>
          </div>

          {/* New: Feature Highlight Section */}
          <div className="flex flex-col md:flex-row gap-8 mt-10">
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg flex flex-col gap-2">
              <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                Quick Links
              </h3>
              <ul className="text-base text-blue-700 dark:text-blue-300 space-y-1">
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
            <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-green-200 dark:border-green-700 shadow flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold text-base">
                <span>💡</span>General Tips
              </div>
              <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 ml-2">
                <li>Check the FAQ and documentation for instant answers.</li>
                <li>For urgent issues, use email or GitHub for fastest response.</li>
                <li>Never share your password or exported files with anyone.</li>
                <li>All support requests are confidential and handled promptly.</li>
                <li>We value your feedback to improve Dionysus for everyone!</li>
              </ul>
            </div>
            <div className="flex-1 bg-gradient-to-br from-red-50 to-yellow-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-red-200 dark:border-red-700 shadow flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold text-base">
                <span>⚠️</span>Security & Privacy
              </div>
              <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 ml-2">
                <li>
                  If you received a data export alert but did <b>not</b> export your data,{' '}
                  <a
                    href="mailto:sakshamgoel1107@gmail.com"
                    className="text-blue-600 dark:text-blue-400 underline"
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
            <h3 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-300 mb-6">
              What Our Users Say
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-gray-800 p-5 rounded-xl border border-blue-200 dark:border-blue-700 shadow flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🌟</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Aarav S.</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  “Dionysus support is fast, friendly, and always solves my issues. The docs are
                  super helpful too!”
                </p>
              </div>
              <div className="bg-green-50 dark:bg-gray-800 p-5 rounded-xl border border-green-200 dark:border-green-700 shadow flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🌟</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">Priya G.</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
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
              className="px-6 py-3 rounded-lg bg-blue-700 text-white dark:bg-blue-400 dark:text-gray-900 font-semibold shadow hover:bg-blue-800 dark:hover:bg-blue-300 transition"
            >
              Create Your Free Account
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              No credit card required
            </span>
          </div>

          <div className="text-xs text-gray-400 text-center mt-8">
            &copy; {new Date().getFullYear()} Dionysus. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}
