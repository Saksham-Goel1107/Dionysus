import { NextRequest, NextResponse } from "next/server";

// Dummy Gemini AI integration for code analytics explanation
// Replace with your real Gemini API integration as needed
export async function POST(req: NextRequest) {
  const { analytics, repo } = await req.json();
  // Compose a prompt for Gemini
  const prompt = `Analyze the following code metrics and repository details. Explain the codebase quality, complexity, and any issues in detail for a non-expert.\n\nRepository Info:\n${JSON.stringify(repo, null, 2)}\n\nAnalytics:\n${JSON.stringify(analytics, null, 2)}`;

  // --- Replace this with a real Gemini API call ---
  // For now, return a dummy explanation
  const explanation = `This codebase consists of ${analytics.length} files. The average cyclomatic complexity is ${(
    analytics.reduce((sum: number, a: any) => sum + (a.aggregate?.cyclomatic || 0), 0) / analytics.length
  ).toFixed(2)}. There are ${analytics.reduce((sum: number, a: any) => sum + (a.functions?.length || 0), 0)} functions in total.\n\nRepository: ${repo?.owner}/${repo?.name} (Latest commit: ${repo?.latestCommit})\n\nFiles with higher complexity may be harder to maintain. Consider refactoring files with high cyclomatic complexity or a large number of functions.\n\n(For a real AI explanation, connect this endpoint to Gemini or another LLM API.)`;

  return NextResponse.json({ explanation });
}
