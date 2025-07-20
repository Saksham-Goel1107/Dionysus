import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const { userId } = await auth();
  if (!userId) redirect('/');
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== 'sakshamgoel1107@gmail.com') {
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
