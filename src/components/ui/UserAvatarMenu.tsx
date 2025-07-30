'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserButton, useUser } from '@clerk/nextjs';
import StarOnGithub from '@/app/components/starOnGithub';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { AvatarStack } from '@/components/ui/kibo-ui/avatar-stack';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    url: 'https://readmeai.app/',
    description: 'Generate beautiful, AI-powered README files for your projects.',
    icon: '📝',
  },
  {
    name: 'OpenCommit',
    url: 'https://opencommit.dev/',
    description: 'AI commit message generator for better git hygiene.',
    icon: '✍️',
  },
  {
    name: 'OctoAI',
    url: 'https://octoai.com/',
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
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/has-password')
      .then((res) => res.json())
      .then((data) => setHasPassword(!!data.hasPassword))
      .catch(() => setHasPassword(null));
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

  // Show menu only on double-click
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
    } catch (error) {
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
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setShowUnsubscribeDialog(false);
    }
  }

  return (
    <div className="relative inline-block" ref={buttonRef}>
      <div onDoubleClick={handleDoubleClick}>
        <UserButton />
      </div>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-900 border z-50 animate-fade-in">
          <Button
            className="w-full justify-start rounded-lg text-base font-semibold py-3 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900"
            variant="ghost"
            onClick={() => {
              setShowProductsModal(true);
            }}
          >
            <span role="img" aria-label="Products" className="mr-2">
              🛍️
            </span>
            More Products
          </Button>
          <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <span role="img" aria-label="Products">
                    🛍️
                  </span>{' '}
                  Explore More Products
                </DialogTitle>
                <DialogDescription>
                  Discover more tools and products by our team and the community:
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2 max-h-80 overflow-y-auto pr-2">
                {PRODUCT_LINKS.map((prod) => (
                  <a
                    key={prod.url}
                    href={prod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors shadow-sm"
                  >
                    <span className="text-2xl">{prod.icon}</span>
                    <div>
                      <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                        {prod.name}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 text-sm">
                        {prod.description}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="text-xs text-center text-red-500 dark:text-red-300 mt-4 px-2">
                <b>Note:</b> After leaving this platform, your security is not our responsibility.
                We cannot ensure any security or privacy for external tools or products.
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            className="w-full justify-start rounded-lg text-base font-semibold py-3"
            variant="ghost"
            onClick={() => {
              setShowMenu(false);
              router.push('/my-data');
            }}
          >
            See your data with us
          </Button>
          <Button
            className="w-full justify-start rounded-lg text-base font-semibold py-3"
            variant="ghost"
            onClick={() => {
              setShowMenu(false);
              router.push('/status');
            }}
          >
            Check Dionysus Status
          </Button>
          <Button
            className="w-full justify-start rounded-lg text-base font-semibold py-3 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
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
            <span role="img" aria-label="Lock">
              {hasPassword === false ? '🔒' : '🔓'}
            </span>
            {hasPassword === false ? 'Lock Your Account' : 'Unlock Your Account'}
          </Button>
          <Button
            className="w-full justify-start rounded-lg text-base font-semibold py-3 text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
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
          <div className="mt-2 flex w-full justify-center">
            <StarOnGithub />
          </div>
        </div>
      )}

      {showNewsletterPopup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 relative">
              <button
                onClick={() => setShowNewsletterPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold mb-6 text-center">Dionysus Newsletter</h2>

              <div className="space-y-6 mb-8">
                <div className="p-5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">📬 Why Subscribe?</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Get early access to new features and updates</li>
                    <li>Receive exclusive tips and best practices</li>
                    <li>Stay informed about important security updates</li>
                    <li>Learn about upcoming webinars and events</li>
                    <li>Special offers and discounts for subscribers</li>
                  </ul>
                </div>

                {isSubscribed && (
                  <div className="p-5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">⚠️ What You&apos;ll Miss</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Important product announcements and updates</li>
                      <li>Exclusive content and learning resources</li>
                      <li>Community events and networking opportunities</li>
                      <li>Special offers available only to subscribers</li>
                      <li>Critical security notifications and best practices</li>
                    </ul>
                  </div>
                )}

                <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">🔒 Privacy Commitment</h3>
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
              <div className="flex flex-col justify-center items-center w-full gap-2">
                <span className=" text-gray-500 dark:text-gray-300 mt-2 font-bold text-lg">
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
    </div>
  );
}
