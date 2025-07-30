import { userHasProPlan } from '@/lib/check-pro-status';
import { cookies } from 'next/headers';
import ProCrownUserButton from '@/app/(protected)/_components/ProCrownUserButton';

export default async function ProCrownUserButtonWrapper() {
  const cookieStore = await cookies();
  const bypassCache =
    cookieStore.get('force-refresh')?.value === 'true' ||
    cookieStore.get('bypass-pro-cache')?.value === 'true';

  const isPro = await userHasProPlan({ bypassCache });

  return <ProCrownUserButton isPro={isPro} />;
}
