'use client';
import React from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const CustomContextMenu = () => {
  const [visible, setVisible] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [isReading, setIsReading] = React.useState(false);

  React.useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setPos({ x: e.clientX, y: e.clientY });
      setTargetElement(e.target as HTMLElement);
      setVisible(true);
    };

    const onClick = () => {
      setVisible(false);
      setTargetElement(null);
    };

    const onKeyDown = () => {
      setVisible(false);
      setTargetElement(null);
    };

    const onScroll = () => {
      setVisible(false);
      setTargetElement(null);
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  const getMenuStyle = () => {
    const isMobile = window.innerWidth <= 600;
    const itemHeight = isMobile ? 36 : 40;
    const numButtons = 7 + 1;
    const numDividers = 2;
    const menuHeight = numButtons * itemHeight + numDividers * 16;
    const menuWidth = isMobile ? 180 : 220;
    let top = pos.y + window.scrollY;
    let left = pos.x + window.scrollX;
    if (typeof window !== 'undefined') {
      if (top + menuHeight > window.scrollY + window.innerHeight) {
        top = window.scrollY + window.innerHeight - menuHeight - 8;
      }
      if (left + menuWidth > window.scrollX + window.innerWidth) {
        left = window.scrollX + window.innerWidth - menuWidth - 8;
      }
      top = Math.max(top, 8);
      left = Math.max(left, 8);
    }
    return {
      position: 'fixed',
      top: top + 'px',
      left: left + 'px',
      zIndex: 99999,
      background: resolvedTheme === 'dark' ? '#18181b' : '#fff',
      color: resolvedTheme === 'dark' ? '#f3f4f6' : '#222',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      minWidth: menuWidth + 'px',
      maxWidth: '96vw',
      maxHeight: '96vh',
      padding: '2px',
      overflow: 'auto',
    };
  };

  const handleCopy = async () => {
    try {
      const selection = window.getSelection()?.toString();
      if (selection) {
        await navigator.clipboard.writeText(selection);
        toast.success('Copied to clipboard.');
      }
    } catch (err) {
      console.error(err);
      document.execCommand('copy');
      toast.error('Copy failed.');
    }
    setVisible(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (
        targetElement &&
        (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT')
      ) {
        const input = targetElement as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const value = input.value;
        input.value = value.slice(0, start) + text + value.slice(end);
        input.selectionStart = input.selectionEnd = start + text.length;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Paste failed. Clipboard access may be blocked.');
    }
    setVisible(false);
  };

  const handleCut = async () => {
    try {
      const selection = window.getSelection()?.toString();
      if (selection) {
        await navigator.clipboard.writeText(selection);
        document.execCommand('cut');
        toast.success('Cut to clipboard.');
      }
    } catch (err) {
      console.error(err);
      document.execCommand('cut');
      toast.error('Cut failed.');
    }
    setVisible(false);
  };

  const handleReload = () => {
    window.location.reload();
    setVisible(false);
  };

  const handleBack = () => {
    window.history.back();
    setVisible(false);
  };

  const handleForward = () => {
    window.history.forward();
    setVisible(false);
  };

  const handleSaveAs = async () => {
    try {
      if ('showSaveFilePicker' in window) {
        // @ts-ignore
        const picker = await window.showSaveFilePicker({
          suggestedName: document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html',
          types: [
            {
              description: 'HTML file',
              accept: { 'text/html': ['.html', '.htm'] },
            },
          ],
        });
        const writable = await picker.createWritable();
        const html = document.documentElement.outerHTML;
        await writable.write(html);
        await writable.close();
        toast.success('Page saved.');
      } else {
        const a = document.createElement('a');
        a.href =
          'data:text/html;charset=utf-8,' + encodeURIComponent(document.documentElement.outerHTML);
        a.download = (document.title || 'download') + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Page downloaded.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Save As failed or was cancelled.');
    }
    setVisible(false);
  };

  const handleShare = async () => {
    const shareText =
      "I'm using Dionysus – Your AI GitHub Assistant. Try it out! https://dionysus-gray.vercel.app";
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out Dionysus!',
          text: shareText,
          url: 'https://dionysus-gray.vercel.app',
        });
        toast.success('Share dialog opened.');
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Share link copied to clipboard.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Share failed.');
    }
    setVisible(false);
  };

  // Helper to check for client-side
  const isClient = typeof window !== 'undefined';

  const canCopy = isClient && !!window.getSelection()?.toString();
  const canPaste =
    isClient &&
    !!(
      targetElement &&
      (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') &&
      navigator.clipboard
    );
  const canCut = canCopy;
  const canSelectAll = !!(
    targetElement &&
    (targetElement.tagName === 'TEXTAREA' ||
      targetElement.tagName === 'INPUT' ||
      targetElement.isContentEditable)
  );

  const handleSelectAll = () => {
    if (
      targetElement &&
      (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT')
    ) {
      const input = targetElement as HTMLInputElement | HTMLTextAreaElement;
      input.select();
    } else if (targetElement && targetElement.isContentEditable) {
      const range = document.createRange();
      range.selectNodeContents(targetElement);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } else {
      document.execCommand('selectAll');
    }
    setVisible(false);
  };

  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const startVoiceTyping = (input: HTMLInputElement | HTMLTextAreaElement) => {
    if (!isSpeechRecognitionSupported)
      return toast.error('Voice typing not supported in this browser.');
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const value = input.value;
      input.value = value.slice(0, start) + transcript + value.slice(end);
      input.selectionStart = input.selectionEnd = start + transcript.length;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      toast.success('Voice input added.');
    };
    recognition.onerror = (event: any) => {
      toast.error('Voice typing error: ' + event.error);
    };
    recognition.start();
    toast.info('Voice typing started. Speak now...');
  };

  const handleReadAloud = (text: string) => {
    if (!isSpeechSynthesisSupported)
      return toast.error('Read aloud not supported in this browser.');
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    utter.onend = () => setIsReading(false);
    utter.onerror = () => setIsReading(false);
    setIsReading(true);
    window.speechSynthesis.speak(utter);
    toast.info('Reading aloud...');
  };

  const handleStopReading = () => {
    if (isSpeechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      toast.info('Stopped reading.');
    }
  };

  if (!visible) return null;

  const buttonClass =
    'block w-full text-left px-4 py-2 text-sm rounded-md transition-all hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-200 dark:focus:bg-gray-700 focus:outline-none';

  return (
    <div
      style={getMenuStyle() as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()}
      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl"
    >
      {canCut && (
        <button onClick={handleCut} className={buttonClass}>
          Cut
        </button>
      )}
      {canCopy && (
        <button onClick={handleCopy} className={buttonClass}>
          Copy
        </button>
      )}
      {canPaste && (
        <button onClick={handlePaste} className={buttonClass}>
          Paste
        </button>
      )}
      {canSelectAll && (
        <button onClick={handleSelectAll} className={buttonClass}>
          Select All
        </button>
      )}
      {canPaste &&
        isSpeechRecognitionSupported &&
        targetElement &&
        (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') && (
          <button
            onClick={() => {
              startVoiceTyping(targetElement as HTMLInputElement | HTMLTextAreaElement);
              setVisible(false);
            }}
            className={buttonClass}
          >
            Voice Typing
          </button>
        )}
      {isSpeechSynthesisSupported &&
        (() => {
          let text = '';
          if (window.getSelection && window.getSelection()?.toString()) {
            text = window.getSelection()!.toString();
          } else if (targetElement) {
            if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
              text = (targetElement as HTMLInputElement | HTMLTextAreaElement).value;
            } else if (targetElement.isContentEditable) {
              text = targetElement.innerText;
            } else {
              text = targetElement.textContent || '';
            }
          }
          text = text.trim();
          return text ? (
            <button
              onClick={() => {
                handleReadAloud(text);
                setVisible(false);
              }}
              className={buttonClass}
            >
              Read Aloud
            </button>
          ) : null;
        })()}
      {isSpeechSynthesisSupported && isReading && (
        <button
          onClick={() => {
            handleStopReading();
            setVisible(false);
          }}
          className={buttonClass + ' text-red-600 dark:text-red-400'}
        >
          Stop Reading
        </button>
      )}

      <div className="border-t border-gray-200 dark:border-zinc-700 my-2" />

      <button onClick={handleReload} className={buttonClass}>
        Reload
      </button>
      <button onClick={handleBack} className={buttonClass}>
        Back
      </button>
      <button onClick={handleForward} className={buttonClass}>
        Forward
      </button>
      <button onClick={handleSaveAs} className={buttonClass}>
        Save As
      </button>

      <div className="border-t border-gray-200 dark:border-zinc-700 my-2" />

      <button onClick={handleShare} className={`${buttonClass} text-blue-600 dark:text-blue-400`}>
        Share Site
      </button>
    </div>
  );
};

export default CustomContextMenu;
