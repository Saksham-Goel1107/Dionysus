import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { z } from 'zod';

const surveySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  industry: z.string().min(1, 'Industry is required'),
  role: z.string().min(1, 'Your role is required'),
  usagePurpose: z.string().min(1, 'Please describe your purpose'),
  hearAboutUs: z.string().min(1, 'This field is required'),
  expectedFeatures: z.array(z.string()).nonempty('Select at least one feature'),
  developmentExperience: z.number().min(1).max(5),
  githubExperience: z.number().min(1).max(5),
  feedbackFrequency: z.enum(['Weekly', 'Monthly', 'Quarterly', 'Never']),
  additionalFeedback: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    const validatedData = surveySchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { message: 'Invalid survey data', errors: validatedData.error.format() },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.survey.upsert({
        where: { userId },
        update: { 
          companyName: validatedData.data.companyName,
          companySize: validatedData.data.companySize,
          industry: validatedData.data.industry,
          role: validatedData.data.role,
          usagePurpose: validatedData.data.usagePurpose,
          hearAboutUs: validatedData.data.hearAboutUs,
          expectedFeatures: validatedData.data.expectedFeatures,
          developmentExperience: validatedData.data.developmentExperience,
          githubExperience: validatedData.data.githubExperience,
          feedbackFrequency: validatedData.data.feedbackFrequency,
          additionalFeedback: validatedData.data.additionalFeedback,
        },
        create: {
          userId,
          companyName: validatedData.data.companyName,
          companySize: validatedData.data.companySize,
          industry: validatedData.data.industry,
          role: validatedData.data.role,
          usagePurpose: validatedData.data.usagePurpose,
          hearAboutUs: validatedData.data.hearAboutUs,
          expectedFeatures: validatedData.data.expectedFeatures,
          developmentExperience: validatedData.data.developmentExperience,
          githubExperience: validatedData.data.githubExperience,
          feedbackFrequency: validatedData.data.feedbackFrequency,
          additionalFeedback: validatedData.data.additionalFeedback,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { SurveyDone: true },
      });
    });

    return NextResponse.json({ success: true, message: 'Survey submitted successfully' });
  } catch (error) {
    console.error('Error in survey API:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
