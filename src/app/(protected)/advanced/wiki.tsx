import { useState } from 'react';
import { Button } from '@/components/ui/button';

// PromptBox component for prompt highlighting and copy
const PromptBox = ({ prompt }: { prompt: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-1 flex items-center gap-2 rounded bg-blue-100 px-3 py-2 dark:bg-blue-800/40">
      <span className="flex-1 select-all break-all font-mono text-xs">{prompt}</span>
      <Button
        size="sm"
        className="bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
        onClick={() => {
          navigator.clipboard.writeText(prompt);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </Button>
    </div>
  );
};

const promptList = [
  'Analyze the codebase and generate a project overview based on the actual code, not just the README.',
  'List all main modules, packages, or folders in this repository and describe their purpose based on the code.',
  'Identify and summarize the key classes, functions, and components in the codebase.',
  "Generate a Home.md page with a welcome message and a summary of the codebase's main features, using information from the code itself.",
  'Create a Footer.md with contact info, license, and useful links, referencing any relevant code comments or metadata.',
  'Write a Contributing.md with step-by-step contribution guidelines, including code style, commit message conventions, and branch strategy as found in the code or config files.',
  'List and explain all environment variables used in this project, extracting them from the code and configuration files.',
  'Document all API endpoints, including request/response examples and authentication details, by analyzing the code (controllers, routes, etc.).',
  'Generate a Troubleshooting.md for common errors and their solutions, using error messages and exception handling found in the code.',
  'Create a FAQ section addressing common issues and troubleshooting steps, referencing actual error handling and comments in the code.',
  'Suggest best practices and guidelines for contributing to this repository, based on linting, formatting, and test scripts in the codebase.',
  'Summarize the architecture and folder structure of the codebase, using the actual directory and file structure.',
  'Generate a setup guide for new contributors, including prerequisites and installation steps, by analyzing package.json, requirements.txt, or other setup files.',
  'List all scripts and commands available in the project (npm scripts, Makefile, etc.) and explain their usage.',
  'Extract and document all configuration options and their defaults from the codebase.',
  'Identify and document all third-party dependencies and their purpose in the project, based on imports and package files.',
  'For each major feature, generate a usage example or code snippet from the actual implementation.',
  'Summarize the test strategy and coverage, referencing test files and code comments.',
  'List all user roles and permissions if present, based on code logic.',
  'Generate a changelog or release notes by analyzing commit messages and code changes.',
];

const Wiki = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div className="mx-auto my-2 flex w-full max-w-2xl flex-col items-center rounded-xl border border-blue-300 bg-blue-50 p-6 shadow-md dark:border-blue-700 dark:bg-blue-900/40">
        <h2 className="mb-2 text-xl font-bold text-blue-700 dark:text-blue-200">
          Wiki Generation Tips & Tricks
        </h2>
        <Button onClick={() => setShowModal(true)} className="mb-2 bg-blue-600 text-white">
          Show Detailed Guide
        </Button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/40">
          <div className="relative mx-2 max-h-[98vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-2 top-2 text-2xl text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              &times;
            </button>
            <h3 className="mb-4 text-center text-lg font-bold text-blue-700 dark:text-blue-200">
              Premium Wiki Generation: Step-by-Step Guide
            </h3>
            <div className="w-full space-y-4 text-sm text-blue-900 dark:text-blue-100">
              <div>
                <b>What is Wiki Generation?</b>
                <p className="mt-1">
                  Wiki generation is the process of creating comprehensive, well-structured
                  documentation for your project directly on GitHub. This helps onboard new
                  contributors, clarify project goals, and provide ongoing support for users and
                  developers.
                </p>
              </div>
              <div>
                <b>Why Use GitHub Copilot for Wiki?</b>
                <ul className="mt-1 list-disc pl-5">
                  <li>
                    Copilot leverages AI to suggest, summarize, and improve documentation content in
                    real time.
                  </li>
                  <li>
                    It can help you write clear explanations, generate code samples, and maintain
                    consistency across your wiki.
                  </li>
                  <li>
                    Copilot is especially useful for premium users who want to save time and ensure
                    high-quality docs.
                  </li>
                </ul>
              </div>
              <div>
                <b>How to Enable Copilot for Wiki Generation (Step-by-Step):</b>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>
                    Go to{' '}
                    <a
                      href="https://github.com/features/copilot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      GitHub Copilot
                    </a>{' '}
                    and subscribe if you haven&apos;t already. Else you can use it for free as
                    everyone has 50 free requests per month.
                  </li>
                  <li>
                    Install the <b>GitHub Copilot</b> browser extension (if available) or use
                    Copilot in your preferred code editor (VS Code, JetBrains, etc.).
                  </li>
                  <li>
                    Suggested to use claude models like claude sonnet 3.5 or 3.7 etc for best
                    results.
                  </li>
                  <li>Sign in with your GitHub account and authorize Copilot access.</li>
                  <li>
                    Navigate to your repository on GitHub and click the <b>Wiki</b> tab.
                  </li>
                  <li>
                    Click <b>New Page</b> to start a new wiki entry.
                  </li>
                  <li>
                    In the editor, use Copilot suggestions or paste prompts to generate content. You
                    can trigger Copilot by typing natural language instructions or using{' '}
                    <b>Ctrl+Enter</b> (or <b>Cmd+Enter</b> on Mac) in supported editors.
                  </li>
                  <li>
                    Review, edit, and format the generated content for clarity and accuracy. Use
                    markdown for structure (headings, lists, code blocks, etc.).
                  </li>
                  <li>
                    Save your changes and organize pages with a clear, logical structure. Link
                    related pages for easy navigation.
                  </li>
                  <li>
                    Repeat the process for all major sections: Overview, Setup, API, FAQ,
                    Contributing, etc.
                  </li>
                </ol>
              </div>
              <div>
                <b>Best Prompts for Copilot Wiki Generation (Advanced & Sequential):</b>
                <div className="mt-1 space-y-1">
                  {promptList.map((prompt, i) => (
                    <PromptBox key={i} prompt={prompt} />
                  ))}
                </div>
                <div className="mt-3 text-xs text-blue-800 dark:text-blue-200">
                  <b>Tip:</b> For best results, use these prompts in order. Start with a codebase
                  analysis, then generate overview, structure, and documentation for each section.
                  Always instruct Copilot to reference the actual code, not just the README or
                  generic templates.
                </div>
              </div>
              <div>
                <b>How to Get Copilot to Use Code Context Effectively:</b>
                <ul className="mt-1 list-disc pl-5">
                  <li>
                    Open the relevant code files in your editor or GitHub web interface before
                    prompting Copilot. This increases the chance Copilot will use the code context.
                  </li>
                  <li>
                    Be explicit in your prompt: say &quot;based on the code in this file&quot; or
                    &quot;analyze the codebase and...&quot;.
                  </li>
                  <li>
                    If Copilot generates generic or off-topic content, refine your prompt to mention
                    specific files, functions, or code sections.
                  </li>
                  <li>
                    For large codebases, break down documentation generation by module or feature
                    for more accurate results.
                  </li>
                  <li>
                    After each Copilot suggestion, review and edit for accuracy, and ask follow-up
                    prompts for missing details.
                  </li>
                </ul>
              </div>
              <div>
                <b>Pro Tips for Premium Users:</b>
                <ul className="mt-1 list-disc pl-5">
                  <li>
                    Always review and edit Copilot&apos;s suggestions for accuracy and
                    project-specific details.
                  </li>
                  <li>
                    Use markdown formatting for clarity: <code># Headings</code>,{' '}
                    <code>```code blocks```</code>, <code>[links](url)</code>, etc.
                  </li>
                  <li>Keep documentation up to date as your project evolves.</li>
                  <li>
                    Encourage your team to use Copilot for consistent, high-quality documentation.
                  </li>
                  <li>
                    Organize your wiki with a clear table of contents and cross-links between pages.
                  </li>
                  <li>
                    For sensitive or private projects, ensure no confidential information is
                    included in public wikis.
                  </li>
                </ul>
              </div>
              <div className="mt-4 rounded bg-blue-100 p-2 text-xs text-blue-700 dark:bg-blue-800/40 dark:text-blue-200">
                <b>Note:</b> These steps are designed for premium users who want to maximize the
                value of GitHub Copilot for documentation. Even though Copilot is powerful, always
                use your expertise to ensure the highest quality and accuracy.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Wiki;
