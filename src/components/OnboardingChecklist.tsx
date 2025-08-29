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
  'Explore Different Tabs in dashboard',
  'Checkout Billing & pricing',
  'Checkout Subscriptions',
  'Have a query? Connect to support',
  'Add Dionysus shortcut to your screen',
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
  null, // shortcut step handled with modal
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
  const [showShortcutModal, setShowShortcutModal] = useState(false);
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
  if (fullyDone || skipped || process.env.NODE_ENV !== 'production') return null;

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
        className="fixed bottom-2 left-1/2 z-[100] w-[95vw] max-w-xs -translate-x-1/2 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/95 sm:bottom-4 sm:left-auto sm:right-4 sm:w-80 sm:translate-x-0 md:max-w-sm"
        style={{ fontSize: 15 }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-blue-700 dark:text-blue-300">
            Getting Started
          </span>
          <button
            className="rounded-full p-1 text-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            onClick={() => setOpen(false)}
            aria-label="Hide checklist"
          >
            ✕
          </button>
        </div>
        <ul className="mb-3 space-y-2">
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
            // Last step: shortcut modal
            if (i === steps.length - 1) {
              return (
                <li key={i} className="flex items-center gap-2">
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
                  <button
                    type="button"
                    className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-700"
                    onClick={() => setShowShortcutModal(true)}
                  >
                    How to add shortcut
                  </button>
                </li>
              );
            }
            return (
              <li key={i} className="flex items-center gap-2">
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
        <div className="flex flex-wrap justify-end gap-2">
          {checked.every(Boolean) ? (
            <button
              className="rounded bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm ring-1 ring-inset ring-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 dark:ring-green-700"
              onClick={() => setFullyDone(true)}
            >
              Done Checklist
            </button>
          ) : (
            <>
              <button
                className="rounded bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-700"
                onClick={() => setChecked(Array(steps.length).fill(true))}
              >
                Mark all as done
              </button>
              <button
                className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-700"
                onClick={() => setShowSkipModal(true)}
              >
                Skip
              </button>
            </>
          )}
        </div>
      </div>
      {/* Shortcut instructions modal */}
      <AlertDialog open={showShortcutModal} onOpenChange={setShowShortcutModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-blue-700 dark:text-blue-200">
              Add Dionysus shortcut to your screen
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="mb-3 text-sm text-gray-700 dark:text-gray-300">
            <b>Desktop (Chrome/Edge):</b>
            <ol className="mb-2 mt-1 list-decimal pl-5">
              <li>Click the browser menu (⋮ or ...)</li>
              <li>
                Choose <b>More tools</b> &rarr; <b>Create shortcut...</b>
              </li>
              <li>Check &quot;Open as window&quot; for best experience</li>
              <li>
                Click <b>Create</b>
              </li>
            </ol>
            <b>Mobile (Safari/Chrome):</b>
            <ol className="mb-2 mt-1 list-decimal pl-5">
              <li>
                Tap the <b>Share</b> icon (Safari) or menu (⋮ in Chrome)
              </li>
              <li>
                Select <b>Add to Home Screen</b>
              </li>
              <li>Follow the prompts</li>
            </ol>
            <span className="mt-2 block text-xs text-gray-500">
              This works on all major browsers and devices. No PWA install required.
            </span>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <button
                onClick={() => {
                  // Mark as done
                  const next = [...checked];
                  next[steps.length - 1] = true;
                  setChecked(next);
                  setShowShortcutModal(false);
                }}
                className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                I added the shortcut
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
