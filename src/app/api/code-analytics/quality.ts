import { NextRequest, NextResponse } from "next/server";

interface FunctionInfo {
}

interface AggregateInfo {
    cyclomatic?: number;
}

interface FileAnalytics {
    path: string;
    aggregate?: AggregateInfo;
    functions?: FunctionInfo[];
    totalFunctions?: number;
    content?: string;
}

interface AnalyticsRequestBody {
    analytics: FileAnalytics[];
}

interface FileIssue {
    path: string;
    issues: string[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const analytics = body?.analytics;
  if (!Array.isArray(analytics)) {
    return NextResponse.json({ issues: [], error: 'Invalid analytics data.' }, { status: 400 });
  }
  const issues = analytics.map((f: FileAnalytics) => {
    const issues: string[] = [];
    if ((f.aggregate?.cyclomatic || 0) > 20) issues.push("High cyclomatic complexity (>20)");
    if ((f.functions?.length || 0) > 10) issues.push("Too many functions (>10)");
    if ((f.aggregate?.cyclomatic || 0) === 0) issues.push("No cyclomatic complexity detected");
    if ((f.functions?.length || 0) === 0) issues.push("No functions detected");
    if ((f.totalFunctions || 0) > 50) issues.push("Suspiciously high function count (>50)");
    if (f.path.endsWith('.ts') && !f.path.endsWith('.d.ts') && !f.content?.includes('type') && !f.content?.includes('interface')) issues.push("TypeScript file missing types or interfaces");
    return { path: f.path, issues };
  }).filter((f: FileIssue) => f.issues.length > 0);
  return NextResponse.json({ issues });
}
