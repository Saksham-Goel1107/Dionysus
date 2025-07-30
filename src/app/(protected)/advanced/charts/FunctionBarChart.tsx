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

const FunctionBarChart = ({ analytics }: { analytics: any[] }) => {
  const data = analytics.map((a) => ({
    name: a.path.split('/').pop(),
    functions: a.functions?.length || 0,
  }));
  const allZero = data.every((d) => d.functions === 0);
  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="functions" fill="#f59e42" name="Functions" />
        </BarChart>
      </ResponsiveContainer>
      {allZero && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm text-gray-400 dark:bg-gray-900/80">
          No functions detected in analyzed files.
        </div>
      )}
      <div className="mt-2 text-center text-xs">Functions per file</div>
    </div>
  );
};
export default FunctionBarChart;
