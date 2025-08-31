'use client';

import * as React from 'react';
import { markOnboardingComplete } from './completeOnboardingAction';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useIsClient } from '@/hooks/use-is-client';

const ONBOARDING_FINISHED_KEY = 'onboarding-finished';

const TOUR_STEPS: Array<{
  key: keyof typeof FEATURE_ICONS;
  title: string;
  desc: string;
}> = [
  {
    key: 'sidebar',
    title: 'Sidebar Navigation',
    desc: `The sidebar is your main navigation hub. Here you can quickly access every major feature of Github SaaS:
- Dashboard: Your project and analytics overview
- Projects: Manage all your repositories and tasks
- Meetings: Schedule and review meetings with AI transcripts
- AI Chat: Get instant code help and documentation
- Billing: Manage your subscription, invoices, and discounts
- Settings: Personalize your experience and manage your team
- Docs & Help: Access guides, FAQs, and support
The sidebar is always visible, so you’re never more than a click away from what you need.`,
  },
  {
    key: 'dashboard',
    title: 'Dashboard',
    desc: `The Dashboard gives you a bird’s-eye view of your entire workspace:
- See recent project activity, code analytics, and team performance
- Get AI-powered suggestions for improving code quality and productivity
- Quick links to your most active projects and upcoming meetings
- Visualize your progress with charts and metrics
Use the dashboard to stay on top of your work and spot issues early.`,
  },
  {
    key: 'projects',
    title: 'Projects',
    desc: `The Projects section is where you manage all your repositories and tasks:
- Import GitHub repositories and organize them by team or client
- Assign tasks, set deadlines, and track progress
- Collaborate with teammates using comments and file sharing
- Use AI analytics to measure code complexity, maintainability, and test coverage
- Generate project documentation automatically
Projects are the heart of your workflow—keep them organized for maximum productivity.`,
  },
  {
    key: 'meetings',
    title: 'Meetings',
    desc: `Meetings are fully integrated with AI-powered features:
- Schedule and join video calls directly from the app
- Get real-time meeting transcripts and AI-generated summaries
- Automatically extract action items and decisions
- Review past meetings, search transcripts, and share notes with your team
Never lose track of what was discussed—let AI handle the details so you can focus on outcomes.`,
  },
  {
    key: 'ai-chat',
    title: 'AI Chat',
    desc: `The AI Chat is your personal coding assistant:
- Ask questions about your codebase and get instant, context-aware answers
- Generate or improve documentation for any file or function
- Get help with debugging, refactoring, or understanding complex code
- Use AI to automate repetitive tasks and boost your productivity
- Supports natural language queries and code snippets
Think of it as your always-available pair programmer and documentation writer.`,
  },
  {
    key: 'billing',
    title: 'Billing & Discounts',
    desc: `Manage your subscription and take advantage of exclusive offers:
- View and download invoices for your records
- Change your plan, add seats, or apply discount codes
- See upcoming charges and manage payment methods securely
- Get notified about seasonal discounts and special offers for teams
- All billing is handled securely with Stripe integration
Keep your membership up to date and never miss a discount!`,
  },
  {
    key: 'settings',
    title: 'Settings & Team Management',
    desc: `Personalize your experience and manage your organization:
- Update your profile, email, and notification preferences
- Invite teammates, assign roles (admin, member, guest), and manage permissions
- Set up SSO or 2FA for enhanced security
- Configure integrations with GitHub, Slack, and more
- Manage your organization’s branding and workspace settings
Settings help you tailor Github SaaS to your workflow and keep your team secure.`,
  },
  {
    key: 'docs',
    title: 'Documentation',
    desc: `Access comprehensive guides and API docs:
- Learn how to use every feature with step-by-step tutorials
- Find best practices for project management, AI chat, and billing
- Explore API documentation for custom integrations
- Stay up to date with release notes and new features
- Use the search to quickly find answers to your questions
Documentation is your go-to resource for mastering Github SaaS.`,
  },
  {
    key: 'help',
    title: 'Help Center & Support',
    desc: `Get help whenever you need it:
- Browse FAQs and troubleshooting guides
- Contact live support for urgent issues
- Join the community forum to share tips and get advice
- Report bugs or request new features
- Access onboarding resources and video walkthroughs
We’re here to help you succeed—reach out anytime!`,
  },
];

const FEATURE_ICONS = {
  sidebar: '🧭',
  dashboard: '📊',
  projects: '📁',
  meetings: '📝',
  'ai-chat': '🤖',
  billing: '💳',
  settings: '⚙️',
  docs: '📚',
  help: '🆘',
};

