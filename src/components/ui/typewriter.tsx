'use client';
import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function TextGenerateEffect({
  words,
  className = '',
}: {
  words: string;
  className?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) => words.slice(0, latest));

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let stopped = false;
    function runAnimation() {
      if (stopped) return;
      count.set(0);
      const controls = animate(count, words.length, {
        type: 'tween',
        duration: 2.5,
        ease: 'easeInOut',
        onComplete: () => {
          timeout = setTimeout(runAnimation, 3000);
        },
      });
      return controls;
    }
    const controls = runAnimation();
    return () => {
      stopped = true;
      if (controls) controls.stop();
      if (timeout) clearTimeout(timeout);
    };
  }, [words, count]);

  return <motion.span className={className}>{displayText}</motion.span>;
}
