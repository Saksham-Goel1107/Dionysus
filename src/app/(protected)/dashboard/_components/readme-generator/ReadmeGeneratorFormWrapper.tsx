import { auth } from '@clerk/nextjs/server'

export default async function Page() {
  const { has } = await auth()
  const hasProPlan = has({ plan: 'dionysus_pro_pack' })

  return hasProPlan
}