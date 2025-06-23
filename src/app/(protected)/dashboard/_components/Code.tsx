"use client";
import { Protect } from "@clerk/nextjs";
import React from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import useProject from "@/hooks/use-project";

const Code = () => {
  const { resolvedTheme } = useTheme();
  const { project } = useProject();
  let owner = "";
  let repo = "";
  if (project?.githubUrl) {
    try {
      const url = new URL(project.githubUrl);
      const pathSegments = url.pathname.split("/").filter(Boolean);
      if (pathSegments.length >= 2) {
        owner = pathSegments[0] ?? "";
        repo = pathSegments[1] ?? "";
      }
    } catch (e) {}
  }
  return (
    <Protect
      plan="dionysus_pro_pack"
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2
            className={`text-center text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}
          >
            Pro Plan Required
          </h2>
          <p
            className={`text-center ${resolvedTheme === "dark" ? "text-gray-200" : "text-gray-600"} max-w-md`}
          >
            Access to Coding is available exclusively for{" "}
            <span className="font-semibold text-yellow-700">
              Dionysus Pro Pack
            </span>{" "}
            subscribers.
            <br />
            Upgrade your plan to unlock this feature.
          </p>
          <Link href="/subscriptions">
            <Button
              size="lg"
              className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Upgrade Now
            </Button>
          </Link>
        </div>
      }
    >
    <div className="mx-auto max-w-xl rounded-lg border bg-background p-8 shadow-md">
      <h2 className="mb-4 text-2xl font-bold text-center">
        🚀 Open Your Project in CodeSandbox
      </h2>
      <ol className="mb-6 list-decimal space-y-3 pl-5 text-base">
        <li>
        <span className="font-semibold">Click the button below</span> to launch your GitHub repository in CodeSandbox.
        </li>
        <li>
        <span className="font-semibold">Sign in to CodeSandbox</span> with your GitHub account if prompted.
        </li>
        <li className="text-gray-200">
            After Signin from the top right corner open the project in your gitaccount from the dropdown to properly commit changes to github
        </li>
        <li>
        <span className="font-semibold">For private repositories:</span>
        <ul className="ml-5 mt-1 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <li>
            You must grant CodeSandbox access to your private repo. Follow the on-screen instructions after clicking the button.
          </li>
          <li>
            If you see a 404 or permission error, check your GitHub integration settings in CodeSandbox.
          </li>
        </ul>
        </li>
        <li>
        <span className="font-semibold">Make your changes</span> directly in CodeSandbox&apos;s online editor.
        </li>
        <li>
        <span className="font-semibold">Push changes back to GitHub:</span>
        <ul className="ml-5 mt-1 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <li>
            Use the <span className="font-mono">Commit</span> and <span className="font-mono">Push</span> options in CodeSandbox&apos;s UI.
          </li>
          <li>
            Ensure you&apos;re authenticated with GitHub to enable pushing.
          </li>
        </ul>
        </li>
      </ol>
    <a
      href={
        owner && repo
        ? `https://codesandbox.io/p/github/${owner}/${repo.replace(".git", "")}`
        : "#"
      }
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded bg-blue-600 px-6 py-3 text-center text-lg font-semibold text-white transition-colors hover:bg-blue-700"
    >
      Open in CodeSandbox
    </a>
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        <span className="font-semibold text-yellow-700">Tip:</span> This premium feature is available only to <span className="font-semibold">Dionysus Pro Pack</span> subscribers.
        <br/>
        <span>So if you got in any trouble we are 24/7 available for you.</span>
      </div>
    </div>
    </Protect>
  );
};

export default Code;
