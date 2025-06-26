"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const QualityBarChart = ({ quality }: { quality: { path: string; issues: string[] }[] }) => {
  // Count number of issues per file
  const data = quality.map(q => ({
    name: q.path.split("/").pop(),
    issues: q.issues.length,
  }));
  if (!data.length) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-gray-400 text-sm bg-white/80 dark:bg-gray-900/80 rounded">
        No quality issues detected in analyzed files.
      </div>
    );
  }
  return (
    <div className="w-full h-72">
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
      <div className="text-xs text-center mt-2">Quality Issues per file</div>
    </div>
  );
};
export default QualityBarChart;
