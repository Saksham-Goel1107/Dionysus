'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Home, FileBarChart } from 'lucide-react';

export default function SurveyHeader() {
  return (
    <div className="border-b bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Admin Dashboard</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-medium">Survey Analytics</h1>
            <p className="text-sm text-muted-foreground">
              User onboarding survey responses and analytics
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" />
              Admin Home
            </Button>
          </Link>
          <Link href="/admin/surveys/export" passHref>
            <Button size="sm">
              <FileBarChart className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
