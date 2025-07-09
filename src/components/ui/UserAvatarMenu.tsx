'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';

export default function UserAvatarMenu() {
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
        </div>
      )}
    </div>
  );
}
