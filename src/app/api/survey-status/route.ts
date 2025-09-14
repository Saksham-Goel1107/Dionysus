import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { readReplicaDb } from '@/server/read-replica-db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ done: false });
  const user = await readReplicaDb.user.findUnique({
    where: { id: userId },
    select: { SurveyDone: true },
  });
  return NextResponse.json({ done: !!user?.SurveyDone });
}
