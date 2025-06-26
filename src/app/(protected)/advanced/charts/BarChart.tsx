"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const BarChartComponent = ({ analytics }: { analytics: any[] }) => {
  // Example: show cyclomatic complexity per file
  const data = analytics.map(a => ({
    name: a.path.split("/").pop(),
    complexity: a.aggregate?.cyclomatic || 0,
    sloc: typeof a.aggregate?.sloc === 'object' ? (a.aggregate.sloc.logical || 0) : (a.aggregate?.sloc || 0),
  }));
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="complexity" fill="#8884d8" name="Cyclomatic" />
          <Bar dataKey="sloc" fill="#82ca9d" name="SLOC" />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-center mt-2">Cyclomatic Complexity & SLOC per file</div>
    </div>
  );
};
export default BarChartComponent;
