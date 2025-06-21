import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummariseCommit } from "./gemini";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorUsername?: string; // GitHub login like "saksham-goel1107"
  commitAuthorAvatar: string;
  commitDate: string;
};

export const getCommitHashes = async (
  githubUrl: string,
): Promise<Response[]> => {
  try {
    // Clean up GitHub URL to ensure it's in the correct format
    githubUrl = githubUrl
      .replace(/\.git$/, '')  // Remove .git extension if present
      .replace(/\/$/, '');    // Remove trailing slash if present
    
    // Extract owner and repo from URL
    let owner, repo;
    const urlParts = githubUrl.split("/");
    
    if (urlParts.length >= 2) {
      owner = urlParts[urlParts.length - 2];
      repo = urlParts[urlParts.length - 1];
    }
    
    if (!owner || !repo) {
      console.error(`Invalid GitHub URL format: ${githubUrl}`);
      return [];
    }
        
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
    });
    
    if (!data || data.length === 0) {
      console.log(`No commits found for ${owner}/${repo}`);
      return [];
    }

    const sortedCommits = data.sort(
      (a: any, b: any) =>
        new Date(b.commit.author.date).getTime() -
        new Date(a.commit.author.date).getTime(),
    ) as any[];

    return sortedCommits.slice(0, 10).map((commit: any) => ({
      commitHash: commit.sha as string,
      commitMessage: commit.commit?.message ?? "",
      commitAuthorName: commit.commit?.author?.name ?? "",
      commitAuthorUsername: commit.author?.login ?? undefined, // Getting GitHub login (e.g. "saksham-goel1107")
      commitAuthorAvatar: commit.author?.avatar_url ?? "",
      commitDate: commit.commit?.author?.date ?? "",
    }));
  } catch (error) {
    console.error(`Failed to fetch commits for ${githubUrl}:`, error);
    return [];
  }
};

export const pullCommits = async (projectId: string) => {
  try {
    if (!projectId) {
      console.log("No projectId provided to pullCommits");
      return { count: 0 };
    }
    
    let project, githubUrl;
    try {
      const result = await fetchProjectGithubUrl(projectId);
      project = result.project;
      githubUrl = result.githubUrl;
    } catch (error) {
      console.error(`Error fetching GitHub URL for project ${projectId}:`, error);
      return { count: 0, error: "Failed to fetch project GitHub URL" };
    }

    const commitHashes = await getCommitHashes(githubUrl);
    if (commitHashes.length === 0) {
      console.log(`No commits found for project ${projectId} with URL ${githubUrl}`);
      return { count: 0, warning: "No commits found" };
    }

    const unprocessedCommits = await filterUnprocessedCommits(
      projectId,
      commitHashes,
    );
    
    if (unprocessedCommits.length === 0) {
      return { count: 0, message: "No new commits to process" };
    }

    const summaryResponses = await Promise.allSettled(
      unprocessedCommits.map((commit) => {
        return summariseCommit(githubUrl, commit.commitHash, project.name || "");
      }),
    );

    const summaries = summaryResponses.map((response) => {
      if (response.status === "fulfilled") {
        return response.value as string;
      }
      return "";
    });

    const commits = await db.commit.createMany({
      data: summaries.map((summary, index) => {
        return {
          projectId: projectId,
          commitHash: unprocessedCommits[index]!.commitHash,
          commitMessage: unprocessedCommits[index]!.commitMessage,
          commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
          commitAuthorUsername: unprocessedCommits[index]!.commitAuthorUsername,
          commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
          commitDate: unprocessedCommits[index]!.commitDate,
          summary,
        };
      }),
    });
    
    return { count: commits.count, message: "Successfully processed commits" };
  } catch (error) {
    console.error(`Error pulling commits for project ${projectId}:`, error);
    return { count: 0, error: `Failed to pull commits: ${error instanceof Error ? error.message : String(error)}` };
  }
};

async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubUrl: true,
      name: true,
    },
  });

  if (!project?.githubUrl) {
    throw new Error("Project has no github URL");
  }

  return { project, githubUrl: project?.githubUrl };
}

async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: Response[],
) {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
  });

  const unprocessedCommits = commitHashes.filter(
    (commit) =>
      !processedCommits.some(
        (processedCommit) => processedCommit.commitHash === commit.commitHash,
      ),
  );

  return unprocessedCommits;
}

async function summariseCommit(githubUrl: string, commitHash: string, projectName: string) {
  const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
    headers: {
      Accept: "application/vnd.github.v3.diff",
    },
  });
  return (await aiSummariseCommit(data, projectName)) || "";
}
