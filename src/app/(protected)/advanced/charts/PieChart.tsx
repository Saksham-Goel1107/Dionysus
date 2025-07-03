'use client';
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#A28CF6',
  '#FF6699',
  '#FF4444',
  '#00B8D9',
];

const PieChartComponent = ({ analytics }: { analytics: any[] }) => {
  // Example: show distribution of functions per file
  const data = analytics
    .map((a) => ({
      name: a.path.split('/').pop(),
      functions: a.functions?.length || 0,
    }))
    .filter((d) => d.functions > 0);
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="functions"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={60}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-xs text-center mt-2">Functions per file</div>
    </div>
  );
};
export default PieChartComponent;
