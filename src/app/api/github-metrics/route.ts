import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  if (!owner || !repo) {
    return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const [repoRes, prsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open`, { headers }),
    ]);
    if (!repoRes.ok || !prsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch repo data' }, { status: 500 });
    }
    const repoData = await repoRes.json();
    const prs = await prsRes.json();
    return NextResponse.json({
      size: repoData.size ?? 0,
      openIssues: (repoData.open_issues_count ?? 0) - (Array.isArray(prs) ? prs.length : 0),
      openPRs: Array.isArray(prs) ? prs.length : 0,
      forks: repoData.forks_count ?? 0,
      stars: repoData.stargazers_count ?? 0,
      watchers: repoData.watchers_count ?? 0,
    });
  } catch (e) {
    console.error('Error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
