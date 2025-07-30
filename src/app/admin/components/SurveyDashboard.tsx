'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

// Color palette for charts
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#A569BD',
  '#5DADE2',
  '#48C9B0',
  '#F4D03F',
];

type SurveyResponse = {
  id: string | number;
  user: {
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    isPro?: boolean;
  };
  role?: string;
  industry?: string;
  teamSize?: string;
  primaryGoal?: string;
  interestedFeatures?: string | string[];
  createdAt: string | Date;
};

type DistributionItem = {
  _count: number;
  role?: string;
  industry?: string;
  teamSize?: string;
  primaryGoal?: string;
};

type SurveyDashboardProps = {
  surveyResponses: SurveyResponse[];
  roleDistribution: DistributionItem[];
  industryDistribution: DistributionItem[];
  teamSizeDistribution: DistributionItem[];
  goalDistribution: DistributionItem[];
  featureInterest: Record<string, number>;
  completionRate: number;
  totalResponses: number;
};

export default function SurveyDashboard({
  surveyResponses,
  roleDistribution,
  industryDistribution,
  teamSizeDistribution,
  goalDistribution,
  featureInterest,
  completionRate,
  totalResponses,
}: SurveyDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Prepare chart data
  const roleData = roleDistribution.map((item) => ({
    name: item.role || 'Not specified',
    value: item._count,
  }));

  const industryData = industryDistribution.map((item) => ({
    name: item.industry || 'Not specified',
    value: item._count,
  }));

  const teamSizeData = teamSizeDistribution.map((item) => ({
    name: item.teamSize || 'Not specified',
    value: item._count,
  }));

  const goalData = goalDistribution.map((item) => ({
    name: item.primaryGoal || 'Not specified',
    value: item._count,
  }));

  // Convert feature interest object to array for chart
  const featureData = useMemo(() => {
    return Object.entries(featureInterest)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [featureInterest]);

  // Filter survey responses based on search
  const filteredResponses = useMemo(() => {
    if (!searchTerm) return surveyResponses;

    return surveyResponses.filter((survey) => {
      const fullName = `${survey.user.firstName || ''} ${survey.user.lastName || ''}`.toLowerCase();
      const email = (survey.user.emailAddress || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        (survey.role || '').toLowerCase().includes(searchLower) ||
        (survey.industry || '').toLowerCase().includes(searchLower)
      );
    });
  }, [surveyResponses, searchTerm]);

  return (
    <div className="flex flex-col space-y-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">User Survey Dashboard</h1>
      <p className="text-muted-foreground">
        Detailed analysis of user survey responses. Total responses: {totalResponses}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Survey Completion Rate</CardTitle>
          <CardDescription>
            Percentage of users who have completed the onboarding survey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={completionRate} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completionRate.toFixed(1)}% Complete</span>
              <span>{totalResponses} Responses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="charts">
        <TabsList className="mb-4">
          <TabsTrigger value="charts">Visual Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Roles</CardTitle>
                <CardDescription>Distribution of user roles</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Industry Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Industries</CardTitle>
                <CardDescription>Distribution of user industries</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={industryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {industryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Team Size Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Company Size</CardTitle>
                <CardDescription>Size of users&apos; companies</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamSizeData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Count" fill="#8884d8">
                      {teamSizeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Primary Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Purposes</CardTitle>
                <CardDescription>What users want to achieve</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" name="Count" fill="#8884d8">
                      {goalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Interest */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Expected Features</CardTitle>
                <CardDescription>Features users are most interested in</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureData.slice(0, 10)}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Interest Count" fill="#8884d8">
                      {featureData.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Individual Survey Responses</CardTitle>
              <CardDescription>Detailed view of all survey responses</CardDescription>
              <div className="mt-2">
                <Input
                  placeholder="Search by name, email, role, or industry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Company Size</TableHead>
                      <TableHead>Usage Purpose</TableHead>
                      <TableHead>Expected Features</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No survey responses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResponses.map((survey) => (
                        <TableRow key={survey.id}>
                          <TableCell className="font-medium">
                            <div>
                              {survey.user.firstName} {survey.user.lastName}
                              {survey.user.isPro && (
                                <Badge className="ml-2 bg-green-600">PRO</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {survey.user.emailAddress}
                            </div>
                          </TableCell>
                          <TableCell>{survey.role || 'Not specified'}</TableCell>
                          <TableCell>{survey.industry || 'Not specified'}</TableCell>
                          <TableCell>{survey.teamSize || 'Not specified'}</TableCell>
                          <TableCell>{survey.primaryGoal || 'Not specified'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(survey.interestedFeatures) ? (
                                survey.interestedFeatures.map((feature, i) => (
                                  <Badge key={i} variant="outline">
                                    {feature}
                                  </Badge>
                                ))
                              ) : typeof survey.interestedFeatures === 'string' &&
                                survey.interestedFeatures ? (
                                <Badge variant="outline">{survey.interestedFeatures}</Badge>
                              ) : (
                                'None specified'
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(survey.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
