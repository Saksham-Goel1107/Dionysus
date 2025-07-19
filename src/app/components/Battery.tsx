'use client';
import { useEffect, useState } from 'react';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(
    type: 'chargingchange' | 'levelchange',
    listener: (this: BatteryManager, ev: Event) => any,
  ): void;
  removeEventListener(
    type: 'chargingchange' | 'levelchange',
    listener: (this: BatteryManager, ev: Event) => any,
  ): void;
}

export default function Battery() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  useEffect(() => {
    let battery: BatteryManager | null = null;
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: BatteryManager) => {
        battery = batt;
        setBatteryLevel(Math.round(batt.level * 100));
        setIsCharging(batt.charging);
        batt.addEventListener('levelchange', () => setBatteryLevel(Math.round(batt.level * 100)));
        batt.addEventListener('chargingchange', () => setIsCharging(batt.charging));
      });
    }
    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', () => {});
        battery.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  if (batteryLevel === null) return null;

  let fillColor = '#4ade80'; // green
  let borderColor = '#bbb';
  let bgColor = '#eee';
  let iconGlow = '';
  if (isCharging || batteryLevel > 80) {
    fillColor = '#4ade80';
    borderColor = '#22c55e';
    bgColor = '#e6fff2';
    iconGlow = 'drop-shadow(0 0 4px #22c55e)';
  } else if (batteryLevel < 30) {
    fillColor = '#ef4444'; // red
    borderColor = '#ef4444';
    bgColor = '#fee2e2';
    iconGlow = 'drop-shadow(0 0 4px #ef4444)';
  } else if (batteryLevel < 60) {
    fillColor = '#f59e42'; // orange
    borderColor = '#f59e42';
    bgColor = '#fff7ed';
    iconGlow = 'drop-shadow(0 0 2px #f59e42)';
  }

  const fillWidth = Math.max(0, Math.round(14 * (batteryLevel / 100)));

  return (
    <span
      title={isCharging ? 'Charging' : 'Battery'}
      className="flex items-center gap-2 px-2 py-1 rounded bg-white/70 dark:bg-black/40 shadow-sm border border-gray-200 dark:border-gray-700"
      style={{ minWidth: 60, maxWidth: 100 }}
    >
      <svg
        width="24"
        height="14"
        viewBox="0 0 24 14"
        fill="none"
        style={{ flexShrink: 0, filter: iconGlow }}
      >
        <rect
          x="1"
          y="2"
          width="18"
          height="10"
          rx="3"
          fill={bgColor}
          stroke={borderColor}
          strokeWidth="1.5"
        />
        <rect x="3" y="4" width={fillWidth} height="6" rx="2" fill={fillColor} />
        <rect x="20" y="5" width="3" height="4" rx="1" fill="#ccc" />
        {isCharging && <polygon points="12,4 8,10 13,10 11,13 16,7 11,7 12,4" fill="#f59e42" />}
      </svg>
      <span
        className={`font-semibold text-xs sm:text-sm ${isCharging || batteryLevel > 80 ? 'text-green-600 dark:text-green-400' : batteryLevel < 30 ? 'text-red-500' : batteryLevel < 60 ? 'text-orange-500' : 'text-gray-800 dark:text-gray-100'}`}
        style={{ minWidth: 28, textAlign: 'right' }}
      >
        {batteryLevel}%
      </span>
    </span>
  );
}
