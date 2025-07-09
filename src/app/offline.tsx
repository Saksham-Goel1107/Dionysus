'use client';

import { useNetworkStatus } from '../components/useNetworkStatus';
import { useTheme } from 'next-themes';

export default function Offline({ children }: { children: React.ReactNode }) {
  const { isOffline, isVerySlow } = useNetworkStatus();
  const { resolvedTheme } = useTheme();

  const showOverlay = isOffline || isVerySlow;

  const isDark = resolvedTheme === 'dark';
  const overlayBg = isOffline
    ? isDark
      ? 'linear-gradient(135deg, #18181b 0%, #27272a 100%)'
      : 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)'
    : isDark
      ? 'linear-gradient(135deg, #f59e42 0%, #b45309 100%)'
      : 'linear-gradient(135deg, #f59e42 0%, #ffe0b2 100%)';
  const cardBg = isDark
    ? 'rgba(24,24,27,0.92)'
    : 'rgba(255,255,255,0.92)';
  const cardBorder = isOffline
    ? isDark
      ? '2px solid #27272a'
      : '2px solid #d1d5db'
    : '2px solid #f59e42';
  const cardColor = isDark ? '#fff' : '#222';

  return (
    <>
      {showOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: overlayBg,
            color: cardColor,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 500,
            textAlign: 'center',
            pointerEvents: 'all',
            userSelect: 'none',
            transition: 'background 0.5s',
          }}
        >
          <div style={{
            background: cardBg,
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '40px 32px',
            minWidth: 320,
            maxWidth: '90vw',
            border: cardBorder,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: cardColor,
          }}>
            {isOffline ? (
              <>
                <span style={{ fontSize: '3.5rem', marginBottom: 16, filter: isDark ? 'drop-shadow(0 2px 8px #0006)' : 'drop-shadow(0 2px 8px #f59e42)' }}>🚫</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>You are offline</div>
                <div style={{ marginTop: 8, fontSize: '1.05rem', opacity: 0.85 }}>
                  Please check your internet connection.<br />
                  Your work is safe, but you can&apos;t use the app until you&apos;re back online.
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: '3.5rem', marginBottom: 16, filter: isDark ? 'drop-shadow(0 2px 8px #f59e42)' : 'drop-shadow(0 2px 8px #f59e42)' }}>⚡</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Network is Very Slow</div>
                <div style={{ marginTop: 8, fontSize: '1.05rem', opacity: 0.85 }}>
                  The app is temporarily paused to prevent glitches.<br />
                  Please wait for your connection to improve.
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {!showOverlay && children}
    </>
  );
}