'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEffect, useState } from 'react';
function ExclamationTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M9.401 2.566a1.75 1.75 0 0 1 3.198 0l6.857 13.714A1.75 1.75 0 0 1 17.857 19H2.143a1.75 1.75 0 0 1-1.599-2.72L7.401 2.566zm1.599 11.184a1 1 0 1 0-2 0v1a1 1 0 0 0 2 0v-1zm-1-7.25a1 1 0 0 0-.993.883l-.007.117v4a1 1 0 0 0 1.993.117l.007-.117v-4a1 1 0 0 0-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
const CHECKLIST_KEY = 'onboardingChecklist';
const DEFAULT_STEPS = [
  'Create a First Project',
  'Invite a Team Member',
  'Try the AI Code Analyser Assistant',
  'Save your questions and answers',
  'Explore Diffreent Tabs in dashboard',
  'Checkout Billing & pricing',
  'Checkout Subscriptions',
  'Have a query Connect to support',
];

const STEP_LINKS: (string | null)[] = [
  '/create',
  '/dashboard',
  null,
  '/qa',
  '/dashboard',
  '/billing',
  '/subscriptions',
  '/supportAuth',
];

function getChecklistFromCookie() {
  const match = document.cookie.match(new RegExp('(?:^|; )' + CHECKLIST_KEY + '=([^;]*)'));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[1] ?? ''));
    } catch {}
  }
  return null;
}

function setChecklistToCookie(data: {
  checked: boolean[];
  open: boolean;
  skipped: boolean;
  fullyDone: boolean;
}) {
  document.cookie = `${CHECKLIST_KEY}=${encodeURIComponent(JSON.stringify(data))};path=/;SameSite=Lax;max-age=31536000`;
}

export default function OnboardingChecklist() {
  const [steps] = useState(DEFAULT_STEPS);
  const [checked, setChecked] = useState<boolean[]>(Array(DEFAULT_STEPS.length).fill(false));
  const [open, setOpen] = useState(true);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [fullyDone, setFullyDone] = useState(false);

  useEffect(() => {
    const saved = getChecklistFromCookie();
    if (saved && Array.isArray(saved.checked) && saved.checked.length === steps.length) {
      setChecked(saved.checked);
      setOpen(saved.open !== false);
      setSkipped(!!saved.skipped);
      setFullyDone(!!saved.fullyDone);
    }
  }, [steps.length]);

  useEffect(() => {
    setChecklistToCookie({ checked, open, skipped, fullyDone });
  }, [checked, open, skipped, fullyDone]);

  // Checklist is removed after done or skipped, no undo
  if (fullyDone || skipped) return null;

  if (!open)
    return (
      <button
        className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 px-3 py-1 text-xs text-white shadow-lg"
        onClick={() => setOpen(true)}
        style={{ fontSize: 12 }}
      >
        Show Checklist
      </button>
    );

  return (
    <>
      <div
        className="fixed bottom-4 right-4 z-50 w-72 max-w-[90vw] rounded-xl border border-gray-300 bg-white/90 p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900/90"
        style={{ fontSize: 13 }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold text-blue-700 dark:text-blue-300">Getting Started</span>
          <button
            className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={() => setOpen(false)}
            aria-label="Hide checklist"
          >
            ✕
          </button>
        </div>
        <ul className="mb-2">
          {steps.map((step, i) => {
            const link = STEP_LINKS[i];
            const label = (
              <label
                htmlFor={`onboarding-step-${i}`}
                className={
                  checked[i]
                    ? 'text-gray-400 line-through'
                    : 'cursor-pointer text-blue-700 hover:underline dark:text-blue-300'
                }
                style={link ? { cursor: 'pointer' } : {}}
              >
                {step}
              </label>
            );
            return (
              <li key={i} className="mb-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => {
                    const next = [...checked];
                    next[i] = !next[i];
                    setChecked(next);
                  }}
                  className="h-4 w-4 accent-blue-600"
                  id={`onboarding-step-${i}`}
                />
                {link ? (
                  <a href={link} tabIndex={0} className="focus:outline-none">
                    {label}
                  </a>
                ) : (
                  label
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end gap-2">
          {checked.every(Boolean) ? (
            <button
              className="text-xs text-green-600 underline hover:text-green-800"
              onClick={() => setFullyDone(true)}
            >
              Done Checklist
            </button>
          ) : (
            <>
              <button
                className="text-xs text-gray-500 underline hover:text-blue-600"
                onClick={() => setChecked(Array(steps.length).fill(true))}
              >
                Mark all as done
              </button>
              <button
                className="text-xs text-gray-500 underline hover:text-red-600"
                onClick={() => setShowSkipModal(true)}
              >
                Skip
              </button>
            </>
          )}
        </div>
      </div>
      <AlertDialog open={showSkipModal} onOpenChange={setShowSkipModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                <ExclamationTriangleIcon className="h-5 w-5" />
              </span>
              <AlertDialogTitle className="text-lg font-bold text-yellow-700 dark:text-yellow-200">
                Skip onboarding checklist?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="mb-3 text-gray-700 dark:text-gray-300">
              {checked.some(Boolean) ? (
                <span>
                  You have already completed some steps.
                  <br />
                  Are you sure you want to <b>skip</b> and remove the checklist?
                </span>
              ) : (
                <span>
                  Are you sure you want to <b>skip</b> the onboarding checklist?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-none bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                onClick={() => {
                  setSkipped(true);
                  setOpen(false);
                  setShowSkipModal(false);
                }}
                className="w-full rounded bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Skip and remove
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
