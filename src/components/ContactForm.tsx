'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ContactForm() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const today = new Date().toISOString().split('T')[0];
  const tenDaysLater = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Check if user has verified phone number
  const hasVerifiedPhone =
    user?.phoneNumbers?.some((phone) => phone.verification?.status === 'verified') || false;
  const hasPhoneNumber = user?.phoneNumbers && user.phoneNumbers.length > 0;

  useEffect(() => {
    // Simulate loading state for better UX
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-12 w-96 animate-pulse rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
            <div className="mx-auto h-6 w-80 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="h-96 animate-pulse rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
            <div className="h-96 animate-pulse rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Enhanced Header */}
        <div className="mb-12 animate-[fadeIn_1s_ease-out_forwards] text-center opacity-0">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/80 px-6 py-3 shadow-lg backdrop-blur-sm dark:bg-gray-800/80">
            <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Support
            </span>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl lg:text-6xl">
            Get In Touch
          </h1>
          <p className="mx-auto max-w-3xl px-4 text-xl leading-relaxed text-gray-600 dark:text-gray-300">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as
            possible with personalized assistance.
          </p>
        </div>
        {!hasVerifiedPhone && (
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-4 rounded-2xl bg-white/60 p-4 shadow-lg backdrop-blur-sm dark:bg-gray-800/60">
              <div
                className={`flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 transition-all duration-300 dark:bg-amber-900/50 dark:text-amber-200`}
              >
                <Phone className="h-4 w-4" />
                Phone Verification
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div
                className={`flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 transition-all duration-300 dark:bg-gray-700 dark:text-gray-400`}
              >
                <MessageSquare className="h-4 w-4" />
                Send Message
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-16">
          {/* Enhanced Phone Verification Section */}
          {!hasVerifiedPhone && (
            <div className="animate-[slideInLeft_1s_ease-out_0.3s_forwards] opacity-0 lg:col-span-2">
              <div className="relative overflow-hidden rounded-3xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8 shadow-2xl dark:border-amber-800/60 dark:from-amber-900/30 dark:to-orange-900/30">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-amber-400 blur-3xl"></div>
                  <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-orange-400 blur-2xl"></div>
                </div>

                <div className="relative flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                      <AlertTriangle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-3 text-2xl font-bold text-amber-900 dark:text-amber-100">
                      Phone Verification Required
                    </h3>
                    <p className="mb-6 text-base leading-relaxed text-amber-800 dark:text-amber-200">
                      {!hasPhoneNumber
                        ? 'To ensure secure communication and provide you with the best support, please add a phone number to your profile. This helps us verify your identity and respond more effectively.'
                        : 'Your phone number needs to be verified before you can send messages. Please complete the verification process in your profile to continue.'}
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <Button
                        onClick={() => openUserProfile()}
                        className="group flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-amber-600 hover:to-orange-600 hover:shadow-2xl"
                      >
                        <Phone className="h-5 w-5 transition-transform group-hover:rotate-12" />
                        {!hasPhoneNumber ? 'Add Phone Number' : 'Verify Phone Number'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <Shield className="h-4 w-4" />
                        <span>Secure & Required for Support</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Contact Form */}
          {hasVerifiedPhone && (
            <div className="animate-[slideInRight_1s_ease-out_0.6s_forwards] opacity-0 lg:col-span-2">
              <form
                action={`https://send.pageclip.co/${process.env.NEXT_PUBLIC_PAGECLIP_KEY_3}`}
                method="POST"
                ref={formRef}
                onSubmit={handleSubmit}
                className="pageclip-form hover:shadow-3xl group relative overflow-hidden rounded-3xl border border-gray-200/60 bg-white/95 p-8 shadow-2xl backdrop-blur-sm transition-all duration-500 dark:border-gray-700/60 dark:bg-gray-800/95 sm:p-10"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-400 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-purple-400 blur-2xl"></div>
                </div>

                <div className="relative">
                  <input type="hidden" name="clerk_user_id" value={user?.id || ''} />
                  <input
                    type="hidden"
                    name="clerk_email"
                    value={user?.emailAddresses[0]?.emailAddress || ''}
                  />
                  <input
                    type="hidden"
                    name="clerk_phonenumber"
                    value={user?.phoneNumbers[0]?.phoneNumber || ''}
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

                  {/* Form Header */}
                  <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                      Send Your Message
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Fill out the form below and we&apos;ll get back to you soon
                    </p>
                  </div>

                  <div className="space-y-8">
                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600 dark:text-gray-300">
                        <MessageSquare className="h-4 w-4" />
                        Subject
                      </label>
                      <Input
                        name="subject"
                        placeholder="What's this about?"
                        required
                        className="h-12 w-full rounded-2xl border-2 bg-gray-50/50 text-base transition-all duration-300 hover:bg-white hover:shadow-lg focus:border-blue-500 focus:bg-white focus:shadow-xl focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                        minLength={10}
                        maxLength={100}
                      />
                    </div>

                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600 dark:text-gray-300">
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </label>
                      <Textarea
                        name="message"
                        placeholder="Tell us more about your inquiry..."
                        rows={5}
                        required
                        className="w-full resize-none rounded-2xl border-2 bg-gray-50/50 text-base transition-all duration-300 hover:bg-white hover:shadow-lg focus:border-blue-500 focus:bg-white focus:shadow-xl focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                        minLength={50}
                        maxLength={1000}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="group">
                        <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4" />
                          Preferred Date
                        </label>
                        <Input
                          name="date"
                          type="date"
                          required
                          min={today}
                          max={tenDaysLater}
                          defaultValue={today}
                          className="h-12 w-full rounded-2xl border-2 bg-gray-50/50 text-base transition-all duration-300 hover:bg-white hover:shadow-lg focus:border-blue-500 focus:bg-white focus:shadow-xl focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                        />
                      </div>

                      <div className="group">
                        <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600 dark:text-gray-300">
                          <Clock className="h-4 w-4" />
                          Preferred Time
                        </label>
                        <Input
                          name="time"
                          type="time"
                          required
                          className="h-12 w-full rounded-2xl border-2 bg-gray-50/50 text-base transition-all duration-300 hover:bg-white hover:shadow-lg focus:border-blue-500 focus:bg-white focus:shadow-xl focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="group h-14 w-full transform rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-lg font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <span className="flex items-center gap-3">
                        {isSubmitting ? (
                          <>
                            <div className="border-3 h-6 w-6 animate-spin rounded-full border-white border-t-transparent"></div>
                            Sending Your Message...
                          </>
                        ) : (
                          <>
                            Send Message
                            <ArrowRight className="h-5 w-5 transform transition-transform group-hover:translate-x-2" />
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="mx-4 max-w-lg animate-[bounceIn_0.8s_ease-out] rounded-3xl border border-gray-200/60 bg-white/95 p-10 shadow-2xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-800/95">
            <div className="text-center">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 shadow-2xl">
                <CheckCircle className="h-12 w-12 animate-[checkBounce_1s_ease-out] text-white" />
              </div>

              <h3 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                Message Sent Successfully! 🎉
              </h3>

              <p className="mb-8 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                Thank you for reaching out,{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {user?.firstName}
                </span>
                ! We&apos;ve received your message and will get back to you according to your
                preferences within 24 hours.
              </p>

              <div className="mb-8 flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <Sparkles className="h-5 w-5 animate-pulse text-yellow-500" />
                <span className="font-medium">We truly appreciate your patience and feedback</span>
                <Sparkles className="h-5 w-5 animate-pulse text-yellow-500" />
              </div>

              <Button
                onClick={() => setShowConfirmation(false)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-lg font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl"
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
            transform: translateY(30px);
          }
        }
        @keyframes slideInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
        }
        @keyframes slideInRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
          from {
            opacity: 0;
            transform: translateX(60px);
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
            transform: scale(0.98);
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
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
