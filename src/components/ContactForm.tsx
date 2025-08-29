'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@clerk/nextjs';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';

export default function ContactForm() {
  const { user } = useUser();
  const today = new Date().toISOString().split('T')[0];
  const tenDaysLater = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 3000));
    formRef.current?.reset();
    setIsSubmitting(false);
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 5000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 animate-[fadeIn_0.8s_ease-out_forwards] text-center opacity-0 lg:mb-12">
          <h1 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
            Get In Touch
          </h1>
          <p className="mx-auto max-w-2xl px-4 text-lg text-gray-600 dark:text-gray-300 lg:text-xl">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as
            possible.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="animate-[slideInLeft_0.8s_ease-out_0.2s_forwards] space-y-8 opacity-0">
            <div className="rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Your Information
              </h3>
              <div className="space-y-3">
                <div className="flex transform items-center gap-3 rounded-lg bg-blue-50 p-3 transition-transform hover:scale-105 dark:bg-blue-900/20">
                  <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-blue-500"></div>
                  <span className="truncate text-sm text-gray-700 dark:text-gray-300 sm:text-base">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <div className="flex transform items-center gap-3 rounded-lg bg-purple-50 p-3 transition-transform hover:scale-105 dark:bg-purple-900/20">
                  <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-purple-500"></div>
                  <span className="break-all text-sm text-gray-700 dark:text-gray-300 sm:text-base">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="animate-[slideInRight_0.8s_ease-out_0.4s_forwards] opacity-0">
            <form
              action={`https://send.pageclip.co/${process.env.NEXT_PUBLIC_PAGECLIP_KEY_3}`}
              method="POST"
              ref={formRef}
              onSubmit={handleSubmit}
              className="pageclip-form hover:shadow-3xl space-y-6 rounded-2xl border border-gray-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-sm transition-all duration-300 dark:border-gray-700/50 dark:bg-gray-800/90 sm:p-8"
            >
              <input type="hidden" name="clerk_user_id" value={user?.id || ''} />
              <input
                type="hidden"
                name="clerk_email"
                value={user?.emailAddresses[0]?.emailAddress || ''}
              />
              <input
                type="hidden"
                name="clerk_name"
                value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
              />
              <input
                type="hidden"
                name="clerk_created_at"
                value={user?.createdAt?.toISOString() || ''}
              />
              <div className="group">
                <label className="mb-3 block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600 dark:text-gray-300">
                  Subject
                </label>
                <Input
                  name="subject"
                  placeholder="What's this about?"
                  required
                  className="h-10 w-full rounded-xl border-2 text-sm transition-all duration-300 hover:shadow-md focus:border-blue-500 sm:h-12 sm:text-base"
                  minLength={10}
                  maxLength={100}
                />
              </div>

              <div className="group">
                <label className="mb-3 block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600 dark:text-gray-300">
                  Message
                </label>
                <Textarea
                  name="message"
                  placeholder="Tell us more about your inquiry..."
                  rows={4}
                  required
                  className="sm:rows-6 w-full resize-none rounded-xl border-2 text-sm transition-all duration-300 hover:shadow-md focus:border-blue-500 sm:text-base"
                  minLength={50}
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="group">
                  <label className="mb-3 block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600 dark:text-gray-300">
                    Preferred Date
                  </label>
                  <Input
                    name="date"
                    type="date"
                    required
                    min={today}
                    max={tenDaysLater}
                    defaultValue={today}
                    className="h-10 w-full rounded-xl border-2 text-sm transition-all duration-300 hover:shadow-md focus:border-blue-500 sm:h-12 sm:text-base"
                  />
                </div>

                <div className="group">
                  <label className="mb-3 block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600 dark:text-gray-300">
                    Preferred Time
                  </label>
                  <Input
                    name="time"
                    type="time"
                    required
                    className="h-10 w-full rounded-xl border-2 text-sm transition-all duration-300 hover:shadow-md focus:border-blue-500 sm:h-12 sm:text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="group h-12 w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:h-14 sm:text-lg"
              >
                <span className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg
                        className="h-5 w-5 transform transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </>
                  )}
                </span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Beautiful Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md animate-[bounceIn_0.6s_ease-out] rounded-3xl border border-gray-200/50 bg-white/95 p-8 shadow-2xl backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-800/95">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg">
                <CheckCircle className="h-10 w-10 animate-[checkBounce_0.8s_ease-out] text-white" />
              </div>

              <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                Message Sent! 🎉
              </h3>

              <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-300">
                Thank you for reaching out,{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {user?.firstName}
                </span>
                ! We&apos;ve received your message and will get back to you According to Your
                prefrences.
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Sparkles className="h-4 w-4 animate-pulse text-yellow-500" />
                <span>We appreciate your patience</span>
                <Sparkles className="h-4 w-4 animate-pulse text-yellow-500" />
              </div>

              <Button
                onClick={() => setShowConfirmation(false)}
                className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
          from {
            opacity: 0;
            transform: translateY(20px);
          }
        }
        @keyframes slideInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
        }
        @keyframes slideInRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
          from {
            opacity: 0;
            transform: translateX(50px);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-100px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes checkBounce {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
