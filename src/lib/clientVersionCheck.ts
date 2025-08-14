export default async function checkAndSyncClientVersions() {
  try {
    const res = await fetch('/client-version.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { localStorageVersion, cookieVersion } = await res.json();

    const clientLSVersion = localStorage.getItem('localStorageVersion');
    if (!clientLSVersion) {
      localStorage.setItem('localStorageVersion', String(localStorageVersion));
    } else if (Number(clientLSVersion) !== localStorageVersion) {
      localStorage.clear();
      localStorage.setItem('localStorageVersion', String(localStorageVersion));
    }

    const cookieMatch = document.cookie.match(/(?:^|; )cookieVersion=(\d+)/);
    const clientCookieVersion = cookieMatch ? Number(cookieMatch[1]) : null;
    if (clientCookieVersion === null) {
      document.cookie = `cookieVersion=${cookieVersion};path=/;SameSite=Lax`;
    } else if (clientCookieVersion !== cookieVersion) {
      document.cookie.split(';').forEach((c) => {
        const eq = c.indexOf('=');
        const name = eq > -1 ? c.substr(0, eq).trim() : c.trim();
        if (name) document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      });
      document.cookie = `cookieVersion=${cookieVersion};path=/;SameSite=Lax`;
    }
  } catch (e) {
    console.error('Version check failed', e);
  }
}

import { useEffect } from 'react';
export function useClientVersionCheck() {
  useEffect(() => {
    checkAndSyncClientVersions();
  }, []);
}
