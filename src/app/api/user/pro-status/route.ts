import { NextResponse } from 'next/server';
import { userHasProPlan } from '@/lib/check-pro-status';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const bypassCache =
    cookieStore.get('force-refresh')?.value === 'true' ||
    cookieStore.get('bypass-pro-cache')?.value === 'true';

  const isPro = await userHasProPlan({ bypassCache });

  return NextResponse.json({ isPro });
}
