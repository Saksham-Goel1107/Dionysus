'use client';
import StarOnGithub from '@/app/components/starOnGithub';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { AvatarStack } from '@/components/ui/kibo-ui/avatar-stack';
import { UserButton, useUser } from '@clerk/nextjs';
import { Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const PRODUCT_LINKS = [
  {
    name: 'GitDiagram',
    url: 'https://gitdiagram.com/',
    description: 'Visualize your repo structure and codebase instantly.',
    icon: '🗺️',
  },
  {
    name: 'Code2Tutorial',
    url: 'https://code2tutorial.com/',
    description: 'Turn code into interactive tutorials and guides.',
    icon: '📖',
  },
  {
    name: 'GitForMe',
    url: 'https://gitforme.com/',
    description: 'AI-powered git command generator for any workflow.',
    icon: '🤖',
  },
  {
    name: 'GitIngest',
    url: 'https://gitingest.com/',
    description: 'Ingest and analyze git data for insights and metrics.',
    icon: '📊',
  },
  {
    name: 'ReadMeAI',
    url: 'https://readme-ai.streamlit.app',
    description: 'Generate beautiful, AI-powered README files for your projects.',
    icon: '📝',
  },
  {
    name: 'Git Kraken',
    url: 'https://www.gitkraken.com',
    description: 'Git Kraken is a powerful Git client that streamlines your workflow.',
    icon: '✍️',
  },
  {
    name: 'OctoAI',
    url: 'https://www.octiai.com',
    description: 'AI-powered code review and suggestions for GitHub repos.',
    icon: '🐙',
  },
  {
    name: 'StackBlitz',
    url: 'https://stackblitz.com/',
    description: 'Instant online IDE for rapid prototyping and sharing.',
    icon: '⚡',
  },
  {
    name: 'CodeSandbox',
    url: 'https://codesandbox.io/',
    description: 'Online code editor and prototyping tool for web apps.',
    icon: '🏖️',
  },
  {
    name: 'Replit',
    url: 'https://replit.com/',
    description: 'Collaborative browser-based IDE for any language.',
    icon: '🔁',
  },
  {
    name: 'GitHub Copilot',
    url: 'https://github.com/features/copilot',
    description: 'Your AI pair programmer for faster coding.',
    icon: '🤝',
  },
  {
    name: 'DeepSource',
    url: 'https://deepsource.com/',
    description: 'Automated code review and static analysis for teams.',
    icon: '🔬',
  },
  {
    name: 'Sourcegraph',
    url: 'https://sourcegraph.com/',
    description: 'Universal code search and intelligence for developers.',
    icon: '🔎',
  },
  {
    name: 'GitHub Actions',
    url: 'https://github.com/features/actions',
    description: 'Automate, customize, and execute your software workflows.',
    icon: '⚙️',
  },
];

export default function UserAvatarMenu() {
  const [showMenu, setShowMenu] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(true);
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showAbTestingPopup, setShowAbTestingPopup] = useState(false);
  const [isAbTestingOptedIn, setIsAbTestingOptedIn] = useState<boolean | null>(null);
  const [isAbTestingLoading, setIsAbTestingLoading] = useState(false);
  const [showAbOptOutConfirm, setShowAbOptOutConfirm] = useState(false);
  const [abTestingInfo, setAbTestingInfo] = useState<{
    currentCount: number;
    limit: number;
    spotsRemaining: number;
  } | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsCheckingPassword(true);
      try {
        const res = await fetch('/api/has-password');
        const data = await res.json();
        if (!mounted) return;
        setHasPassword(!!data.hasPassword);
      } catch {
        if (!mounted) return;
        setHasPassword(null);
      } finally {
        if (!mounted) return;
        setIsCheckingPassword(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress) {
      fetch('/api/newsletter/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsSubscribed(data.isSubscribed);
          } else {
            setIsSubscribed(null);
          }
        })
        .catch(() => setIsSubscribed(null));

      // Load A/B testing status
      fetch('/api/ab-testing/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsAbTestingOptedIn(data.abTestingOptIn);
            setAbTestingInfo({
              currentCount: data.currentCount,
              limit: data.limit,
              spotsRemaining: data.spotsRemaining,
            });
          } else {
            setIsAbTestingOptedIn(null);
            setAbTestingInfo(null);
          }
        })
        .catch(() => {
          setIsAbTestingOptedIn(null);
          setAbTestingInfo(null);
        });
    }
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowMenu(false);
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    } else {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMenu]);

  // Handle ESC key and outside clicks for products modal
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowProductsModal(false);
    }

    function handleOutsideClick(e: MouseEvent) {
      // Check if dialogRef exists and if click is outside the dialog
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setShowProductsModal(false);
      }
    }

    // Prevent body scrolling when modal is open
    if (showProductsModal) {
      // Save current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';

      document.addEventListener('keydown', handleEsc);
      // We use mousedown here to handle clicks outside modal
      document.addEventListener('mousedown', handleOutsideClick);

      return () => {
        // Restore scrolling
        document.body.style.overflow = originalStyle;
        document.removeEventListener('keydown', handleEsc);
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showProductsModal]); // Show menu only on double-click
  function handleDoubleClick(e: React.MouseEvent) {
    e.preventDefault();
    setShowMenu(true);
  }

  // Handle newsletter subscription
  async function handleSubscribe() {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.emailAddresses[0].emailAddress,
          name: user.firstName || '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
        toast.success('Successfully subscribed to the newsletter!');
        setShowNewsletterPopup(false);
      } else {
        toast.error(data.message || 'Failed to subscribe');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle newsletter unsubscription
  async function handleUnsubscribe() {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.emailAddresses[0].emailAddress,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSubscribed(false);
        toast.success('Successfully unsubscribed from the newsletter.');
        setShowNewsletterPopup(false);
      } else {
        toast.error(data.message || 'Failed to unsubscribe');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setShowUnsubscribeDialog(false);
    }
  }

  // Handle A/B testing opt in/out
  async function handleAbTestingToggle(optIn: boolean) {
    setIsAbTestingLoading(true);
    try {
      const res = await fetch('/api/ab-testing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abTestingOptIn: optIn,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAbTestingOptedIn(optIn);
        toast.success(
          optIn
            ? 'Successfully opted in to A/B testing!'
            : 'Successfully opted out of A/B testing.',
        );
        setShowAbTestingPopup(false);

        // Refresh the A/B testing info
        if (optIn) {
          setAbTestingInfo((prev) =>
            prev
              ? {
                  ...prev,
                  currentCount: prev.currentCount + 1,
                  spotsRemaining: prev.spotsRemaining - 1,
                }
              : null,
          );
        } else {
          setAbTestingInfo((prev) =>
            prev
              ? {
                  ...prev,
                  currentCount: prev.currentCount - 1,
                  spotsRemaining: prev.spotsRemaining + 1,
                }
              : null,
          );
        }
      } else {
        if (res.status === 409) {
          toast.error(data.message || 'A/B testing program is currently full.');
        } else {
          toast.error(data.message || 'Failed to update A/B testing preference');
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAbTestingLoading(false);
    }
  }

  return (
    <div className="relative inline-block" ref={buttonRef}>
      <div onDoubleClick={handleDoubleClick}>
        <UserButton />
      </div>
      {showMenu && (
        <div className="animate-fade-in w-59 absolute right-0 z-50 mt-2 rounded-lg border bg-white py-1 shadow-lg dark:bg-gray-900">
          <Button
            className="w-full justify-start rounded-lg py-3 text-base font-semibold text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900"
            variant="ghost"
            onClick={() => {
              setShowProductsModal(true);
              setShowMenu(false);
            }}
          >
            <span role="img" aria-label="Products" className="mr-2">
              🛍️
            </span>
            More Products
          </Button>

          <Button
            className="w-full justify-start rounded-lg py-3 text-base font-semibold"
            variant="ghost"
            onClick={() => {
              setShowMenu(false);
              router.push('/my-data');
            }}
          >
            <span role="img" aria-label="Data" className="mr-2">
              🗄️
            </span>
            See your data with us
          </Button>
          <Button
            className="w-full justify-start rounded-lg py-3 text-base font-semibold"
            variant="ghost"
            onClick={() => {
              setShowMenu(false);
              router.push('/status');
            }}
          >
            <span role="img" aria-label="Status" className="mr-2">
              📊
            </span>
            Check Dionysus Status
          </Button>
          {isCheckingPassword ? (
            <Button
              className="w-full justify-start rounded-lg py-3 text-base font-semibold text-amber-700"
              variant="ghost"
              disabled
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-500" />
              Checking...
            </Button>
          ) : (
            <Button
              className="w-full justify-start rounded-lg py-3 text-base font-semibold text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
              variant="ghost"
              onClick={() => {
                setShowMenu(false);
                if (hasPassword) {
                  router.push('/unlock');
                } else {
                  router.push('/lock');
                }
              }}
            >
              <span role="img" aria-label="Lock" className="mr-2">
                {hasPassword === false ? '🔒' : '🔓'}
              </span>
              {hasPassword === false ? 'Lock Your Account' : 'Unlock Your Account'}
            </Button>
          )}
          <Button
            className="w-full justify-start rounded-lg py-3 text-base font-semibold text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
            variant="ghost"
            asChild
          >
            <Link href="/blogs">
              <span role="img" aria-label="Blog" className="mr-2">
                📝
              </span>
              Our Blogs
            </Link>
          </Button>
          <Button
            className="w-full justify-start rounded-lg py-3 text-base font-semibold text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
            variant="ghost"
            onClick={() => {
              setShowMenu(false);
              setShowNewsletterPopup(true);
            }}
          >
            <span role="img" aria-label="Newsletter" className="mr-2">
              📧
            </span>
            Our Newsletter
          </Button>
          <Button
            className="w-full justify-start rounded-lg py-3 text-base font-semibold text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900"
            variant="ghost"
            onClick={() => {
              setShowMenu(false);
              setShowAbTestingPopup(true);
            }}
          >
            <span role="img" aria-label="A/B Testing" className="mr-2">
              🧪
            </span>
            A/B Testing Program
          </Button>
          <div className="mt-3 flex w-full items-center justify-between gap-2 px-2">
            <Button
              variant="outline"
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 py-3 text-base font-semibold shadow-sm transition-colors hover:bg-green-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-green-950"
              asChild
            >
              <a
                href="https://todo-dionysus-gray.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={0}
                className="flex w-full items-center gap-3"
              >
                <span className="text-xl" role="img" aria-label="Todo App">
                  ✅
                </span>
                <span className="flex flex-col items-start">
                  <span>Todo App</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                    Simple &amp; fast productivity tool
                  </span>
                </span>
              </a>
            </Button>
          </div>
          <div className="mt-2 flex w-full justify-center">
            <StarOnGithub />
          </div>
        </div>
      )}

      {showNewsletterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-900">
            <div className="relative p-6">
              <button
                onClick={() => setShowNewsletterPopup(false)}
                className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="mb-6 text-center text-2xl font-bold">Dionysus Newsletter</h2>

              <div className="mb-8 space-y-6">
                <div className="rounded-lg bg-blue-50 p-5 dark:bg-blue-900/30">
                  <h3 className="mb-3 text-lg font-semibold">📬 Why Subscribe?</h3>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Get early access to new features and updates</li>
                    <li>Receive exclusive tips and best practices</li>
                    <li>Stay informed about important security updates</li>
                    <li>Learn about upcoming webinars and events</li>
                    <li>Special offers and discounts for subscribers</li>
                  </ul>
                </div>

                {isSubscribed && (
                  <div className="rounded-lg bg-red-50 p-5 dark:bg-red-900/30">
                    <h3 className="mb-3 text-lg font-semibold">⚠️ What You&apos;ll Miss</h3>
                    <ul className="list-disc space-y-2 pl-5">
                      <li>Important product announcements and updates</li>
                      <li>Exclusive content and learning resources</li>
                      <li>Community events and networking opportunities</li>
                      <li>Special offers available only to subscribers</li>
                      <li>Critical security notifications and best practices</li>
                    </ul>
                  </div>
                )}

                <div className="rounded-lg bg-gray-100 p-5 dark:bg-gray-800">
                  <h3 className="mb-2 text-lg font-semibold">🔒 Privacy Commitment</h3>
                  <p>
                    We respect your inbox. We send newsletters monthly, never share your email, and
                    make it easy to unsubscribe at any time.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant={isSubscribed ? 'destructive' : 'default'}
                  size="lg"
                  disabled={isLoading}
                  onClick={isSubscribed ? () => setShowUnsubscribeDialog(true) : handleSubscribe}
                  className={`px-8 transition-all duration-150 ${isSubscribed ? '' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                >
                  {isLoading ? 'Processing...' : isSubscribed ? 'Unsubscribe' : 'Subscribe Now'}
                </Button>
              </div>
              <div className="flex w-full flex-col items-center justify-center gap-2">
                <span className="mt-2 text-lg font-bold text-gray-500 dark:text-gray-300">
                  Join other Subscribers
                </span>
                <AvatarStack animate>
                  <Avatar>
                    <AvatarImage src="https://github.com/haydenbleasel.png" />
                    <AvatarFallback>HB</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage src="https://github.com/leerob.png" />
                    <AvatarFallback>LR</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage src="https://github.com/serafimcloud.png" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                </AvatarStack>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showUnsubscribeDialog} onOpenChange={setShowUnsubscribeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to unsubscribe?</DialogTitle>
            <DialogDescription>You will stop receiving our newsletter updates.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleUnsubscribe} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Yes, Unsubscribe'}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A/B Testing Modal */}
      {showAbTestingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-900">
            <div className="relative p-6">
              <button
                onClick={() => setShowAbTestingPopup(false)}
                className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="mb-6 text-center text-2xl font-bold">A/B Testing Program</h2>

              <div className="mb-8 space-y-6">
                <div className="rounded-lg bg-purple-50 p-5 dark:bg-purple-900/30">
                  <h3 className="mb-3 text-lg font-semibold">🧪 Why Join A/B Testing?</h3>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Get early access to experimental features before public release</li>
                    <li>Help shape the future of Dionysus with your feedback</li>
                    <li>Experience cutting-edge improvements and optimizations</li>
                    <li>Contribute to making the platform better for everyone</li>
                    <li>Access to exclusive beta testing channels and discussions</li>
                  </ul>
                </div>

                {/* Availability Info */}
                {abTestingInfo && (
                  <div
                    className={`rounded-lg p-5 ${abTestingInfo.spotsRemaining > 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}
                  >
                    <h3 className="mb-3 text-lg font-semibold">
                      {abTestingInfo.spotsRemaining > 0
                        ? '✅ Program Availability'
                        : '❌ Program Full'}
                    </h3>
                    <p className="mb-2">
                      <strong>{abTestingInfo.currentCount}</strong> of{' '}
                      <strong>{abTestingInfo.limit}</strong> spots taken
                    </p>
                    {abTestingInfo.spotsRemaining > 0 ? (
                      <p className="text-green-700 dark:text-green-300">
                        <strong>{abTestingInfo.spotsRemaining}</strong> spots remaining
                      </p>
                    ) : (
                      <p className="text-red-700 dark:text-red-300">
                        The A/B testing program is currently full. Please check back later.
                      </p>
                    )}
                  </div>
                )}

                {isAbTestingOptedIn && (
                  <div className="rounded-lg bg-orange-50 p-5 dark:bg-orange-900/30">
                    <h3 className="mb-3 text-lg font-semibold">⚠️ What You&apos;ll Miss</h3>
                    <ul className="list-disc space-y-2 pl-5">
                      <li>Early access to experimental features and improvements</li>
                      <li>Opportunity to influence product development decisions</li>
                      <li>Exclusive beta testing experiences and previews</li>
                      <li>Direct feedback channels with our development team</li>
                      <li>Being part of the innovation process</li>
                    </ul>
                  </div>
                )}

                <div className="rounded-lg bg-gray-100 p-5 dark:bg-gray-800">
                  <h3 className="mb-2 text-lg font-semibold">🔒 Privacy & Safety</h3>
                  <p>
                    A/B testing may include experimental features that are still in development.
                    Your preferences are stored securely in your account metadata and you can opt
                    out at any time.
                  </p>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  variant={isAbTestingOptedIn ? 'destructive' : 'default'}
                  size="lg"
                  disabled={
                    isAbTestingLoading ||
                    (!isAbTestingOptedIn && abTestingInfo?.spotsRemaining === 0)
                  }
                  onClick={() => {
                    if (isAbTestingOptedIn) {
                      setShowAbOptOutConfirm(true);
                    } else {
                      handleAbTestingToggle(true);
                    }
                  }}
                  className={`px-8 transition-all duration-150 ${!isAbTestingOptedIn ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600' : ''}`}
                >
                  {isAbTestingLoading
                    ? 'Processing...'
                    : isAbTestingOptedIn
                      ? 'Opt Out'
                      : abTestingInfo?.spotsRemaining === 0
                        ? 'Program Full'
                        : 'Join A/B Testing'}
                </Button>
                <Dialog open={showAbOptOutConfirm} onOpenChange={setShowAbOptOutConfirm}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Opt-Out</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to opt out of the A/B testing program? You can re-join
                        later if spots are available.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowAbOptOutConfirm(false);
                          handleAbTestingToggle(false);
                        }}
                      >
                        Yes, Opt Out
                      </Button>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal - Completely independent from menu */}
      {showProductsModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowProductsModal(false)}
        >
          <div
            ref={dialogRef}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <span role="img" aria-label="Products">
                  🛍️
                </span>{' '}
                Explore More Products
              </h2>
              <button
                onClick={() => setShowProductsModal(false)}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Discover more tools and products by our team and the community:
            </p>

            <div className="grid max-h-[50vh] gap-4 overflow-y-auto py-2 pr-2">
              {PRODUCT_LINKS.map((prod) => (
                <a
                  key={prod.url}
                  href={prod.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm transition-colors hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-blue-950"
                >
                  <span className="text-2xl">{prod.icon}</span>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {prod.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {prod.description}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-4 px-2 text-center text-xs text-red-500 dark:text-red-300">
              <b>Note:</b> After leaving this platform, your security is not our responsibility. We
              cannot ensure any security or privacy for external tools or products.
            </div>

            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => setShowProductsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
