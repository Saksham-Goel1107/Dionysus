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
    <div className="w-full h-72 relative">
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
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-white/80 dark:bg-gray-900/80 z-10">
          No functions detected in analyzed files.
        </div>
      )}
      <div className="text-xs text-center mt-2">Functions per file</div>
    </div>
  );
};
export default FunctionBarChart;
