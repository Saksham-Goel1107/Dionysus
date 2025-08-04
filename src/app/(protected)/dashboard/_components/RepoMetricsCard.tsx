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

function getRepoInfoFromUrl(url: string) {
  const match = url.match(/github.com\/([^/]+)\/([^/?#]+)/);
  if (!match) return null;
  let repo = match[2] ?? '';
  if (repo.endsWith('.git')) repo = repo.slice(0, -4);
  return { owner: match[1], repo };
}

const RepoMetricsCard = ({ githubUrl }: { githubUrl: string }) => {
  const [metrics, setMetrics] = useState<RepoMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const repo = getRepoInfoFromUrl(githubUrl);
    if (!repo) return;
    setLoading(true);

    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    Promise.all([
      fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, { headers }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/pulls?state=open`, {
        headers,
      }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([repoData, prs]) => {
        if (!repoData || !prs) {
          setMetrics(null);
          setLoading(false);
          return;
        }
        setMetrics({
          size: repoData.size ?? 0, // in KB
          openIssues: (repoData.open_issues_count ?? 0) - (Array.isArray(prs) ? prs.length : 0),
          openPRs: Array.isArray(prs) ? prs.length : 0,
          forks: repoData.forks_count ?? 0,
          stars: repoData.stargazers_count ?? 0,
          watchers: repoData.watchers_count ?? 0,
        });
      })
      .catch(() => {
        setMetrics(null);
      })
      .finally(() => setLoading(false));
  }, [githubUrl]);

  if (!githubUrl || loading || !metrics) return null;

  return (
    <div className="mx-auto mb-2 mt-2 flex w-full max-w-2xl justify-center">
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
      </div>
    </div>
  );
};

export default RepoMetricsCard;
