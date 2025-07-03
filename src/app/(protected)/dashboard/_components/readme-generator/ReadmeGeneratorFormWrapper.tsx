import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  const { has } = await auth();
  const hasProPlan = has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

  return hasProPlan;
}
