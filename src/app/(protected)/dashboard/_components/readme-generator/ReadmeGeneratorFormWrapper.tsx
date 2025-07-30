import { userHasProPlan } from '@/lib/check-pro-status';

export default async function Page() {
  return await userHasProPlan();
}
