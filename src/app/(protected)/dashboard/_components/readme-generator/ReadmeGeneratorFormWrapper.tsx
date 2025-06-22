import { auth } from "@clerk/nextjs/server";
import ReadmeGeneratorForm from "./ReadmeGeneratorForm";

export default async function ReadmeGeneratorFormWrapper() {
  const { has } = await auth();
  const hasProPlan = has({ plan: "dionysus_pro_pack" });
  return <ReadmeGeneratorForm hasProPlan={hasProPlan} />;
}
