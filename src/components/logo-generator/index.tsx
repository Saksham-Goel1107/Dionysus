'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';
import LogoGeneratorModal from './LogoGeneratorModal';

interface LogoGeneratorProps {
  className?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonText?: string;
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
}

const LogoGenerator = ({
  className = '',
  buttonVariant = 'default',
  buttonText = 'Generate Logo',
  buttonSize = 'default',
}: LogoGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <ImageIcon className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
      <LogoGeneratorModal open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default LogoGenerator;
