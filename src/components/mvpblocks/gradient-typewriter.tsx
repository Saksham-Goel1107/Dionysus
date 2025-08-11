import TextGenerateEffect from '@/components/ui/typewriter';
import { useRef, useLayoutEffect, useState } from 'react';

export default function GradientTypewriter({ words = 'Gradient Text' }: { words?: string }) {
  const ghostRef = useRef<HTMLSpanElement>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (ghostRef.current) {
      setMinWidth(ghostRef.current.offsetWidth);
    }
  }, [words]);

  return (
    <div className="relative flex items-center justify-center" style={minWidth ? { minWidth } : {}}>
      <span
        ref={ghostRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 select-none bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-xl font-bold text-transparent"
        style={{ whiteSpace: 'pre' }}
      >
        {words}
      </span>
      <span style={minWidth ? { minWidth } : {}}>
        <TextGenerateEffect
          words={words}
          className="relative bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-xl font-bold text-transparent"
        />
      </span>
    </div>
  );
}
