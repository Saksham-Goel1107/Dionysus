import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import SurveyDashboard from '../components/SurveyDashboard';
import SurveyHeader from '../components/SurveyHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSurveysPage() {
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

  const surveyResponses = await db.survey.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          emailAddress: true,
          isPro: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const roleDistribution = await db.survey.groupBy({
    by: ['role'],
    _count: true,
    orderBy: {
      _count: {
        role: 'desc',
      },
    },
  });

  const industryDistribution = await db.survey.groupBy({
    by: ['industry'],
    _count: true,
    orderBy: {
      _count: {
        industry: 'desc',
      },
    },
  });

  const companySizeDistribution = await db.survey.groupBy({
    by: ['companySize'],
    _count: true,
  });

  const usagePurposeDistribution = await db.survey.groupBy({
    by: ['usagePurpose'],
    _count: true,
    orderBy: {
      _count: {
        usagePurpose: 'desc',
      },
    },
  });

  const featureInterest = await db.survey.findMany({
    select: {
      expectedFeatures: true,
    },
  });

  let featureCounts: Record<string, number> = {};
  featureInterest.forEach((survey) => {
    if (Array.isArray(survey.expectedFeatures)) {
      survey.expectedFeatures.forEach((feature) => {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      });
    }
  });

  const totalUsers = await db.user.count();
  const completedSurveys = await db.survey.count();
  const completionRate = totalUsers > 0 ? (completedSurveys / totalUsers) * 100 : 0;

  const safeRoleDistribution = roleDistribution.map((item) => ({
    ...item,
    role: item.role === null ? undefined : item.role,
  }));

  const mappedSurveyResponses = surveyResponses.map((survey) => ({
    ...survey,
    role: survey.role === null ? undefined : survey.role,
    industry: survey.industry === null ? undefined : survey.industry,
    user: {
      ...survey.user,
      firstName: survey.user.firstName === null ? undefined : survey.user.firstName,
      lastName: survey.user.lastName === null ? undefined : survey.user.lastName,
    },
  }));

  return (
    <>
      <SurveyHeader />
      <SurveyDashboard
        surveyResponses={mappedSurveyResponses}
        roleDistribution={safeRoleDistribution}
        industryDistribution={industryDistribution.map((item) => ({
          ...item,
          industry: item.industry === null ? undefined : item.industry,
        }))}
        teamSizeDistribution={companySizeDistribution}
        goalDistribution={usagePurposeDistribution}
        featureInterest={featureCounts}
        completionRate={completionRate}
        totalResponses={completedSurveys}
      />
    </>
  );
}
