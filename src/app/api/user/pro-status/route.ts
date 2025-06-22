import { NextResponse } from "next/server";
import readmeGeneratorWrapper from "@/app/(protected)/dashboard/_components/readme-generator/ReadmeGeneratorFormWrapper";

export async function GET() {
  try {
    const result = await readmeGeneratorWrapper();
    return NextResponse.json({ pro: result });
  } catch (error) {
    return NextResponse.json({ pro: false }, { status: 500 });
  }
}
