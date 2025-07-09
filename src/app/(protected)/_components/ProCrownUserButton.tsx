'use client';
import { Crown } from 'lucide-react';
import UserAvatarMenu from '@/components/ui/UserAvatarMenu';

export default function ProCrownUserButton({ isPro }: { isPro: boolean }) {
  return (
    <div className="relative inline-block">
      <UserAvatarMenu />
      {isPro && (
        <span className="absolute -top-2 -right-2 z-10">
          <Crown className="w-5 h-5 text-yellow-400 drop-shadow" fill="#facc15" />
        </span>
      )}
    </div>
  );
}
