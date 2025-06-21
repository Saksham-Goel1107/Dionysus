import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize genAI only at runtime to avoid build errors
let genAI: GoogleGenerativeAI;

const SYSTEM_CONTEXT = `You are an expert technical writer specializing in creating high-quality, visually appealing, and professional GitHub READMEs for software projects. 

Your task is to create a compelling and detailed README that includes:

1. A clear and engaging project title and description
2. Visually appealing badges showing technologies, license, and GitHub stats and many other that will look professional and eye catching
3. Detailed sections for installation, usage, and features
4. Well-structured and professional markdown formatting
5. Properly formatted code blocks where appropriate
6. Eye-catching visuals including screenshots if provided
7. Resource links and contact information

Make the README thorough, professional, and visually engaging. Use proper GitHub-flavored markdown formatting with appropriate spacing, headings, lists, code blocks, and emphasis. When appropriate, suggest additional sections or content that would enhance the README based on the project information provided.

The output should be complete GitHub-compatible markdown that can be copied directly into a README.md file but don't wrap the entire code in triple backtiks and markdown triple backtiks because that will distrupt the code just write the code normally.`;

export async function POST(req: NextRequest) {
  try {
    // Check API key at runtime instead of build time
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      console.error("GEMINI_API_KEY is not properly configured");
      return NextResponse.json(
        {
          error: "Invalid API configuration. Please contact the administrator.",
        },
        { status: 500 },
      );
    }

    // Initialize the API only when needed
    if (!genAI) {
      genAI = new GoogleGenerativeAI(apiKey);
    }

    const formData = await req.json();

    if (!formData) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4000,
      },
    });

    // Convert form data to a structured prompt
    const prompt = buildPrompt(formData);

    const result = await model.generateContent([SYSTEM_CONTEXT, prompt]);
    const response = await result.response;
    let readmeContent = response.text();

    if (!readmeContent) {
      return NextResponse.json(
        { error: "Failed to generate README content. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      content: readmeContent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const error = err as Error;
    console.error("README Generator Error:", error);

    if (
      error.message?.includes("API_KEY_INVALID") ||
      error.message?.includes("API key not valid")
    ) {
      return NextResponse.json(
        {
          error: "Invalid API configuration. Please contact the administrator.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate README, please try again later." },
      { status: 500 },
    );
  }
}

interface FormData {
  projectName: string;
  projectDescription: string;
  projectTags: string;
  projectLicense: string;
  projectLink?: string;
  projectDemoLink?: string;
  installationSteps: string;
  usageInstructions: string;
  features: string;
  technologies: string;
  includeContributing: boolean;
  includeTwitter: boolean;
  twitterUsername?: string;
  includeLinkedIn: boolean;
  linkedInUsername?: string;
  includeScreenshots: boolean;
  screenshotLinks: string;
}

function buildPrompt(formData: FormData): string {
  const {
    projectName,
    projectDescription,
    projectTags,
    projectLicense,
    projectLink,
    projectDemoLink,
    installationSteps,
    usageInstructions,
    features,
    technologies,
    includeContributing,
    includeTwitter,
    twitterUsername,
    includeLinkedIn,
    linkedInUsername,
    includeScreenshots,
    screenshotLinks,
  } = formData;

  const tagsArray: string[] = projectTags
    .split(",")
    .map((tag: string) => tag.trim())
    .filter(Boolean);
  const featuresArray: string[] = features
    .split("\n")
    .map((feature: string) => feature.trim())
    .filter(Boolean);
  const technologiesArray: string[] = technologies
    .split(",")
    .map((tech: string) => tech.trim())
    .filter(Boolean);
  const installationStepsArray: string[] = installationSteps
    .split("\n")
    .map((step: string) => step.trim())
    .filter(Boolean);
  const usageInstructionsArray: string[] = usageInstructions
    .split("\n")
    .map((instruction: string) => instruction.trim())
    .filter(Boolean);
  const screenshotLinksArray: string[] = screenshotLinks
    .split("\n")
    .map((link: string) => link.trim())
    .filter(Boolean);

  return `
Please create a comprehensive GitHub README for a project with the following details:

# Project Information
- Project Name: ${projectName}
- Project Description: ${projectDescription}
- License: ${projectLicense}
${projectLink ? `- GitHub Repository Link: ${projectLink}` : ""}
${projectDemoLink ? `- Live Demo Link: ${projectDemoLink}` : ""}

# Tags/Keywords
${tagsArray.length > 0 ? tagsArray.map((tag: string) => `- ${tag}`).join("\n") : "- None provided"}

# Technologies Used
${technologiesArray.length > 0 ? technologiesArray.map((tech) => `- ${tech}`).join("\n") : "- None specifically mentioned"}

# Features
${featuresArray.length > 0 ? featuresArray.map((feature) => `- ${feature}`).join("\n") : "- None specified"}

# Installation Steps
${installationStepsArray.length > 0 ? installationStepsArray.map((step) => `- ${step}`).join("\n") : "- None provided"}

# Usage Instructions
${usageInstructionsArray.length > 0 ? usageInstructionsArray.map((instruction) => `- ${instruction}`).join("\n") : "- None provided"}

# Additional Components to Include
${includeContributing ? "- Include a CONTRIBUTING section" : ""}
${includeTwitter ? `- Include Twitter contact: ${twitterUsername}` : ""}
${includeLinkedIn ? `- Include LinkedIn contact: ${linkedInUsername}` : ""}
${includeScreenshots && screenshotLinksArray.length > 0 ? "- Include Screenshots section with the following links:\n" + screenshotLinksArray.map((link) => `  - ${link}`).join("\n") : ""}

Please create an attractive, professional README with proper markdown formatting, badges for technologies (using shields.io), license badges, and GitHub stats badges. Make it visually engaging and comprehensive, ready to be used in a GitHub repository.
`;
}
