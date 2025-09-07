import { readReplicaDb } from '@/server/read-replica-db';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ done: false });
  try {
    const user = await readReplicaDb.user.findUnique({
      where: { id: userId },
      select: { SurveyDone: true },
    });
    return NextResponse.json({ done: !!user?.SurveyDone });
  } catch (error) {
    console.error('Read-replica DB error in survey-status:', error);
    // Fallback: try primary DB if available or return a safe default
    return NextResponse.json({ done: false });
  }
}
