'use client';
import { Protect, useAuth } from '@clerk/nextjs';
import { MediaRoom } from '@/components/media-room';
import useProject from '@/hooks/use-project';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useProjectTeamGuard } from '@/hooks/use-project-team-guard';

const ChatPage = () => {
  const { userId } = useAuth();
  const { projectId } = useProject();
  const { resolvedTheme } = useTheme();
  useProjectTeamGuard(projectId);

  if (!projectId) {
    if (typeof window !== 'undefined') {
      window.location.replace('/dashboard');
    }
    return null;
  }

  return (
    <>
      <Protect
        plan="dionysus_advance_pack"
        fallback={
          <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2
              className={`text-center text-2xl font-bold ${
                resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}
            >
              Advance Plan Required
            </h2>
            <p
              className={`text-center ${
                resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-600'
              } max-w-md`}
            >
              Access to Chat+Video Call is available exclusively for{' '}
              <span className="font-semibold text-yellow-700">Dionysus Advance Pack</span>{' '}
              subscribers.
              <br />
              Upgrade your plan to unlock this feature.
            </p>
            <Link href="/subscriptions">
              <Button size="lg" className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700">
                Upgrade Now
              </Button>
            </Link>
          </div>
        }
      >
        <div className="h-full w-full">
          {userId && projectId && <MediaRoom projectId={projectId} video={true} audio={true} />}
        </div>
      </Protect>
    </>
  );
};

export default ChatPage;
