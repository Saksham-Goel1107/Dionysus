import useProject from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

type Props = {};

const CommitLog = ({}: Props) => {
  const { projectId, project } = useProject();
  const { data: commits } = api.project.getCommits.useQuery({ projectId });
  const {resolvedTheme} = useTheme();

  return (
    <div className="w-full">
      <ul className="space-y-6 overflow-x-hidden">
        {commits?.map((commit, commitIdx) => (
          <li key={commit.id} className="relative flex items-start gap-x-4">
        <div
          className={cn(
            commitIdx === commits.length - 1 ? "h-6" : "-bottom-6",
            "absolute left-0 top-0 flex justify-center",
          )}
        >
            <div className={`w-px translate-x-1 ${resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}></div>
        </div>

        <>
        {/* Always show the same image component, but wrap in a link only if username exists */}
        {commit.commitAuthorUsername ? (
          <a
            href={`https://github.com/${commit.commitAuthorUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <img
              src={commit.commitAuthorAvatar}
              alt={`${commit.commitAuthorName}'s avatar`}
              className="relative mt-4 h-8 w-8 flex-none rounded-full bg-gray-50"
              style={{ minWidth: "2rem", minHeight: "2rem" }}
            />
          </a>
        ) : (
          <div className="flex-shrink-0">
            <img
              src={commit.commitAuthorAvatar}
              alt={`${commit.commitAuthorName}'s avatar`}
              className="relative mt-4 h-8 w-8 flex-none rounded-full bg-gray-50"
              style={{ minWidth: "2rem", minHeight: "2rem" }}
            />
          </div>
        )}

          <div className={`flex-auto rounded-md ${resolvedTheme === "dark"?"bg-gray-900":"bg-white"} p-3 ring-1 ring-inset ${resolvedTheme==="dark"?"ring-gray-700":"ring-gray-200"}`}>
            <div className="flex justify-between gap-x-4">
            <Link
            target="_blank"
            href={`${project?.githubUrl?.replace(/\.git$/, "")}/commits/${commit.commitHash}`}
            className="py-0.5 text-xs leading-5 text-gray-500"
            >
            <span className={`text-${resolvedTheme === "dark"?"gray-100":"gray-900"} font-semibold`}>
              {commit.commitAuthorName || commit.commitAuthorUsername }
            </span>{" "}
            <span className="inline-flex items-center">
              Committed
              <ExternalLink className="ml-1 h-4 w-4" />
            </span>
            </Link>
            </div>

            <span className={`text-${resolvedTheme === "dark"?"gray-300":"gray-800"} font-medium`}>{commit.commitMessage}</span>
            <pre className="leadinng-6 mt-2 whitespace-pre-wrap text-sm text-gray-500">
          {commit.summary}
            </pre>
          </div>
        </>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommitLog;
