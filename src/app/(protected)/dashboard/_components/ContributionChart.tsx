'use client';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type Props = {};

const COLORS = [
  '#FF6384', // Pink
  '#36A2EB', // Blue
  '#FFCE56', // Yellow
  '#4BC0C0', // Teal
  '#9966FF', // Purple
  '#FF9F40', // Orange
  '#8CD47E', // Green
  '#EA526F', // Salmon
  '#23B5D3', // Cyan
  '#A17DF9', // Lavender
];

const CustomLegend = ({ payload, contributionData }: any) => {
  const { resolvedTheme } = useTheme();

  if (!payload || !contributionData) return null;

  const getGridCols = () => {
    if (contributionData.length <= 3) return 'grid-cols-1 md:grid-cols-3';
    if (contributionData.length <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (contributionData.length <= 12) return 'grid-cols-2 md:grid-cols-4';
    return 'grid-cols-3 md:grid-cols-6';
  };
  return (
    <div className={`grid ${getGridCols()} max-h-[200px] gap-2 overflow-y-auto p-2 pt-4`}>
      {payload?.map((entry: any, index: number) => {
        if (!entry || !entry.value) return null;

        const contributor = contributionData?.find((item: any) => item?.name === entry.value);
        if (!contributor) return null;

        const isGithubUsername = contributor.name.match(/^[a-zA-Z0-9](?:-?[a-zA-Z0-9])*$/);

        return (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 rounded-md p-1.5 transition-colors"
            style={{
              backgroundColor:
                resolvedTheme === 'dark' ? 'rgba(31, 41, 55, 0.4)' : 'rgba(255, 255, 255, 0.8)',
              boxShadow: `0 0 0 1px ${entry.color}40, 0 1px 3px 0 ${entry.color}30`,
              borderLeft: `3px solid ${entry.color}`,
            }}
          >
            <div
              className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border border-gray-200"
              style={{ boxShadow: `0 0 0 1px ${entry.color}` }}
            >
              {isGithubUsername ? (
                <a
                  href={`https://github.com/${contributor.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    width={24}
                    height={24}
                    src={contributor.avatar}
                    alt={contributor.name}
                    className="h-full w-full object-cover"
                  />
                </a>
              ) : (
                <Image
                  width={24}
                  height={24}
                  src={contributor.avatar}
                  alt={contributor.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="max-w-[120px] truncate font-medium" title={contributor.name}>
                {contributor.name.length > 15
                  ? `${contributor.name.substring(0, 15)}...`
                  : contributor.name}
              </span>
              <span className="text-xs text-muted-foreground">{contributor.value} commits</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CenterLabel = ({ totalCommits }: { totalCommits: number }) => {
  return (
    <text
      x="50%"
      y="45%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-current font-medium text-muted-foreground"
      style={{ fontSize: '14px' }}
    >
      {totalCommits} total commits
    </text>
  );
};

const ContributionChart = ({}: Props) => {
  const { projectId } = useProject();
  const { data: commits, isLoading: isCommitsLoading } = api.project.getCommits.useQuery({
    projectId,
  });
  const { resolvedTheme } = useTheme();
  const contributionData = useMemo(() => {
    if (!commits) return [];

    const normalizedCommits = commits.map((commit) => {
      if (commit.commitAuthorUsername) {
        return {
          ...commit,
          normalizedAuthor: commit.commitAuthorUsername,
        };
      }

      return {
        ...commit,
        normalizedAuthor: commit.commitAuthorName,
      };
    });

    const authorCommits = normalizedCommits.reduce(
      (acc, commit) => {
        const username = commit.normalizedAuthor;
        if (!acc[username]) {
          acc[username] = {
            name: username,
            value: 0,
            avatar: commit.commitAuthorAvatar,
          };
        }
        acc[username].value += 1;
        return acc;
      },
      {} as Record<string, { name: string; value: number; avatar: string }>,
    );

    return Object.values(authorCommits).sort((a, b) => b.value - a.value);
  }, [commits]);

  const totalCommits = useMemo(() => {
    return commits ? commits.length : 0;
  }, [commits]);

  if (isCommitsLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-300" />
        <span className="ml-3 text-sm text-gray-500 dark:text-gray-300">Loading commits...</span>
      </div>
    );
  }

  if (!commits || commits.length === 0) {
    return <div className="py-10 text-center">No commits data available</div>;
  }
  return (
    <div className="flex h-[500px] w-full justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Pie
            data={contributionData}
            cx="50%"
            cy="40%"
            innerRadius={80}
            outerRadius={130}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {contributionData?.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={1}
                stroke={resolvedTheme === 'dark' ? '#1f2937' : '#ffffff'}
              />
            ))}
          </Pie>

          {typeof totalCommits === 'number' && <CenterLabel totalCommits={totalCommits} />}

          <Tooltip
            formatter={(value, name) => [
              `${value} commits (${Math.round((Number(value) / (totalCommits || 1)) * 100)}%)`,
              `${name}`,
            ]}
            contentStyle={{
              backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
              borderColor: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              color: resolvedTheme === 'dark' ? '#fff' : '#111',
            }}
            labelStyle={{
              color: resolvedTheme === 'dark' ? '#fff' : '#111',
            }}
            itemStyle={{
              color: resolvedTheme === 'dark' ? '#fff' : '#111',
            }}
          />
          <text
            x="50%"
            y={contributionData.length > 4 ? '75%' : '70%'}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-current font-bold text-foreground"
            style={{ fontSize: '24px' }}
          >
            Contributors
          </text>

          <Legend
            content={<CustomLegend contributionData={contributionData} />}
            verticalAlign="bottom"
            layout="horizontal"
            height={contributionData.length > 8 ? 180 : contributionData.length > 4 ? 120 : 80}
            wrapperStyle={{ paddingTop: 10 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ContributionChart;
