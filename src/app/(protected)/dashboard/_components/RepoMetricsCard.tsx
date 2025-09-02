'use client';
import { useEffect, useState } from 'react';

interface RepoMetrics {
  size: number;
  openIssues: number;
  openPRs: number;
  forks: number;
  stars: number;
  watchers: number;
}

interface LocMetrics {
  language: string;
  files: number;
  lines: number;
  blanks: number;
  comments: number;
  linesOfCode: number;
}

function getRepoInfoFromUrl(url: string) {
  const match = url.match(/github.com\/([^/]+)\/([^/?#]+)/);
  if (!match) return null;
  let repo = match[2] ?? '';
  if (repo.endsWith('.git')) repo = repo.slice(0, -4);
  return { owner: match[1], repo };
}

const RepoMetricsCard = ({ githubUrl }: { githubUrl: string }) => {
  const [metrics, setMetrics] = useState<RepoMetrics | null>(null);
  const [locMetrics, setLocMetrics] = useState<LocMetrics[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [showLoc, setShowLoc] = useState(false);

  useEffect(() => {
    const repo = getRepoInfoFromUrl(githubUrl);
    if (!repo) return;
    setLoading(true);

    fetch(
      `/api/github-metrics?owner=${encodeURIComponent(repo.owner ?? '')}&repo=${encodeURIComponent(repo.repo ?? '')}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || data.error) {
          setMetrics(null);
          setLoading(false);
          return;
        }
        setMetrics(data);
      })
      .catch(() => {
        setMetrics(null);
      })
      .finally(() => setLoading(false));
  }, [githubUrl]);

  useEffect(() => {
    const repo = getRepoInfoFromUrl(githubUrl);
    if (!repo) return;
    setLocLoading(true);
    fetch(`https://api.codetabs.com/v1/loc?github=${repo.owner}/${repo.repo}`)
      .then(async (r) => {
        if (r.status === 429 || !r.ok) throw new Error('fail');
        return r.json();
      })
      .then((data: LocMetrics[]) => {
        setLocMetrics(data);
      })
      .catch(() => {
        setLocMetrics(null);
      })
      .finally(() => setLocLoading(false));
  }, [githubUrl]);

  if (!githubUrl || loading || !metrics) return null;
  const totalRow = locMetrics?.find((row) => row.language === 'Total');

  return (
    <div className="mx-auto mb-2 mt-2 flex w-full max-w-2xl flex-col items-center justify-center">
      <div className="flex flex-wrap gap-x-2 gap-y-1 rounded border border-muted-foreground/10 bg-white/90 px-2 py-1 text-[11px] shadow dark:bg-black/80">
        <span>
          🔢 <b>{metrics.size}</b> KB
        </span>
        <span>
          🐞 <b>{metrics.openIssues}</b> Issues
        </span>
        <span>
          🔀 <b>{metrics.openPRs}</b> PRs
        </span>
        <span>
          🍴 <b>{metrics.forks}</b>
        </span>
        <span>
          ⭐ <b>{metrics.stars}</b>
        </span>
        <span>
          👀 <b>{metrics.watchers}</b>
        </span>
        {locMetrics && !locLoading && totalRow && (
          <span
            className="ml-2 cursor-pointer select-none rounded border border-purple-200 bg-purple-100 px-2 py-0.5 text-purple-800 transition hover:bg-purple-200 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800"
            title="Click to show/hide code metrics table"
            onClick={() => setShowLoc((v) => !v)}
          >
            🧮 <b>{totalRow.linesOfCode}</b> LOC, <b>{totalRow.files}</b> files,{' '}
            <b>{totalRow.comments}</b> comments, <b>{totalRow.blanks}</b> blanks
            <span className="ml-1 text-xs">[{showLoc ? 'Hide' : 'Show'}]</span>
          </span>
        )}
      </div>
      {showLoc && locMetrics && !locLoading && (
        <div className="mt-2 w-full">
          <div className="overflow-x-auto rounded border border-muted-foreground/10 bg-muted/40 p-2">
            <table className="min-w-full text-[11px]">
              <thead>
                <tr className="bg-muted/60">
                  <th className="px-2 py-1 text-left">Language</th>
                  <th className="px-2 py-1 text-center">Files</th>
                  <th className="px-2 py-1 text-center">Lines</th>
                  <th className="px-2 py-1 text-center">Blanks</th>
                  <th className="px-2 py-1 text-center">Comments</th>
                  <th className="px-2 py-1 text-center">LOC</th>
                </tr>
              </thead>
              <tbody>
                {locMetrics.map((row) => (
                  <tr
                    key={row.language}
                    className={row.language === 'Total' ? 'bg-muted/30 font-bold' : ''}
                  >
                    <td className="px-2 py-1">{row.language}</td>
                    <td className="px-2 py-1 text-center">{row.files}</td>
                    <td className="px-2 py-1 text-center">{row.lines}</td>
                    <td className="px-2 py-1 text-center">{row.blanks}</td>
                    <td className="px-2 py-1 text-center">{row.comments}</td>
                    <td className="px-2 py-1 text-center">{row.linesOfCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoMetricsCard;
