import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ issues: [], error: 'Invalid or empty JSON body.' }, { status: 400 });
  }
  const analytics = body?.analytics;
  if (!Array.isArray(analytics)) {
    return NextResponse.json({ issues: [], error: 'Invalid analytics data.' }, { status: 400 });
  }
  const issues = analytics
    .map((f: any) => {
      const issues: string[] = [];
      if ((f.aggregate?.cyclomatic || 0) > 20) issues.push('High cyclomatic complexity (>20)');
      if ((f.functions?.length || 0) > 10) issues.push('Too many functions (>10)');
      return { path: f.path, issues };
    })
    .filter((f: { path: string; issues: string[] }) => f.issues.length > 0);
  return NextResponse.json({ issues });
}
