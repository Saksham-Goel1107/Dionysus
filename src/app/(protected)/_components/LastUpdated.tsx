'use client';

import React, { useEffect, useState } from 'react';

const GITHUB_REPO = 'Saksham-Goel1107/Dionysus';

const LastUpdated: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLastCommit() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const date = data[0]?.commit?.committer?.date;
          if (date) setLastUpdated(new Date(date).toLocaleString());
        }
      } catch {
        setError('Could not fetch last update');
      } finally {
        setLoading(false);
      }
    }
    fetchLastCommit();
  }, []);

  if (loading) return <span className="text-xs text-gray-400">Fetching last update...</span>;
  if (error) return null;
  if (!lastUpdated) return null;
  return <span className="text-xs text-gray-400">Last updated: {lastUpdated}</span>;
};

export default LastUpdated;
