'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Folder, MessageSquare, Video } from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsDashboardProps {
  userStats: {
    total: number;
    pro: number;
  };
  projectStats: {
    total: number;
    active: number;
  };
  questionStats: {
    total: number;
  };
  meetingStats: {
    total: number;
    completed: number;
    processing: number;
  };
  dailyQuestionActivity: any[];
  projectGrowth: any[];
  topProjectsByEmbeddings: any[];
}

export default function AnalyticsDashboard({
  userStats,
  projectStats,
  questionStats,
  meetingStats,
  dailyQuestionActivity,
  projectGrowth,
  topProjectsByEmbeddings,
}: AnalyticsDashboardProps) {
  // Format daily activity data for chart
  const formattedDailyActivity =
    dailyQuestionActivity?.map((data: any) => ({
      day: format(new Date(data.day), 'MMM dd'),
      questions: Number(data.count),
    })) || [];

  // Format project growth data
  const formattedProjectGrowth =
    projectGrowth?.map((data: any) => ({
      month: format(new Date(data.month), 'MMM yyyy'),
      projects: Number(data.count),
    })) || [];

  // Format top projects data
  const formattedTopProjects =
    topProjectsByEmbeddings?.map((project: any) => ({
      name: project.name,
      embeddings: project._count.sourceCodeEmbeddings,
    })) || [];

  // Pie chart data for meeting status
  const meetingStatusData = [
    { name: 'Completed', value: meetingStats.completed, color: '#10b981' },
    { name: 'Processing', value: meetingStats.processing, color: '#3b82f6' },
  ];

  // Calculate user engagement rate (questions per user)
  const engagementRate =
    userStats.total > 0 ? (questionStats.total / userStats.total).toFixed(1) : '0';

  // Calculate pro user percentage
  const proUserPercentage = userStats.total > 0 ? (userStats.pro / userStats.total) * 100 : 0;

  // Calculate active project percentage
  const activeProjectPercentage =
    projectStats.total > 0 ? (projectStats.active / projectStats.total) * 100 : 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Detailed insights into platform usage and activity
          </p>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Users size={20} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Users</span>
              </div>
              <div className="text-2xl font-bold">{userStats.total}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Pro Users</span>
                <span className="text-xs font-medium">{userStats.pro}</span>
              </div>
              <Progress value={proUserPercentage} className="mt-1 h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <Folder size={20} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Projects</span>
              </div>
              <div className="text-2xl font-bold">{projectStats.total}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Active</span>
                <span className="text-xs font-medium">{projectStats.active}</span>
              </div>
              <Progress value={activeProjectPercentage} className="mt-1 h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <MessageSquare size={20} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Questions</span>
              </div>
              <div className="text-2xl font-bold">{questionStats.total}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Per User</span>
                <span className="text-xs font-medium">{engagementRate}</span>
              </div>
              <div className="mt-1 h-1"></div> {/* Placeholder for alignment */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Video size={20} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Meetings</span>
              </div>
              <div className="text-2xl font-bold">{meetingStats.total}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
                <span className="text-xs font-medium">{meetingStats.completed}</span>
              </div>
              <Progress
                value={
                  meetingStats.total > 0 ? (meetingStats.completed / meetingStats.total) * 100 : 0
                }
                className="mt-1 h-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Daily Question Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Question Activity</CardTitle>
            <CardDescription>Questions asked per day (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedDailyActivity}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#888"
                    opacity={0.2}
                    vertical={false}
                  />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow:
                        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="questions"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQuestions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Growth Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Project Growth</CardTitle>
            <CardDescription>Projects created over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedProjectGrowth}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#888"
                    opacity={0.2}
                    vertical={false}
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow:
                        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="projects"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Meeting Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Status</CardTitle>
            <CardDescription>Distribution of meeting statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center">
              {meetingStats.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meetingStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {meetingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [value, 'Meetings']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500">No meeting data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Projects by Embeddings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Projects by Embeddings</CardTitle>
            <CardDescription>Projects with the most indexed files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {formattedTopProjects.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formattedTopProjects}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#888"
                      opacity={0.2}
                    />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value) => [value, 'Embeddings']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                    />
                    <Bar dataKey="embeddings" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-gray-500">
                  No project embedding data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
