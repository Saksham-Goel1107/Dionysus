'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

export default function SupportPage() {
  const { user, isSignedIn } = useUser();
  const [form, setForm] = useState({
    name: '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setForm((prev) => ({
        ...prev,
        name: user?.firstName ?? '',
        email: user.primaryEmailAddress?.emailAddress ?? '',
      }));
    }
  }, [user?.primaryEmailAddress?.emailAddress, user?.firstName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;
    // Prevent submission if message is only spaces or empty after trimming
    if (form.message.trim().length < 30) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="relative w-full max-w-3xl rounded-2xl border border-blue-200 bg-white p-8 shadow-2xl dark:border-blue-800 dark:bg-gray-900">
        <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
          Support & Help Center
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-gray-700 dark:text-gray-300">
          Welcome to the Dionysus Support Center. We&apos;re here to help with any questions,
          issues, or feedback about your account, billing, privacy, technical problems, or anything
          else. Browse our resources, reach out, or join the community!
        </p>
        {/* Contact Options */}
        <div className="mb-10 flex flex-col gap-8 md:flex-row">
          <div className="flex-1">
            <h2 className="mb-2 text-xl font-bold text-blue-700 dark:text-blue-300">
              Contact Us Directly
            </h2>
            <ul className="mb-4 space-y-1 text-base text-gray-700 dark:text-gray-300">
              <li>
                Email:{' '}
                <a
                  href="mailto:sakshamgoel1107@gmail.com"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  sakshamgoel1107@gmail.com
                </a>
              </li>
              <li>
                GitHub:{' '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/Saksham-Goel1107"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  Saksham-Goel1107
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <h3 className="mb-1 font-semibold">Or send us a message:</h3>
              {submitted ? (
                <div className="font-semibold text-green-600 dark:text-green-400">
                  Thank you! We&apos;ll get back to you soon.
                </div>
              ) : (
                <form
                  action={`https://send.pageclip.co/${process.env.PAGECLIP_KEY_2}`}
                  className="pageclip-form flex flex-col gap-3"
                  method="POST"
                  onSubmit={handleSubmit}
                >
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    className="rounded border bg-white p-2 dark:bg-gray-900"
                    value={form.name}
                    onChange={handleChange}
                    required
                    readOnly={!!user?.firstName}
                    disabled={!isSignedIn}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    className="rounded border bg-white p-2 dark:bg-gray-900"
                    value={form.email}
                    onChange={handleChange}
                    required
                    readOnly={!!user?.primaryEmailAddress?.emailAddress}
                    disabled={!isSignedIn}
                  />
                  <textarea
                    name="message"
                    placeholder="How can we help you?"
                    className="min-h-[80px] rounded border bg-white p-2 dark:bg-gray-900"
                    value={form.message}
                    minLength={30}
                    maxLength={150}
                    onChange={handleChange}
                    required
                    disabled={!isSignedIn}
                  />
                  <div className="mb-[-4px] mt-[-4px] flex items-center justify-between text-xs">
                    <span
                      className={
                        form.message.trim().length < 30
                          ? 'text-red-500'
                          : 'text-green-600 dark:text-green-400'
                      }
                    >
                      Minimum of 30 characters
                    </span>
                    <span
                      className={form.message.trim().length < 30 ? 'text-red-500' : 'text-gray-500'}
                    >
                      {form.message.trim().length}/30
                    </span>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !isSignedIn}
                    className="w-full max-w-xs"
                  >
                    {isSignedIn
                      ? loading
                        ? 'Sending...'
                        : 'Send Message'
                      : 'Sign in to contact support'}
                  </Button>
                  {!isSignedIn && (
                    <div className="mt-2 text-center text-sm text-red-600 dark:text-red-400">
                      You must be signed in to contact support.
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-100 to-purple-100 p-5 shadow-lg dark:border-blue-800 dark:from-gray-800 dark:to-gray-900">
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
                  <a href="/my-data" className="underline">
                    My Data & Privacy
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
            <div className="flex flex-col gap-2 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-blue-100 p-5 shadow dark:border-green-700 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center gap-2 text-base font-semibold text-green-700 dark:text-green-300">
                <span>💡</span>General Tips
              </div>
              <ul className="ml-2 list-inside list-disc text-xs text-gray-700 dark:text-gray-300">
                <li>Check the FAQ and documentation for instant answers.</li>
                <li>For urgent issues, use email or Discord for fastest response.</li>
                <li>Never share your password or exported files with anyone.</li>
                <li>All support requests are confidential and handled promptly.</li>
                <li>We value your feedback to improve Dionysus for everyone!</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-yellow-100 p-5 shadow dark:border-red-700 dark:from-gray-800 dark:to-gray-900">
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
        </div>
        {/* FAQ */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-blue-700 dark:text-blue-300">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">How do I export my data?</summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Go to the My Data page, follow the export steps, and confirm your identity. Your
                data will be encrypted and downloadable as a zip file.
              </div>
            </details>
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">
                How do I decrypt my exported data?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Use the password (your email + first name, case-sensitive, no spaces) to decrypt
                your exported file on the My Data page.
              </div>
            </details>
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">
                I forgot my password. Can you recover my data?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                For privacy, we cannot recover your password. Please use your email and first name
                as they were at the time of export.
              </div>
            </details>
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">How is my data protected?</summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                All exports are encrypted with a password only you know. We never store your
                password or decrypted data.
              </div>
            </details>
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">How do I contact support?</summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Use the form above, email us at{' '}
                <a
                  href="mailto:sakshamgoel1107@gmail.com"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  sakshamgoel1107@gmail.com
                </a>
                , or join our Discord.
              </div>
            </details>
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">
                Where can I find more documentation?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Check our{' '}
                <a href="/docs" className="text-blue-600 underline dark:text-blue-400">
                  Documentation
                </a>{' '}
                page for more guides and details.
              </div>
            </details>
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">
                How do I report a bug or request a feature?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Open an issue on{' '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/Saksham-Goel1107/dionysus/issues"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  GitHub
                </a>{' '}
                or use the contact form above.
              </div>
            </details>
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">
                What if I have a billing or payment issue?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Check the{' '}
                <a href="/pricing" className="text-blue-600 underline dark:text-blue-400">
                  Pricing
                </a>{' '}
                page or contact us directly for help with billing.
              </div>
            </details>
            <details className="rounded bg-blue-50 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer font-semibold">
                How do I delete my account?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Contact support with your request. We&apos;ll guide you through the secure deletion
                process.
              </div>
            </details>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Dionysus. All rights reserved.
        </div>
      </div>
    </div>
  );
}
