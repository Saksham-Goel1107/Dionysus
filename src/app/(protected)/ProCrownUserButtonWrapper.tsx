import { auth } from "@clerk/nextjs/server";
import ProCrownUserButton from "./_components/ProCrownUserButton";

export default async function ProCrownUserButtonWrapper() {
  const { has } = await auth();
  const isPro = has({ plan: "dionysus_pro_pack" });
  return <ProCrownUserButton isPro={isPro} />;
}
