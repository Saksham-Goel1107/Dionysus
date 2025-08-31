import { getFeatureFlagValue } from '@/lib/configcat';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the survey skip feature flag from ConfigCat
    const canSkip = await getFeatureFlagValue('survey-skip-enabled', false);

    return NextResponse.json({
      canSkip,
      success: true,
    });
  } catch (error) {
    console.error('Error checking survey skip feature flag:', error);
    return NextResponse.json(
      {
        canSkip: false, // Default to false on error
        success: false,
        message: 'Failed to check feature flag',
      },
      { status: 500 },
    );
  }
}
