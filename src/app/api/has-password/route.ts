import { auth } from '@clerk/nextjs/server';
import { readReplicaDb } from '@/server/read-replica-db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || process.env.NODE_ENV !== 'production')
      return NextResponse.json({ hasPassword: false });
    // @ts-ignore
    const user = await readReplicaDb.user.findUnique({ where: { id: userId } });
    // @ts-ignore
    return NextResponse.json({ hasPassword: !!user?.passwordHash });
  } catch {
    return NextResponse.json({ hasPassword: false });
  }
}
