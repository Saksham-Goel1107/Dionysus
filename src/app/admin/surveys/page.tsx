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

  const [surveyResponses, totalUsers, completedSurveys] = await Promise.all([
    db.survey.findMany({
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
    }),
    db.user.count(),
    db.survey.count(),
  ]);

  if (completedSurveys === 0) {
    return (
      <>
        <SurveyHeader />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Survey Data</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No survey responses have been collected yet.
            </p>
          </div>
        </div>
      </>
    );
  }

  const [
    roleDistribution,
    industryDistribution,
    companySizeDistribution,
    usagePurposeDistribution,
    featureInterest,
  ] = await Promise.all([
    db.survey.groupBy({
      by: ['role'],
      _count: true,
      where: { role: { not: null } },
      orderBy: { _count: { role: 'desc' } },
    }),
    db.survey.groupBy({
      by: ['industry'],
      _count: true,
      where: { industry: { not: null } },
      orderBy: { _count: { industry: 'desc' } },
    }),
    db.survey.groupBy({
      by: ['companySize'],
      _count: true,
      where: { companySize: { not: null } },
    }),
    db.survey.groupBy({
      by: ['usagePurpose'],
      _count: true,
      where: { usagePurpose: { not: null } },
      orderBy: { _count: { usagePurpose: 'desc' } },
    }),
    db.survey.findMany({
      select: { expectedFeatures: true },
    }),
  ]);

  const featureCounts: Record<string, number> = {};
  featureInterest.forEach((survey) => {
    if (Array.isArray(survey.expectedFeatures)) {
      survey.expectedFeatures.forEach((feature) => {
        if (feature) featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      });
    }
  });

  const completionRate = totalUsers > 0 ? (completedSurveys / totalUsers) * 100 : 0;

  const mappedSurveyResponses = surveyResponses.map((survey) => ({
    ...survey,
    role: survey.role || undefined,
    industry: survey.industry || undefined,
    user: {
      ...survey.user,
      firstName: survey.user.firstName || undefined,
      lastName: survey.user.lastName || undefined,
    },
  }));

  return (
    <>
      <SurveyHeader />
      <SurveyDashboard
        surveyResponses={mappedSurveyResponses}
        roleDistribution={roleDistribution.map((item) => ({
          ...item,
          role: item.role ?? undefined,
        }))}
        industryDistribution={industryDistribution.map((item) => ({
          ...item,
          industry: item.industry ?? undefined,
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
