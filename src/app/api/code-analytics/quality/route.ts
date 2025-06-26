import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const analytics = body?.analytics;
  if (!Array.isArray(analytics)) {
    return NextResponse.json({ issues: [], error: 'Invalid analytics data.' }, { status: 400 });
  }
  // Simple quality analysis: flag files with high complexity or too many functions
  const issues = analytics.map((f: any) => {
    const issues: string[] = [];
    if ((f.aggregate?.cyclomatic || 0) > 20) issues.push("High cyclomatic complexity (>20)");
    if ((f.functions?.length || 0) > 10) issues.push("Too many functions (>10)");
    return { path: f.path, issues };
  }).filter((f: { path: string; issues: string[] }) => f.issues.length > 0);
  return NextResponse.json({ issues });
}
