'use client';
import { Crown } from 'lucide-react';
import UserAvatarMenu from '@/components/ui/UserAvatarMenu';

export default function ProCrownUserButton({ isPro }: { isPro: boolean }) {
  return (
    <div className="relative inline-block" data-user-button>
      <UserAvatarMenu />
      {isPro && (
        <span className="absolute -right-2 -top-2 z-10">
          <Crown className="h-5 w-5 text-yellow-400 drop-shadow" fill="#facc15" />
        </span>
      )}
    </div>
  );
}
