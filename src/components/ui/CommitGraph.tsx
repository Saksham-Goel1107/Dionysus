import React, { useEffect, useState } from "react";
import useProject from "@/hooks/use-project";

interface CommitNode {
  sha: string;
  message: string;
  parents: string[];
  author: string;
  date: string;
  avatarUrl?: string;
}

const branchColors = [
  "#3b82f6", "#10b981", "#f59e42", "#f43f5e", "#a78bfa", "#fbbf24", "#6366f1", "#14b8a6", "#eab308", "#ef4444"
];

function shortSha(sha: string) {
  return sha.slice(0, 7);
}

async function fetchCommits(githubUrl: string): Promise<CommitNode[]> {
  try {
    const match = githubUrl.match(/github.com[/:]([\w-]+)\/([\w.-]+)/);
    if (!match) return [];
    const owner = match[1];
    const repo = match[2]?.replace(/\.git$/, "");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`;
    const res = await fetch(apiUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message,
      parents: c.parents.map((p: any) => p.sha),
      author: c.commit.author.name,
      date: c.commit.author.date,
      avatarUrl: c.author?.avatar_url,
    }));
  } catch {
    return [];
  }
}

const CommitGraph: React.FC = () => {
  const { project } = useProject();
  const [commits, setCommits] = useState<CommitNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project?.githubUrl) {
      setLoading(true);
      fetchCommits(project.githubUrl).then((data) => {
        setCommits(data);
        setLoading(false);
      });
    }
  }, [project]);

  const rowHeight = 56;
  const dotRadius = 10;
  const colWidth = 36;
  const leftPad = 60;
  const shaPad = 24;
  const msgPad = 260;
  const authorPad = 700;

  const branchAssignments: Record<string, number> = {};
  let nextBranch = 0;
  const activeBranches: string[] = [];
  const commitPositions: { x: number; y: number }[] = [];

  commits.forEach((commit, i) => {
    let col = -1;
    for (let j = 0; j < activeBranches.length; j++) {
      if (activeBranches[j] === commit.sha) {
        col = j;
        break;
      }
    }
    if (col === -1) {
      col = nextBranch++;
      activeBranches.push(commit.sha);
    }
    branchAssignments[commit.sha] = col;
    commitPositions[i] = { x: leftPad + col * colWidth, y: i * rowHeight + rowHeight / 2 + 10 };
    activeBranches[col] = commit.parents[0] || "";
    for (let p = 1; p < commit.parents.length; p++) {
      activeBranches.push(commit.parents[p] || '');
    }
  });

   const branchBadges: Record<string, string[]> = {};
  if (commits.length && commits[0]) {
    branchBadges[commits[0].sha] = ['main'];
    const lastCommit = commits[commits.length - 1];
    if (lastCommit && lastCommit.sha) {
      branchBadges[lastCommit.sha] = ['v1.0.0'];
    }
  }

  return (
    <div
      className="relative max-h-[420px] min-h-[180px] overflow-y-auto overflow-x-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-[#181a20] dark:via-[#23272f] dark:to-[#181a20] rounded-xl shadow-inner border border-blue-100 dark:border-blue-800 p-2"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #e0e7ff' }}
    >
      {loading ? (
        <p className="text-gray-400 dark:text-gray-500 animate-pulse">Loading commit graph...</p>
      ) : (
        <svg width={900} height={commits.length * rowHeight + 20} style={{ display: 'block', margin: '0 auto' }}>
          {commits.map((commit, i) => {
            const pos = commitPositions[i];
            if (!pos) return null;
            const { x, y } = pos;
            return commit.parents.map((parentSha, pIdx) => {
              const parentIdx = commits.findIndex((c) => c.sha === parentSha);
              if (parentIdx === -1) return null;
              const parentPos = commitPositions[parentIdx];
              if (!parentPos) return null;
              const { x: px, y: py } = parentPos;
              const branchIndex = branchAssignments[commit.sha] ?? 0;
              const color = branchColors[(branchIndex + pIdx) % branchColors.length];
              return (
                <line
                  key={commit.sha + '-' + parentSha}
                  x1={x}
                  y1={y}
                  x2={px}
                  y2={py}
                  stroke={color}
                  strokeWidth={3}
                  opacity={0.85}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.10))' }}
                />
              );
            });
          })}
          {commits.map((commit, i) => {
            const pos = commitPositions[i];
            if (!pos) return null;
            const { y } = pos;
            return (
              <rect
                key={commit.sha + '-bg'}
                x={0}
                y={y - rowHeight / 2}
                width={880}
                height={rowHeight - 2}
                rx={12}
                fill="transparent"
                className="group-hover:fill-blue-50 dark:group-hover:fill-[#23272f] transition-colors duration-150"
              />
            );
          })}
          {commits.map((commit, i) => {
            const pos = commitPositions[i];
            if (!pos) return null;
            const { x, y } = pos;
            const color = branchColors[(branchAssignments[commit.sha] ?? 0) % branchColors.length];
            const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
            const textColor = isDark ? '#e0e7ff' : '#222';
            const shaColor = isDark ? '#a5b4fc' : '#6366f1';
            return (
              <g key={commit.sha} className="group" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}>
                <circle
                  cx={x}
                  cy={y}
                  r={dotRadius}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2.5}
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.10))' }}
                  className="group-hover:stroke-blue-400 group-hover:stroke-2 transition-all duration-150"
                />
                {branchBadges[commit.sha]?.map((badge, idx) => (
                  <g key={badge}>
                    <rect
                      x={x - 40 + idx * 60}
                      y={y - 18}
                      rx={6}
                      ry={6}
                      width={badge.startsWith('v') ? 48 : 38}
                      height={20}
                      fill={badge === 'main' ? '#6366f1' : '#f59e42'}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                    <text
                      x={x - 20 + idx * 60}
                      y={y - 5}
                      fontSize={12}
                      fontWeight="bold"
                      fill="#fff"
                      textAnchor="middle"
                    >
                      {badge}
                    </text>
                  </g>
                ))}
                <text x={x + shaPad} y={y + 4} fontSize={13} fontWeight="bold" fill={shaColor} style={{ textShadow: isDark ? '0 1px 2px #23272f' : '0 1px 2px #fff' }}>
                  {shortSha(commit.sha)}
                </text>
                <text x={msgPad} y={y + 4} fontSize={15} fontWeight={600} fill={textColor} style={{ textShadow: isDark ? '0 1px 2px #23272f' : '0 1px 2px #fff' }}>
                  {commit.message?.split("\n")?.[0]?.slice(0, 60) ?? ""}
                </text>
                <text x={authorPad} y={y + 4} fontSize={13} fill={isDark ? '#a3a3a3' : '#666'} textAnchor="end">
                  {commit.author}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {!loading && commits.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No commits found.</p>
      )}
    </div>
  );
};

export default CommitGraph;
