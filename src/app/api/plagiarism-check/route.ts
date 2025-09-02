import { NextRequest, NextResponse } from 'next/server';

const CONFIG_FILES = [
  'next.config.js',
  'next-env.d.ts',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'prettier.config.js',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'vite.config.js',
  'vite.config.ts',
  'webpack.config.js',
  'babel.config.js',
  'jest.config.js',
  'cypress.config.js',
  'playwright.config.js',
  'eslint.config.js',
  'eslintrc.js',
  'commitlint.config.js',
  'prisma/schema.prisma',
  'prisma/migrations',
  'README.md',
  'LICENSE.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'public/robots.txt',
  'public/site.webmanifest',
  'public/favicon.ico',
  'public/logo.png',
];

export async function POST(req: NextRequest) {
  const { repoUrl, startIdx = 0 } = await req.json();
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) return NextResponse.json({ error: 'Invalid GitHub repo URL' }, { status: 400 });
  const [_, owner, repo] = match;

  const GITHUB_PAT = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    ...(GITHUB_PAT && { Authorization: `Bearer ${GITHUB_PAT}` }),
  };

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers },
  );
  if (!treeRes.ok)
    return NextResponse.json({ error: 'Failed to fetch file list.' }, { status: 500 });
  const { tree } = await treeRes.json();

  const seenFiles = new Set();
  const codeFiles = tree.filter(
    (f: any) =>
      f.type === 'blob' &&
      /\.(js|ts|py|java|cpp|c|cs|rb|php|rs|swift|kt|m|scala|sh|pl|rb|dart|jsx|tsx)$/i.test(
        f.path,
      ) &&
      !CONFIG_FILES.some((cfg) => f.path.endsWith(cfg)) &&
      !/components[\\\/]ui[\\\/]/i.test(f.path) &&
      !/node_modules[\\\/]/i.test(f.path) &&
      !seenFiles.has(f.path) &&
      seenFiles.add(f.path),
  );

  const results: any[] = [];
  let checked = 0;
  let idx = startIdx;
  let attempts = 0;
  while (checked < 5 && idx < codeFiles.length && attempts < 50) {
    const file = codeFiles[idx++];
    attempts++;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`;
    const fileRes = await fetch(rawUrl);
    if (!fileRes.ok) continue;
    const content = await fileRes.text();
    let snippet = content.trim();
    let searchSnippet = '';
    const lines = snippet
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    searchSnippet =
      lines.find(
        (l) =>
          l &&
          !l.startsWith('//') &&
          !l.startsWith('/*') &&
          !l.startsWith('*') &&
          !l.startsWith('import') &&
          !l.startsWith('export') &&
          l.length > 10,
      ) ||
      lines[0] ||
      '';
    if (searchSnippet.length > 100) searchSnippet = searchSnippet.slice(0, 100);
    if (!searchSnippet && snippet.length > 0) searchSnippet = snippet.slice(0, 50);
    if (!searchSnippet) continue;

    let searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(searchSnippet)}+in:file`;
    let searchRes = await fetch(searchUrl, { headers });
    if (searchRes.status === 403) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached or access denied.' },
        { status: 429 },
      );
    }
    if (searchRes.status === 422 && searchSnippet.length > 30) {
      searchSnippet = searchSnippet.slice(0, 30);
      searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(searchSnippet)}+in:file`;
      searchRes = await fetch(searchUrl, { headers });
      if (searchRes.status === 403) {
        return NextResponse.json(
          { error: 'GitHub API rate limit reached or access denied.' },
          { status: 429 },
        );
      }
    }
    if (!searchRes.ok) continue;
    const searchData = await searchRes.json();
    const uniqueMatches: any[] = [];
    const seen = new Set();
    for (const item of searchData.items || []) {
      const key = item.repository.full_name + '/' + item.path;
      if (
        item.repository.full_name !== `${owner}/${repo}` &&
        item.repository.owner.login !== owner &&
        !seen.has(key)
      ) {
        uniqueMatches.push({
          repo: item.repository.full_name,
          path: item.path,
          html_url: item.html_url,
          user: item.repository.owner.login,
          avatar_url: item.repository.owner.avatar_url,
          user_url: item.repository.owner.html_url,
        });
        seen.add(key);
        if (uniqueMatches.length >= 5) break;
      }
    }
    results.push({
      file: file.path,
      snippet: searchSnippet,
      matches: uniqueMatches,
    });
    checked++;
    await new Promise((r) => setTimeout(r, 800));
  }
  return NextResponse.json({ results });
}
