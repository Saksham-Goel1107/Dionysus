'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

const QualityBarChart = ({ quality }: { quality: { path: string; issues: string[] }[] }) => {
  // Count number of issues per file
  const data = quality.map((q) => ({
    name: q.path.split('/').pop(),
    issues: q.issues.length,
  }));
  if (!data.length) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded bg-white/80 text-sm text-gray-400 dark:bg-gray-900/80">
        No quality issues detected in analyzed files.
      </div>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="issues" fill="#e53e3e" name="Quality Issues" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center text-xs">Quality Issues per file</div>
    </div>
  );
};
export default QualityBarChart;