declare global {
  interface Window {
    Clerk?: any;
  }
}

function OnboardingPage() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const [step, setStep] = React.useState(0);
  const [showMeetDev, setShowMeetDev] = React.useState(false);
  const [showSkip, setShowSkip] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState<null | 'finish' | 'skip'>(null);
  const [redirecting, setRedirecting] = React.useState(false);

  const current = TOUR_STEPS[step];

  if (!isClient) {
    return null;
  }

  // On mount, check if onboarding was finished/skipped but not confirmed
  React.useEffect(() => {
    if (isClient && localStorage.getItem(ONBOARDING_FINISHED_KEY) === 'true') {
      setShowMeetDev(true);
    }
  }, [isClient]);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Show skip after 20 seconds on the first step
    let timer: NodeJS.Timeout | undefined;
    if (step === 0 && !showSkip) {
      timer = setTimeout(() => setShowSkip(true), 20000);
    } else if (step !== 0 && showSkip) {
      setShowSkip(false);
    }
    return () => {
      document.body.style.overflow = '';
      if (timer) clearTimeout(timer);
    };
  }, [step, showSkip]);

  // Mark onboarding as complete in Clerk (calls server action)
  const handleComplete = React.useCallback(async () => {
    try {
      await markOnboardingComplete();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ONBOARDING_FINISHED_KEY);
        setRedirecting(true);
        const pollForOnboarding = async (maxTries = 15, interval = 800) => {
          for (let i = 0; i < maxTries; i++) {
            // @ts-ignore
            if (window.Clerk && window.Clerk.user) {
              // @ts-ignore
              await window.Clerk.user.reload();
            }
            // Use useUser hook to get latest user
            const user = window.Clerk?.user || null;
            if (user && user.publicMetadata && user.publicMetadata.onboardingComplete) {
              window.location.href = '/survey-check';
              return;
            }
            await new Promise((res) => setTimeout(res, interval));
          }
          // Fallback: force reload to get new session
          window.location.reload();
        };
        pollForOnboarding();
      }
    } catch {}
  }, []);

  if (showMeetDev) {
    return (
      <div className="flex min-h-screen w-full justify-center bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
        <button
          aria-label="Toggle theme"
          className="absolute right-4 top-4 rounded-full border border-gray-300 bg-white p-2 text-gray-800 shadow transition-transform hover:scale-105 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="animate-slide-up my-8 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h1 className="mb-4 text-3xl font-bold text-blue-700 dark:text-blue-300">
            You&apos;re all set!
          </h1>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            You now know where to find every feature. Explore, build, and collaborate with
            confidence!
          </p>
          <div className="relative mx-auto mb-4 w-fit">
            <Image
              src="https://avatars.githubusercontent.com/u/175415316?v=4"
              alt="Dionysus Logo"
              width={128}
              height={128}
              className="rounded-full"
            />
            <span
              className="absolute -top-2 right-[12px] text-2xl"
              title="Made in India"
              aria-label="India Flag"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
            >
              <Image src={'/Flag-India.webp'} alt="India Flag" width={28} height={28} />
            </span>
          </div>
          <div className="mb-6 text-left text-base text-gray-700 dark:text-gray-200">
            <h2 className="mb-2 text-center text-xl font-semibold text-blue-700 dark:text-blue-300">
              Meet the Developer
            </h2>
            <p className="mb-2">
              This platform was crafted with passion and care by <b>Saksham Goel</b>, a developer
              dedicated to building tools that empower teams and creators. If you have feedback,
              ideas, or just want to say hi, feel free to reach out via the Help Center or connect
              on GitHub!
            </p>
            <p className="text-sm italic text-gray-500 dark:text-gray-400">
              Thank you for choosing Dionysus. Wishing you productive coding and seamless
              collaboration!
            </p>
          </div>
          <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => {
                setShowMeetDev(false);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(ONBOARDING_FINISHED_KEY);
                }
              }}
              className="rounded bg-yellow-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-yellow-600"
            >
              ← Back to Onboarding
            </button>
            <button
              onClick={() => setShowConfirm('finish')}
              disabled={redirecting}
              className={`rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 transition-colors${redirecting ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {redirecting ? 'Redirecting...' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
        {showConfirm === 'finish' && (
          <ConfirmModal
            message="Are you sure you want to finish onboarding and go to the dashboard?"
            onConfirm={async () => {
              if (redirecting) return;
              setRedirecting(true);
              await handleComplete();
              setShowConfirm(null);
            }}
            onCancel={() => setShowConfirm(null)}
          />
        )}
      </div>
    );
  }

  // Guard: If current is undefined, show nothing (shouldn't happen)
  if (!current) return null;

  return (
    <div className="relative z-50 flex min-h-screen w-full items-center justify-center bg-gray-900/80 transition-colors duration-300 dark:bg-black/90">
      <button
        aria-label="Toggle theme"
        className="absolute right-4 top-4 z-50 rounded-full border border-gray-300 bg-white p-2 text-gray-800 shadow transition-transform hover:scale-105 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      {/* Animated spotlight for the current feature */}
      <div className="animate-fade-in fixed inset-0 z-10 bg-black/70 backdrop-blur-sm" />
      <div className="animate-slide-up relative z-20 mx-auto flex max-h-[90vh] w-full max-w-lg flex-col items-center overflow-y-auto rounded-xl border border-gray-200 bg-white p-0 shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:p-8">
        <div className="animate-fade-in flex w-full flex-col items-center p-6 sm:p-0">
          <span className="mb-2 animate-bounce text-6xl drop-shadow-lg">
            {FEATURE_ICONS[current.key]}
          </span>
          <h2 className="animate-fade-in-slow mb-2 flex w-full items-center justify-center gap-2 text-center text-2xl font-bold text-blue-700 dark:text-blue-300">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400 dark:bg-blue-600"></span>
            {current.title}
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400 dark:bg-blue-600"></span>
          </h2>
          <div className="animate-fade-in-slow prose dark:prose-invert w-full max-w-none text-left text-lg text-gray-700 dark:text-gray-200">
            {current.desc.split('\n').map((line, i) =>
              line.trim().startsWith('-') ? (
                <li key={i} className="ml-6 list-disc text-base leading-relaxed">
                  {line.replace(/^\-\s*/, '')}
                </li>
              ) : (
                <p key={i} className="mb-2 leading-relaxed">
                  {line}
                </p>
              ),
            )}
          </div>
        </div>
        <div className="mb-4 mt-6 flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="animate-fade-in rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors dark:bg-gray-700 dark:text-gray-200"
            >
              Previous
            </button>
          )}
          {step < TOUR_STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="animate-fade-in rounded bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm('finish')}
              className="animate-fade-in rounded bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700"
            >
              Finish
            </button>
          )}
          {showSkip && step === 0 && (
            <button
              onClick={() => setShowConfirm('skip')}
              className="animate-fade-in ml-2 rounded bg-yellow-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-yellow-600"
              title="You will never see this onboarding again."
            >
              Skip
            </button>
          )}
        </div>
        <div className="animate-fade-in mb-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
          Step {step + 1} of {TOUR_STEPS.length}
        </div>
        <div className="mb-4 flex w-full justify-center">
          {[...Array(TOUR_STEPS.length)].map((_, idx) => (
            <span
              key={idx}
              className={`mx-1 inline-block h-2 w-2 rounded-full ${idx === step ? 'scale-125 bg-blue-500 dark:bg-blue-300' : 'bg-gray-300 dark:bg-gray-600'} transition-transform`}
            />
          ))}
        </div>
        {showSkip && step === 0 && (
          <div className="animate-fade-in mb-4 text-center text-xs text-yellow-700 dark:text-yellow-300">
            <b>Warning:</b> If you skip, you will never see this onboarding again!
          </div>
        )}
      </div>
      {showConfirm && (
        <ConfirmModal
          message={
            showConfirm === 'finish'
              ? 'Are you sure you want to finish onboarding and see the final page?'
              : 'Are you sure you want to skip onboarding? You will never see this again.'
          }
          onConfirm={async () => {
            setShowConfirm(null);
            setShowMeetDev(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem(ONBOARDING_FINISHED_KEY, 'true');
            }
          }}
          onCancel={() => setShowConfirm(null)}
        />
      )}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fade-in-slow {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s;
        }
        .animate-fade-in-slow {
          animation: fade-in-slow 1s;
        }
        .animate-slide-up {
          animation: slide-up 0.6s cubic-bezier(0.4, 2, 0.6, 1);
        }
        .animate-bounce {
          animation: bounce 1.2s infinite;
        }
      `}</style>
    </div>
  );
}

export default OnboardingPage;
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="animate-slide-up w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <p className="mb-6 text-center text-lg text-gray-900 dark:text-gray-100">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={async () => {
              await onCancel();
            }}
            className="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors dark:bg-gray-700 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await onConfirm();
            }}
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
