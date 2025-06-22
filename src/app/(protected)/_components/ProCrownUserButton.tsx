import { UserButton } from "@clerk/nextjs";
import { Crown } from "lucide-react";

export default function ProCrownUserButton({ isPro }: { isPro: boolean }) {
  return (
    <div className="relative inline-block">
      <UserButton />
      {isPro && (
        <span className="absolute -top-2 -right-2 z-10">
          <Crown className="w-5 h-5 text-yellow-400 drop-shadow" fill="#facc15" />
        </span>
      )}
    </div>
  );
}
