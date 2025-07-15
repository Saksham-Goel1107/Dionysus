'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';

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
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    // eslint-disable-next-line
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
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-sky-900 via-blue-800 to-sky-400 dark:from-gray-900 dark:via-gray-800 dark:to-sky-900 animate-gradient bg-[length:400%_400%]"
      style={{
        transition: 'background 0.3s',
      }}
    >
      <div className="max-w-2xl w-full flex flex-col items-center text-center p-8 rounded-3xl shadow-2xl border-4 border-sky-200 dark:border-sky-900 relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        {/* Banner or SVG */}
        {info?.banner ? (
          <Image
            width={900}
            height={400}
            src={info.banner}
            alt="Maintenance Banner"
            className="object-cover rounded-2xl mb-6 shadow-xl border-2 border-sky-200 dark:border-sky-800"
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
        <h1 className="text-4xl font-extrabold mb-2 text-sky-700 dark:text-sky-300 drop-shadow-xl tracking-tight">
          Dionysus is Leveling Up!
        </h1>
        <p className="text-gray-800 dark:text-gray-300 mb-6 text-lg font-medium max-w-xl mx-auto">
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
            <span className="uppercase text-xs font-bold text-sky-700 dark:text-sky-300 tracking-widest">
              Estimated Time Left
            </span>
            <span className="text-3xl font-mono font-bold text-sky-600 dark:text-sky-200 bg-sky-100 dark:bg-sky-900 px-6 py-2 rounded-xl shadow mt-2 animate-pulse">
              {timeLeft}
            </span>
          </div>
        )}
        {/* Features */}
        {info?.features && info.features.length > 0 && (
          <div className="mb-6 w-full">
            <span className="font-semibold text-sky-700 dark:text-sky-300 text-lg">
              What’s coming:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {info.features.map((f, i) => (
                <li
                  key={i}
                  className="bg-sky-50 dark:bg-sky-800/60 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow flex items-center gap-2"
                >
                  <span className="inline-block w-2 h-2 bg-sky-400 dark:bg-sky-300 rounded-full"></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Images Carousel */}
        {info?.images && info.images.length > 0 && (
          <div className="mb-6 w-full">
            <span className="font-semibold text-sky-700 dark:text-sky-300 text-lg">
              Sneak Peek:
            </span>
            <div className="flex gap-3 mt-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-sky-300 dark:scrollbar-thumb-sky-800">
              {info.images.map((img, i) => (
                <div key={i} className="min-w-[180px] max-w-[220px] flex-shrink-0">
                  <Image
                    width={220}
                    height={140}
                    src={img}
                    alt={`update-img-${i}`}
                    className="object-cover rounded-xl shadow border-2 border-sky-200 dark:border-sky-800"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Videos Section */}
        {info?.videos && info.videos.length > 0 && (
          <div className="mb-6 w-full">
            <span className="font-semibold text-sky-700 dark:text-sky-300 text-lg">
              Watch What’s New:
            </span>
            <div className="flex flex-col gap-4 mt-2">
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
                    className="aspect-video w-full rounded-xl overflow-hidden shadow border-2 border-sky-200 dark:border-sky-800"
                  >
                    <iframe
                      src={vid}
                      title={`update-video-${i}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <video
                    key={i}
                    src={vid}
                    controls
                    className="w-full rounded-xl shadow border-2 border-sky-200 dark:border-sky-800 aspect-video"
                  />
                ),
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2 items-center justify-center mb-2 mt-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Thank you for your patience. <span className="ml-1">🚀</span>
          </span>
        </div>
        <div className="flex gap-2 mt-4 w-full justify-center">
          <button
            className="px-4 py-2 rounded-lg bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-900 font-semibold shadow hover:bg-sky-700 dark:hover:bg-sky-400 transition"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-sky-700 dark:bg-slate-700 dark:text-sky-300 font-semibold shadow hover:bg-gray-300 dark:hover:bg-slate-600 transition"
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
