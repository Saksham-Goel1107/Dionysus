import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ErrorTrackingDashboard from './ErrorTrackingDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  permalink: string;
  shortId: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
  level: string;
  isPublic: boolean;
  platform: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  metadata: {
    type: string;
    value: string;
    filename?: string;
  };
  stats?: {
    '24h': Array<[number, number]>;
  };
}

interface SentryProject {
  id: string;
  name: string;
  slug: string;
  platform: string;
  dateCreated: string;
  status: string;
}

async function fetchSentryData() {
  const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
  const SENTRY_ORG_SLUG = process.env.SENTRY_ORG_SLUG || 'saksham-vj';

  if (!SENTRY_AUTH_TOKEN) {
    return {
      issues: [],
      projects: [],
      error: 'Sentry authentication token not configured',
    };
  }

  const headers = {
    Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch project info first
    const projectsResponse = await fetch(
      `https://sentry.io/api/0/organizations/${SENTRY_ORG_SLUG}/projects/`,
      {
        headers,
        next: { revalidate: 0 },
      },
    );

    const projects: SentryProject[] = projectsResponse.ok ? await projectsResponse.json() : [];

    // Fetch issues from ALL projects (organization level)
    // Using organization endpoint to get all issues across all projects
    const allIssuesResponse = await fetch(
      `https://sentry.io/api/0/organizations/${SENTRY_ORG_SLUG}/issues/?statsPeriod=14d&query=`,
      {
        headers,
        next: { revalidate: 0 },
      },
    );

    let allIssues: SentryIssue[] = allIssuesResponse.ok ? await allIssuesResponse.json() : [];

    // If organization-level fetch fails, fallback to fetching from each project
    if (!allIssuesResponse.ok || allIssues.length === 0) {
      console.log('Fetching issues from individual projects...');
      const issuePromises = projects.map(async (project) => {
        try {
          const response = await fetch(
            `https://sentry.io/api/0/projects/${SENTRY_ORG_SLUG}/${project.slug}/issues/?statsPeriod=14d`,
            {
              headers,
              next: { revalidate: 0 },
            },
          );
          if (response.ok) {
            const projectIssues: SentryIssue[] = await response.json();
            // Add project info to each issue
            return projectIssues.map((issue) => ({
              ...issue,
              project: {
                id: project.id,
                name: project.name,
                slug: project.slug,
              },
            }));
          }
          return [];
        } catch (err) {
          console.error(`Error fetching issues for project ${project.slug}:`, err);
          return [];
        }
      });

      const issueArrays = await Promise.all(issuePromises);
      allIssues = issueArrays.flat();
    }

    return {
      issues: allIssues.slice(0, 200), // Increased limit to 200 for multiple projects
      projects,
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching Sentry data:', error);
    return {
      issues: [],
      projects: [],
      error: error.message || 'Failed to fetch Sentry data',
    };
  }
}

export default async function ErrorTrackingPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/');

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (
    email !== process.env.ADMIN_EMAIL ||
    userId !== process.env.ADMIN_USER_ID ||
    sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
  ) {
    redirect('/');
  }

  const { issues, projects, error } = await fetchSentryData();

  return (
    <ErrorTrackingDashboard
      issues={issues}
      projects={projects}
      error={error}
      orgSlug={process.env.SENTRY_ORG_SLUG || 'saksham-vj'}
    />
  );
}
