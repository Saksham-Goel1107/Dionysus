'use client';

import * as React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { markOnboardingComplete } from './completeOnboardingAction';
import Image from 'next/image';

const THEME_KEY = 'theme-preference';
const ONBOARDING_FINISHED_KEY = 'onboarding-finished';

function useTheme() {
  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(THEME_KEY) || 'light';
    }
    return 'light';
  });

  React.useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return [theme, toggleTheme] as const;
}

// Fix: type for TOUR_STEPS and FEATURE_ICONS
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

export default function OnboardingComponent() {
  const { user } = useUser();
  const router = useRouter();
  const [theme, toggleTheme] = useTheme();
  const [step, setStep] = React.useState(0);
  const [showMeetDev, setShowMeetDev] = React.useState(false);
  const [showSkip, setShowSkip] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState<null | 'finish' | 'skip'>(null);
  const [redirecting, setRedirecting] = React.useState(false);

  const current = TOUR_STEPS[step];

  // On mount, check if onboarding was finished/skipped but not confirmed
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem(ONBOARDING_FINISHED_KEY) === 'true') {
        setShowMeetDev(true);
      }
    }
  }, []);

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
        window.location.href = '/dashboard';
      }
    } catch {}
  }, []);

  if (showMeetDev) {
    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex justify-center">
        <button
          aria-label="Toggle theme"
          className="absolute top-4 right-4 p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow hover:scale-105 transition-transform"
          onClick={toggleTheme}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="w-full max-w-lg p-8 my-8 rounded-xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center animate-slide-up overflow-y-auto scrollbar-hide max-h-[90vh]">
          <h1 className="text-3xl font-bold mb-4 text-blue-700 dark:text-blue-300">
            You&apos;re all set!
          </h1>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            You now know where to find every feature. Explore, build, and collaborate with
            confidence!
          </p>
          <div className="relative w-fit mx-auto mb-4">
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
          <div className="mb-6 text-left text-gray-700 dark:text-gray-200 text-base">
            <h2 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-300 text-center">
              Meet the Developer
            </h2>
            <p className="mb-2">
              This platform was crafted with passion and care by <b>Saksham Goel</b>, a developer
              dedicated to building tools that empower teams and creators. If you have feedback,
              ideas, or just want to say hi, feel free to reach out via the Help Center or connect
              on GitHub!
            </p>
            <p className="italic text-sm text-gray-500 dark:text-gray-400">
              Thank you for choosing Dionysus. Wishing you productive coding and seamless
              collaboration!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
            <button
              onClick={() => {
                setShowMeetDev(false);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(ONBOARDING_FINISHED_KEY);
                }
              }}
              className="px-6 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors"
            >
              ← Back to Onboarding
            </button>
            <button
              onClick={() => setShowConfirm('finish')}
              disabled={redirecting}
              className={`px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors${redirecting ? ' opacity-60 cursor-not-allowed' : ''}`}
            >
              Go to Dashboard
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
              // router.replace('/dashboard'); // removed, handled in handleComplete
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900/80 dark:bg-black/90 transition-colors duration-300 relative z-50 scrollbar-hide">
      <button
        aria-label="Toggle theme"
        className="absolute top-4 right-4 p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow hover:scale-105 transition-transform z-50"
        onClick={toggleTheme}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      {/* Animated spotlight for the current feature */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-10 animate-fade-in" />
      <div className="relative z-20 w-full max-w-lg mx-auto p-0 sm:p-8 rounded-xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col items-center animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="w-full flex flex-col items-center animate-fade-in p-6 sm:p-0">
          <span className="text-6xl mb-2 animate-bounce drop-shadow-lg">
            {FEATURE_ICONS[current.key]}
          </span>
          <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-2 animate-fade-in-slow text-center w-full flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-600 animate-pulse"></span>
            {current.title}
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-600 animate-pulse"></span>
          </h2>
          <div className="text-gray-700 dark:text-gray-200 text-lg animate-fade-in-slow w-full text-left prose dark:prose-invert max-w-none">
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
        <div className="flex gap-4 mt-6 mb-4">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold transition-colors animate-fade-in"
            >
              Previous
            </button>
          )}
          {step < TOUR_STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors animate-fade-in"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm('finish')}
              className="px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors animate-fade-in"
            >
              Finish
            </button>
          )}
          {showSkip && step === 0 && (
            <button
              onClick={() => setShowConfirm('skip')}
              className="px-6 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors animate-fade-in ml-2"
              title="You will never see this onboarding again."
            >
              Skip
            </button>
          )}
        </div>
        <div className="mt-2 mb-4 text-xs text-gray-400 dark:text-gray-500 animate-fade-in">
          Step {step + 1} of {TOUR_STEPS.length}
        </div>
        <div className="w-full flex justify-center mb-4">
          {[...Array(TOUR_STEPS.length)].map((_, idx) => (
            <span
              key={idx}
              className={`inline-block w-2 h-2 mx-1 rounded-full ${idx === step ? 'bg-blue-500 dark:bg-blue-300 scale-125' : 'bg-gray-300 dark:bg-gray-600'} transition-transform`}
            />
          ))}
        </div>
        {showSkip && step === 0 && (
          <div className="mb-4 text-xs text-yellow-700 dark:text-yellow-300 text-center animate-fade-in">
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
        .scrollbar-hide {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
          overflow: overlay !important;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none !important;
          background: inherit;
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
}

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full animate-slide-up">
        <p className="mb-6 text-gray-900 dark:text-gray-100 text-center text-lg">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={async () => {
              await onCancel();
            }}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await onConfirm();
            }}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
