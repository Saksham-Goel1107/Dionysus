import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ done: false });
  const user = await db.user.findUnique({ where: { id: userId }, select: { SurveyDone: true } });
  return NextResponse.json({ done: !!user?.SurveyDone });
}
