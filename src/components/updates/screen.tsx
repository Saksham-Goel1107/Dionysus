'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface MaintenanceInfo {
  maintenanceEnd?: number;
  features?: string[];
  message?: string;
  images?: string[];
  videos?: string[];
  banner?: string;
}

function formatTime(ms: number) {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

export default function MaintenanceScreen() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [info, setInfo] = useState<MaintenanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance-info');
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (data.maintenanceEnd) {
          const updateTime = () => {
            const ms = data.maintenanceEnd - Date.now();
            setTimeLeft(formatTime(ms));
          };
          updateTime();
          intervalRef.current = setInterval(updateTime, 1000);
        }
      } else {
        setInfo(null);
      }
    } catch {
      setInfo(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchInfo();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (info?.maintenanceEnd) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const updateTime = () => {
        const ms = (info.maintenanceEnd ?? 0) - Date.now();
        setTimeLeft(formatTime(ms));
      };
      updateTime();
      intervalRef.current = setInterval(updateTime, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [info?.maintenanceEnd]);

  if (!mounted) return null;

  return (
    <div
      className="animate-gradient flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-900 via-blue-800 to-sky-400 bg-[length:400%_400%] px-4 dark:from-gray-900 dark:via-gray-800 dark:to-sky-900"
      style={{
        transition: 'background 0.3s',
      }}
    >
      <div className="relative flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-3xl border-4 border-sky-200 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-sky-900 dark:bg-gray-900/90">
        {/* Banner or SVG */}
        {info?.banner ? (
          <Image
            width={900}
            height={400}
            src={info.banner}
            alt="Maintenance Banner"
            className="mb-6 rounded-2xl border-2 border-sky-200 object-cover shadow-xl dark:border-sky-800"
          />
        ) : (
          <svg width={100} height={100} viewBox="0 0 24 24" fill="none" className="mb-6">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={theme === 'dark' ? '#38bdf8' : '#0ea5e9'}
              strokeWidth="2"
              fill={theme === 'dark' ? '#1e293b' : '#e0f2fe'}
            />
            <path
              d="M8 12h8M12 8v8"
              stroke={theme === 'dark' ? '#38bdf8' : '#0ea5e9'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-sky-700 drop-shadow-xl dark:text-sky-300">
          Dionysus is Leveling Up!
        </h1>
        <p className="mx-auto mb-6 max-w-xl text-lg font-medium text-gray-800 dark:text-gray-300">
          {info?.message || (
            <>
              Our site is currently undergoing scheduled maintenance.
              <br />
              We&rsquo;ll be back shortly with new features and improvements.
            </>
          )}
        </p>
        {/* Countdown Timer */}
        {info?.maintenanceEnd && (
          <div className="mb-6 flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">
              Estimated Time Left
            </span>
            <span className="mt-2 animate-pulse rounded-xl bg-sky-100 px-6 py-2 font-mono text-3xl font-bold text-sky-600 shadow dark:bg-sky-900 dark:text-sky-200">
              {timeLeft}
            </span>
          </div>
        )}
        {/* Features */}
        {info?.features && info.features.length > 0 && (
          <div className="mb-6 w-full">
            <span className="text-lg font-semibold text-sky-700 dark:text-sky-300">
              What’s coming:
            </span>
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {info.features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-sky-50 px-4 py-2 text-gray-700 shadow dark:bg-sky-800/60 dark:text-gray-200"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-sky-400 dark:bg-sky-300"></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Images Carousel */}
        {info?.images && info.images.length > 0 && (
          <div className="mb-6 w-full">
            <span className="text-lg font-semibold text-sky-700 dark:text-sky-300">
              Sneak Peek:
            </span>
            <div className="scrollbar-thin scrollbar-thumb-sky-300 dark:scrollbar-thumb-sky-800 mt-2 flex gap-3 overflow-x-auto pb-2">
              {info.images.map((img, i) => (
                <div key={i} className="min-w-[180px] max-w-[220px] flex-shrink-0">
                  <Image
                    width={220}
                    height={140}
                    src={img}
                    alt={`update-img-${i}`}
                    className="rounded-xl border-2 border-sky-200 object-cover shadow dark:border-sky-800"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Videos Section */}
        {info?.videos && info.videos.length > 0 && (
          <div className="mb-6 w-full">
            <span className="text-lg font-semibold text-sky-700 dark:text-sky-300">
              Watch What’s New:
            </span>
            <div className="mt-2 flex flex-col gap-4">
              {info.videos.map((vid, i) =>
                (() => {
                  try {
                    const { host } = new URL(vid);
                    return ['youtube.com', 'www.youtube.com'].includes(host);
                  } catch {
                    return false;
                  }
                })() ? (
                  <div
                    key={i}
                    className="aspect-video w-full overflow-hidden rounded-xl border-2 border-sky-200 shadow dark:border-sky-800"
                  >
                    <iframe
                      src={vid}
                      title={`update-video-${i}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>
                ) : (
                  <video
                    key={i}
                    src={vid}
                    controls
                    className="aspect-video w-full rounded-xl border-2 border-sky-200 shadow dark:border-sky-800"
                  />
                ),
              )}
            </div>
          </div>
        )}
        <div className="mb-2 mt-2 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Thank you for your patience. <span className="ml-1">🚀</span>
          </span>
        </div>
        <div className="mt-4 flex w-full justify-center gap-2">
          <button
            className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-sky-700 dark:bg-sky-500 dark:text-slate-900 dark:hover:bg-sky-400"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          <button
            className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-sky-700 shadow transition hover:bg-gray-300 dark:bg-slate-700 dark:text-sky-300 dark:hover:bg-slate-600"
            onClick={async () => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              await fetchInfo();
            }}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}
