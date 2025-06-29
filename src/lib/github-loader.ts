import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "@/server/db";
import { Octokit } from "octokit";

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  try {
    
    // Clean up GitHub URL to ensure it's in the correct format
    const cleanGithubUrl = githubUrl
      .replace(/\.git$/, '')  // Remove .git extension if present
      .replace(/\/$/, '');    // Remove trailing slash if present
    
    const loader = new GithubRepoLoader(cleanGithubUrl, {
      accessToken: githubToken || process.env.GITHUB_TOKEN || "",
      branch: "main",
      ignoreFiles: [
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "bun.lockb",
      ],
      recursive: true,
      unknown: "warn",
      maxConcurrency: 5,
    });
    
    const docs = await loader.load();
    return docs;
  } catch (error) {
    console.error(`Failed to load GitHub repo ${githubUrl}:`, error);
    throw new Error(`Unable to fetch repository files: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  try {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    console.log(`Successfully loaded ${docs.length} files from GitHub repo: ${githubUrl}`);
    
    // If there are too many files, limit them to avoid rate limits
    const MAX_FILES = 50;
    const filesToProcess = docs.length > MAX_FILES ? docs.slice(0, MAX_FILES) : docs;
    
    if (docs.length > MAX_FILES) {
      console.log(`Processing only first ${MAX_FILES} files out of ${docs.length} to avoid rate limits`);
    }

    const allEmbeddings = await generateEmbeddings(filesToProcess);

    await Promise.allSettled(
      allEmbeddings.map(async (embedding, index) => {
        console.log(`processing ${index} of ${allEmbeddings.length}`);

        if (!embedding) return;

        try {
          const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {
              summary: embedding.summary,
              sourceCode: embedding.sourceCode,
              fileName: embedding.fileName,
              projectId,
            },
          });

          if (embedding.embedding) {
            await db.$executeRaw`
              UPDATE "SourceCodeEmbedding"
              SET "summaryEmbedding"=${embedding.embedding}::vector
              WHERE "id"=${sourceCodeEmbedding.id}
              `;
          }
        } catch (error) {
          console.error(`Failed to process embedding for ${embedding.fileName}:`, error);
        }
      }),
    );
    
    return true;
  } catch (error) {
    console.error(`Failed to index GitHub repo ${githubUrl}:`, error);
    // Don't throw here - we want to continue with project creation even if indexing fails
    return false;
  }
};

const generateEmbeddings = async (docs: Document[]) => {
  const results = [];
  
  // Process files sequentially with a delay to avoid rate limits
  for (const doc of docs) {
    try {
      const summary = await summariseCode(doc);
      
      let embedding = null;
      if (summary) {
        try {
          embedding = await generateEmbedding(summary);
        } catch (error) {
          console.error(`Failed to generate embedding for ${doc.metadata.source}:`, error);
          // Continue without embedding
        }
      }

      results.push({
        summary: summary || `Source code file: ${doc.metadata.source}`,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName: doc.metadata.source,
      });
      
      // Add a small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing document ${doc.metadata.source}:`, error);
      // Continue with next document
    }
  }
  
  return results;
};

//recursive function to calculate number of files in a github repository.
const getFileCount = async (
  path: string,
  octokit: Octokit,
  githubOwner: string,
  githubRepo: string,
  acc: number = 0,
) => {
  // get the contents of the path
  const { data } = await octokit.rest.repos.getContent({
    owner: githubOwner,
    repo: githubRepo,
    path,
  });

  // if data is not array, then it is just one file
  if (!Array.isArray(data) && data.type === "file") {
    return acc + 1;
  }

  // if data is array, means there are subfolders
  if (Array.isArray(data)) {
    let fileCount = 0;
    const directories: string[] = [];

    for (const item of data) {
      // if item is a directory, add it to the list of directories. else, fileCount++
      if (item.type === "dir") {
        directories.push(item.path);
      } else {
        fileCount++;
      }
    }

    // Now if number of directories is more than 0, then do a recursive call to  getFileCount to each directory
    if (directories.length > 0) {
      const directoryCounts = await Promise.all(
        directories.map((dirPath) =>
          getFileCount(dirPath, octokit, githubOwner, githubRepo, 0),
        ),
      );

      fileCount += directoryCounts.reduce((acc, count) => acc + count, 0);
    }

    return acc + fileCount;
  }

  return acc;
};

export const checkCredits = async (githubUrl: string, githubToken?: string) => {
  try {
    // find out how many files are in the repo
    const token = githubToken || process.env.GITHUB_TOKEN;
    
    const octokit = new Octokit({ 
      auth: token
    });

    let githubOwner = '';
    let githubRepo = '';
    
    try {
      const url = new URL(githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`);
      if (url.host !== 'github.com') {
        throw new Error("Invalid GitHub URL host. Please provide a URL with the host 'github.com'.");
      }
      const pathParts = url.pathname.split('/').filter(part => part !== '');
      if (pathParts.length >= 2) {
        githubOwner = pathParts[0] || '';
        githubRepo = (pathParts[1] || '').replace(/\.git$/, '');
      } else {
        throw new Error("Invalid GitHub URL format. Please provide a valid GitHub repository URL.");
      }
    } catch (e) {
      console.error("Error parsing GitHub URL:", e);
      throw new Error("Invalid GitHub URL format. Please provide a valid GitHub repository URL.");
    }
    
    
    if (!githubOwner || !githubRepo) {
      console.error("Could not extract owner/repo from URL:", githubUrl);
      throw new Error("Could not extract owner and repository name from the GitHub URL. Please provide a valid GitHub repository URL in the format 'owner/repo' or 'github.com/owner/repo'.");
    }
    
    // Verify repository exists before counting files
    try {
      await octokit.rest.repos.get({
        owner: githubOwner,
        repo: githubRepo,
      });
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Repository ${githubOwner}/${githubRepo} not found. Please check the URL or provide a personal access token if it's a private repository.`);
      } else if (error.status === 401 || error.status === 403) {
        throw new Error(`Access denied to repository ${githubOwner}/${githubRepo}. Please provide a valid personal access token with repo scope.`);
      } else {
        throw new Error(`Error accessing repository: ${error.message}`);
      }
    }

    const fileCount = await getFileCount("", octokit, githubOwner, githubRepo, 0);
    return fileCount;
  } catch (error) {
    console.error("Error checking credits:", error);
    throw error;
  }
};
