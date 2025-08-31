'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserButton, useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const surveySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+'], {
    required_error: 'Company size is required',
  }),
  industry: z.string().min(1, 'Industry is required'),
  role: z.string().min(1, 'Your role is required'),
  usagePurpose: z.string().min(1, 'Please describe your purpose'),
  hearAboutUs: z.string().min(1, 'This field is required'),
  expectedFeatures: z.array(z.string(), { invalid_type_error: 'Select at least one feature' }),
  developmentExperience: z.number().min(1).max(5),
  githubExperience: z.number().min(1).max(5),
  feedbackFrequency: z.enum(['Weekly', 'Monthly', 'Quarterly', 'Never'], {
    required_error: 'Please select a frequency',
  }),
  additionalFeedback: z.string().optional(),
});

type SurveyFormData = z.infer<typeof surveySchema>;

export default function SurveyPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [dontSubscribe, setDontSubscribe] = useState(false);
  const [showDontSubscribeDialog, setShowDontSubscribeDialog] = useState(false);
  const [canSkipSurvey, setCanSkipSurvey] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { theme, setTheme } = useTheme();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      companyName: '',
      companySize: undefined,
      industry: '',
      role: '',
      usagePurpose: '',
      hearAboutUs: '',
      expectedFeatures: [],
      developmentExperience: 3,
      githubExperience: 3,
      feedbackFrequency: undefined,
      additionalFeedback: '',
    },
    mode: 'onChange',
  });
  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const watchedExpectedFeatures = watch('expectedFeatures');

  const handleFeatureChange = (feature: string) => {
    const currentFeatures = [...(watchedExpectedFeatures || [])];

    if (currentFeatures.includes(feature)) {
      const updatedFeatures = currentFeatures.filter((f) => f !== feature);
      setValue(
        'expectedFeatures',
        updatedFeatures.length > 0 ? (updatedFeatures as [string, ...string[]]) : [],
        { shouldValidate: true },
      );
    } else {
      const newFeatures = [...currentFeatures, feature];
      setValue('expectedFeatures', newFeatures as [string, ...string[]], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: SurveyFormData) => {
    if (!user?.id) {
      setSubmitError('User authentication failed. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit survey');
      }
      try {
        fetch('/api/send-password-change-warning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'new account' }),
        });
      } catch (err) {
        console.error('Error Sending welcome email:', err);
      }
      // Newsletter logic
      if (!dontSubscribe && user?.emailAddresses?.[0]?.emailAddress) {
        try {
          await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.emailAddresses[0].emailAddress,
              name: user.firstName || '',
            }),
          });
        } catch (err) {
          console.error(err);
        }
      }
      router.push('/dashboard');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipSurvey = async () => {
    if (!user?.id) {
      setSubmitError('User authentication failed. Please try again.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Mark survey as done without submitting data
      const response = await fetch('/api/survey/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to skip survey');
      }

      router.push('/dashboard');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred while skipping survey',
      );
    } finally {
      setIsSubmitting(false);
      setShowSkipDialog(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace('/sign-in');
      return;
    }

    // Check if onboarding is complete via Clerk metadata
    const onboardingComplete = user.publicMetadata?.onboardingComplete;
    if (!onboardingComplete) {
      console.log('Onboarding not complete, redirecting to /onboarding');
      router.replace('/onboarding');
      return;
    }

    async function checkSurveyStatusAndFeatures() {
      try {
        // Check survey status
        const res = await fetch('/api/survey-status');
        if (res.ok) {
          const { done } = await res.json();
          if (done) {
            router.replace('/dashboard');
            return;
          }
        }

        const skipRes = await fetch('/api/survey/skip-enabled');
        if (skipRes.ok) {
          const { canSkip } = await skipRes.json();
          setCanSkipSurvey(canSkip);
        } else {
          setCanSkipSurvey(false);
        }
      } catch (error) {
        console.error('Error checking survey status or feature flags:', error);
      }
    }

    checkSurveyStatusAndFeatures();
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${theme === 'dark' ? 'dark' : ''}`}
      >
        <div className="animate-pulse text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'} px-4 py-12 sm:px-6 lg:px-8`}
    >
      <div className="mx-auto max-w-3xl">
        <div
          className={`overflow-hidden rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
        >
          <div
            className={`border-b px-4 py-5 sm:px-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}
          >
            <div>
              <div className="flex items-center gap-4">
                <UserButton />
                <h1
                  className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                >
                  Welcome to Dionysus!
                </h1>
              </div>
              <p className={`mt-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Please complete this quick survey to help us provide you with the best experience.
                This information helps us tailor our service to your needs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`ml-2 rounded-full border p-2 transition-colors duration-200 ${
                theme === 'dark'
                  ? 'border-slate-600 bg-slate-700 text-yellow-300 hover:bg-slate-600'
                  : 'border-slate-300 bg-slate-100 text-blue-600 hover:bg-slate-200'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <span className="text-lg" aria-hidden="true">
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
            </button>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className={`space-y-8 px-4 py-5 sm:p-6 ${theme === 'dark' ? 'bg-slate-800' : ''}`}
          >
            <div className="space-y-6">
              <h2
                className={`text-xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}
              >
                Organization Information
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="companyName"
                    className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                  >
                    Company/Organization Name*
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    {...register('companyName')}
                    className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="companySize"
                    className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                  >
                    Company Size*
                  </label>
                  <select
                    id="companySize"
                    {...register('companySize')}
                    className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                  {errors.companySize && (
                    <p className="mt-1 text-sm text-red-600">{errors.companySize.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="industry"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  Industry*
                </label>
                <select
                  id="industry"
                  {...register('industry')}
                  className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                >
                  <option value="">Select industry</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other</option>
                </select>
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  Your Role*
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                >
                  <option value="">Select role</option>
                  <option value="Developer">Developer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="CTO">CTO</option>
                  <option value="Designer">Designer</option>
                  <option value="QA">QA</option>
                  <option value="Other">Other</option>
                </select>
                {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
              </div>
            </div>

            <div className="space-y-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h2
                className={`pt-4 text-xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}
              >
                Usage & Discovery
              </h2>

              <div>
                <label
                  htmlFor="usagePurpose"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  What are you planning to use Github SaaS for?*
                </label>
                <textarea
                  id="usagePurpose"
                  {...register('usagePurpose')}
                  rows={3}
                  className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                  placeholder="Please describe your intended use case"
                />
                {errors.usagePurpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.usagePurpose.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="hearAboutUs"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  How did you hear about us?*
                </label>
                <select
                  id="hearAboutUs"
                  {...register('hearAboutUs')}
                  className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                >
                  <option value="">Select source</option>
                  <option value="Google">Google</option>
                  <option value="GitHub">GitHub</option>
                  <option value="Youtube">Youtube</option>
                  <option value="Ai(ChatGpt, Claude, etc)">Ai(ChatGpt, Claude, etc)</option>
                  <option value="Friend">Friend</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Blog">Blog</option>
                  <option value="Other">Other</option>
                </select>
                {errors.hearAboutUs && (
                  <p className="mt-1 text-sm text-red-600">{errors.hearAboutUs.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h2 className="pt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Features & Experience
              </h2>

              <div>
                <span
                  className={`mb-2 block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  Which features are you most interested in?*
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'AI-powered code analysis',
                    'Repository management',
                    'Team collaboration',
                    'Meeting transcription',
                    'Project documentation',
                    'Code quality metrics',
                    'Advanced use (Image convertor/optimizer) etc',
                    'API integrations',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center">
                      <input
                        id={`feature-${feature}`}
                        type="checkbox"
                        className={`h-4 w-4 rounded ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-blue-400 focus:ring-blue-400' : 'border-slate-300 bg-white text-blue-600 focus:ring-blue-500'} mt-1`}
                        onChange={() => handleFeatureChange(feature)}
                        checked={watchedExpectedFeatures?.includes(feature) || false}
                      />
                      <label
                        htmlFor={`feature-${feature}`}
                        className={`ml-2 block text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                      >
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.expectedFeatures && (
                  <p className="mt-1 text-sm text-red-600">{errors.expectedFeatures.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="developmentExperience"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  How would you rate your software development experience?*
                </label>
                <select
                  id="developmentExperience"
                  {...register('developmentExperience', { valueAsNumber: true })}
                  className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                >
                  <option value="">Select experience level</option>
                  <option value={1}>1 - Beginner</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5 - Expert</option>
                </select>
                {errors.developmentExperience && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.developmentExperience.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="githubExperience"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  How would you rate your GitHub experience?*
                </label>
                <select
                  id="githubExperience"
                  {...register('githubExperience', { valueAsNumber: true })}
                  className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                >
                  <option value="">Select experience level</option>
                  <option value={1}>1 - Beginner</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5 - Expert</option>
                </select>
                {errors.githubExperience && (
                  <p className="mt-1 text-sm text-red-600">{errors.githubExperience.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h2
                className={`pt-4 text-xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}
              >
                Feedback & Additional Information
              </h2>

              <div>
                <label
                  htmlFor="feedbackFrequency"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  How often would you like to provide feedback on our product?*
                </label>
                <select
                  id="feedbackFrequency"
                  {...register('feedbackFrequency')}
                  className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                >
                  <option value="">Select frequency</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Never">Never</option>
                </select>
                {errors.feedbackFrequency && (
                  <p className="mt-1 text-sm text-red-600">{errors.feedbackFrequency.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="additionalFeedback"
                  className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  Any additional feedback or questions? (Optional)
                </label>
                <textarea
                  id="additionalFeedback"
                  {...register('additionalFeedback')}
                  rows={3}
                  className={`mt-1 block w-full rounded-md border ${theme === 'dark' ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                  placeholder="Share any additional thoughts or questions you have"
                />
              </div>
            </div>

            {submitError && (
              <div className={`rounded-md p-4 ${theme === 'dark' ? 'bg-red-900/40' : 'bg-red-50'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3
                      className={`text-sm font-medium ${theme === 'dark' ? 'text-red-200' : 'text-red-800'}`}
                    >
                      Error submitting survey
                    </h3>
                    <div
                      className={`mt-2 text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}
                    >
                      <p>{submitError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <div className="flex items-center">
                  <input
                    id="dontSubscribe"
                    type="checkbox"
                    checked={dontSubscribe}
                    onChange={(e) => {
                      if (!dontSubscribe && e.target.checked) {
                        setShowDontSubscribeDialog(true);
                      } else {
                        setDontSubscribe(false);
                      }
                    }}
                    className={`h-4 w-4 rounded border-gray-300 focus:ring-blue-500 ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-300 bg-white'}`}
                  />
                  <label
                    htmlFor="dontSubscribe"
                    className={`ml-2 text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}
                  >
                    Don&apos;t subscribe to newsletter
                  </label>
                </div>
                <div className="flex justify-end gap-4">
                  {canSkipSurvey && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSkipDialog(true)}
                      disabled={isSubmitting}
                      className={
                        theme === 'dark'
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    >
                      Skip Survey
                    </Button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || !isDirty || !isValid}
                    className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      theme === 'dark'
                        ? 'border-blue-700 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-slate-900'
                        : 'border-blue-700 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-slate-50'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Dialog open={showDontSubscribeDialog} onOpenChange={setShowDontSubscribeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to unsubscribe from the newsletter?</DialogTitle>
            <DialogDescription>
              You will not receive any product updates, tips, or special offers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'dark' ? 'border-red-700 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-offset-slate-900' : 'border-red-700 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-offset-slate-50'}`}
              onClick={() => {
                setDontSubscribe(true);
                setShowDontSubscribeDialog(false);
              }}
            >
              Yes, don&apos;t subscribe
            </button>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Cancel
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Survey?</DialogTitle>
            <DialogDescription>
              Are you sure you want to skip the survey? This helps us understand your needs and
              improve our platform. You can not fill this out later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSkipDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSkipSurvey}
              disabled={isSubmitting}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isSubmitting ? 'Skipping...' : 'Skip Survey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
