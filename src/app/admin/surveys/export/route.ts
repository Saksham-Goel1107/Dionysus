import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const { userId, sessionClaims } = await auth();

      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!sessionClaims?.metadata?.role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const user = await currentUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (
        user.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL ||
        sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET ||
        userId !== process.env.ADMIN_USER_ID
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
          credits: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const csvRows = [];

  csvRows.push(
    [
      'User ID',
      'First Name',
      'Last Name',
      'Email',
      'Is Pro',
      'Credits',
      'Company Name',
      'Company Size',
      'Industry',
      'Role',
      'Usage Purpose',
      'How They Found Us',
      'Expected Features',
      'Development Experience (1-5)',
      'GitHub Experience (1-5)',
      'Feedback Frequency',
      'Additional Feedback',
      'Survey Date',
    ].join(','),
  );

  for (const survey of surveyResponses) {
    const expectedFeatures = Array.isArray(survey.expectedFeatures)
      ? `"${survey.expectedFeatures.join(', ')}"`
      : '';

    csvRows.push(
      [
        survey.user.id,
        survey.user.firstName?.replace(/"/g, '""') || '',
        survey.user.lastName?.replace(/"/g, '""') || '',
        survey.user.emailAddress,
        survey.user.isPro ? 'Yes' : 'No',
        survey.user.credits,
        survey.companyName?.replace(/"/g, '""') || '',
        survey.companySize || '',
        survey.industry || '',
        survey.role || '',
        survey.usagePurpose || '',
        survey.hearAboutUs || '',
        expectedFeatures,
        survey.developmentExperience || '',
        survey.githubExperience || '',
        survey.feedbackFrequency || '',
        `"${(survey.additionalFeedback || '').replace(/"/g, '""')}"`,
        new Date(survey.createdAt).toISOString().split('T')[0],
      ].join(','),
    );
  }

  const csvContent = csvRows.join('\r\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="survey-data-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
