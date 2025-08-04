'use client';
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';
import { notFound } from 'next/navigation';

export default function Home() {
  const { isLoading, error, data, getData } = useVisitorData(
    { extendedResult: true },
    { immediate: true },
  );

  if (process.env.NODE_ENV === 'production') return notFound();

  return (
    <div>
      <button onClick={() => getData({ ignoreCache: true })}>Reload data</button>
      <p>VisitorId: {isLoading ? 'Loading...' : data?.visitorId}</p>
      <p>Full visitor data:</p>
      <pre>{error ? error.message : JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
