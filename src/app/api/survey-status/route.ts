import { readReplicaDb } from '@/server/read-replica-db';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ done: false });

    const user = await readReplicaDb.user.findUnique({
      where: { id: userId },
      select: { SurveyDone: true },
    });

    return NextResponse.json({ done: !!user?.SurveyDone });
  } catch (error) {
    console.error('Error fetching survey status:', error);
    // Return a default value if database is unavailable
    return NextResponse.json({ done: false }, { status: 200 });
  }
}
