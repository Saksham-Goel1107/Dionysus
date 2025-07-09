'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';

export default function UserAvatarMenu() {
  const [showMenu, setShowMenu] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch if user has set a password
  useEffect(() => {
    fetch('/api/has-password')
      .then((res) => res.json())
      .then((data) => setHasPassword(!!data.hasPassword))
      .catch(() => setHasPassword(null));
  }, []);

  // Hide menu on click outside or escape
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

  return (
    <div className="relative inline-block" ref={buttonRef}>
      <div onDoubleClick={handleDoubleClick}>
        <UserButton />
      </div>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-900 border z-50 animate-fade-in">
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
        </div>
      )}
    </div>
  );
}
