'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Replace with your support API endpoint
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-3xl border border-blue-200 dark:border-blue-800 relative">
        <h1 className="text-4xl font-extrabold text-center mb-2 text-blue-700 dark:text-blue-300 tracking-tight">
          Support & Help Center
        </h1>
        <p className="text-center text-gray-700 dark:text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
          Welcome to the Dionysus Support Center. We&apos;re here to help with any questions,
          issues, or feedback about your account, billing, privacy, technical problems, or anything
          else. Browse our resources, reach out, or join the community!
        </p>
        {/* Contact Options */}
        <div className="mb-10 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">
              Contact Us Directly
            </h2>
            <ul className="text-base text-gray-700 dark:text-gray-300 mb-4 space-y-1">
              <li>
                Email:{' '}
                <a
                  href="mailto:sakshamgoel1107@gmail.com"
                  className="text-blue-600 dark:text-blue-400 underline"
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
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  Saksham-Goel1107
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Or send us a message:</h3>
              {submitted ? (
                <div className="text-green-600 dark:text-green-400 font-semibold">
                  Thank you! We&apos;ll get back to you soon.
                </div>
              ) : (
                <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    className="border p-2 rounded bg-white dark:bg-gray-900"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    className="border p-2 rounded bg-white dark:bg-gray-900"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <textarea
                    name="message"
                    placeholder="How can we help you?"
                    className="border p-2 rounded bg-white dark:bg-gray-900 min-h-[80px]"
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                  <Button type="submit" disabled={loading} className="w-full max-w-xs">
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 p-5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg">
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
            <div className="bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 p-5 rounded-xl border border-green-200 dark:border-green-700 shadow flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold text-base">
                <span>💡</span>General Tips
              </div>
              <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 ml-2">
                <li>Check the FAQ and documentation for instant answers.</li>
                <li>For urgent issues, use email or Discord for fastest response.</li>
                <li>Never share your password or exported files with anyone.</li>
                <li>All support requests are confidential and handled promptly.</li>
                <li>We value your feedback to improve Dionysus for everyone!</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-yellow-100 dark:from-gray-800 dark:to-gray-900 p-5 rounded-xl border border-red-200 dark:border-red-700 shadow flex flex-col gap-2">
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
        </div>
        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">How do I export my data?</summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Go to the My Data page, follow the export steps, and confirm your identity. Your
                data will be encrypted and downloadable as a zip file.
              </div>
            </details>
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">
                How do I decrypt my exported data?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Use the password (your email + first name, case-sensitive, no spaces) to decrypt
                your exported file on the My Data page.
              </div>
            </details>
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">
                I forgot my password. Can you recover my data?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                For privacy, we cannot recover your password. Please use your email and first name
                as they were at the time of export.
              </div>
            </details>
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">How is my data protected?</summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                All exports are encrypted with a password only you know. We never store your
                password or decrypted data.
              </div>
            </details>
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">How do I contact support?</summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Use the form above, email us at{' '}
                <a
                  href="mailto:sakshamgoel1107@gmail.com"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  sakshamgoel1107@gmail.com
                </a>
                , or join our Discord.
              </div>
            </details>
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">
                Where can I find more documentation?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Check our{' '}
                <a href="/docs" className="text-blue-600 dark:text-blue-400 underline">
                  Documentation
                </a>{' '}
                page for more guides and details.
              </div>
            </details>
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">
                How do I report a bug or request a feature?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Open an issue on{' '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/Saksham-Goel1107/dionysus/issues"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  GitHub
                </a>{' '}
                or use the contact form above.
              </div>
            </details>
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">
                What if I have a billing or payment issue?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Check the{' '}
                <a href="/pricing" className="text-blue-600 dark:text-blue-400 underline">
                  Pricing
                </a>{' '}
                page or contact us directly for help with billing.
              </div>
            </details>
            <details className="bg-blue-50 dark:bg-gray-800 rounded p-3">
              <summary className="font-semibold cursor-pointer">
                How do I delete my account?
              </summary>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Contact support with your request. We&apos;ll guide you through the secure deletion
                process.
              </div>
            </details>
          </div>
        </div>
        <div className="text-xs text-gray-400 text-center mt-8">
          &copy; {new Date().getFullYear()} Dionysus. All rights reserved.
        </div>
      </div>
    </div>
  );
}
