import { NextRequest, NextResponse } from "next/server";

// Helper to extract owner/repo from GitHub URL
function parseRepoUrl(repoUrl: string) {
  const match = repoUrl.match(/github.com\/(.+?)\/(.+?)(?:\.|\/|$)/);
  if (!match || !match[1] || !match[2]) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repoUrl = searchParams.get("repoUrl");
  if (!repoUrl) {
    return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });
  }
  const repo = parseRepoUrl(repoUrl);
  if (!repo) {
    return NextResponse.json({ error: "Invalid GitHub repo URL" }, { status: 400 });
  }

  // Helper for GitHub fetch with auth
  const ghFetch = (url: string) => fetch(url, {
    headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : undefined,
  });

  // Get latest commit SHA
  const commitsRes = await ghFetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/commits?per_page=1`);
  if (!commitsRes.ok) {
    const err = await commitsRes.text();
    return NextResponse.json({ error: `Failed to fetch commits: ${err}` }, { status: 500 });
  }
  const commits = await commitsRes.json();
  const latestCommit = commits[0]?.sha;
  if (!latestCommit) {
    return NextResponse.json({ error: "No commits found" }, { status: 404 });
  }

  // Get repo tree (list of files)
  const treeRes = await ghFetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/git/trees/${latestCommit}?recursive=1`);
  if (!treeRes.ok) {
    const err = await treeRes.text();
    return NextResponse.json({ error: `Failed to fetch repo tree: ${err}` }, { status: 500 });
  }
  const tree = await treeRes.json();
  const files = tree.tree.filter((f: any) => f.type === "blob" && (f.path.endsWith(".js") || f.path.endsWith(".ts")));

  // Fetch file contents (limit to 10 files for demo)
  const fileContents = await Promise.all(
    files.slice(0, 10).map(async (file: any) => {
      const fileRes = await fetch(`https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${latestCommit}/${file.path}`);
      if (!fileRes.ok) return null;
      const content = await fileRes.text();
      return { path: file.path, content };
    })
  );

  // Use typhonjs-escomplex for complexity analysis (JS/TS only)
  let escomplex: any;
  // @ts-ignore
  try {
    escomplex = (await import("typhonjs-escomplex")).default;
  } catch (e) {
    return NextResponse.json({ error: "typhonjs-escomplex not installed or failed to import" }, { status: 500 });
  }
  const validFiles = fileContents.filter(Boolean);
  if (!validFiles.length) {
    return NextResponse.json({ error: "No valid JS/TS files found in repo." }, { status: 404 });
  }
  // Enhanced: count exported functions, class methods, and top-level function expressions as functions
  const metrics = validFiles.map(f => {
    const analysis = escomplex.analyzeModule(f!.content);
    // Count exported functions (simple regex, not perfect)
    const exportFuncMatches = f!.content.match(/export function [a-zA-Z0-9_]+/g) || [];
    // Count top-level function expressions (simple regex)
    const funcExprMatches = f!.content.match(/const [a-zA-Z0-9_]+ = (async )?\(?[a-zA-Z0-9_, ]*\)? ?=>/g) || [];
    // Count class methods (simple regex)
    const classMethodMatches = f!.content.match(/\n\s*[a-zA-Z0-9_]+\([^)]*\) ?\{/g) || [];
    // Combine all detected functions into a single array for frontend
    const allFunctions = [
      ...(analysis.functions || []),
      ...exportFuncMatches.map((m: string) => ({ type: 'exported', signature: m })),
      ...funcExprMatches.map((m: string) => ({ type: 'arrow', signature: m })),
      ...classMethodMatches.map((m: string) => ({ type: 'classMethod', signature: m })),
    ];
    return {
      path: f!.path,
      aggregate: analysis.aggregate,
      functions: allFunctions, // unified function array
      dependencies: analysis.dependencies,
      totalFunctions: allFunctions.length,
    };
  });

  return NextResponse.json({
    analytics: metrics,
    commit: latestCommit,
    repo: {
      owner: repo.owner,
      name: repo.repo,
      url: repoUrl,
      latestCommit,
      fileCount: files.length,
      analyzedFiles: metrics.map(m => m.path),
    },
  });
}
