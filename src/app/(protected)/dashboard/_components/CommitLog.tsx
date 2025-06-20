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
    <>
      <ul className="space-y-6">
        {commits?.map((commit, commitIdx) => (
          <li key={commit.id} className="relative flex items-start gap-x-4">
            <div
              className={cn(
                commitIdx === commits.length - 1 ? "h-6" : "-bottom-6",
                "absolute left-0 top-0 flex justify-center",
              )}
            >
              <div className={`w-px translate-x-1 bg-${resolvedTheme === "dark"?"gray-700":"gray-200"}`}></div>
            </div>

            <>
              <img
                src={commit.commitAuthorAvatar}
                alt="commit avatar"
                className="relative mt-4 h-8 w-8 flex-none rounded-full bg-gray-50"
              />

              <div className={`flex-auto rounded-md ${resolvedTheme === "dark"?"bg-gray-900":"bg-white"} p-3 ring-1 ring-inset ${resolvedTheme==="dark"?"ring-gray-700":"ring-gray-200"}`}>
                <div className="flex justify-between gap-x-4">
                    <Link
                    target="_blank"
                    href={`${project?.githubUrl?.replace(/\.git$/, "")}/commits/${commit.commitHash}`}
                    className="py-0.5 text-xs leading-5 text-gray-500"
                    >
                    <span className={`text-${resolvedTheme === "dark"?"gray-100":"gray-900"} font-semibold`}>
                      {commit.commitAuthorName}
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
    </>
  );
};

export default CommitLog;
