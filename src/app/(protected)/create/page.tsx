"use client";

import { Button } from "@/components/ui/button";
import React from "react"
import { Input } from "@/components/ui/input";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import { FormInput } from "@/types/FormInput";
import { FileWarning, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {};

// Reusable lock indicator component
const LockIndicator = () => (
  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground cursor-help group">
    <span>Locked</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M12 15v2m0-6v2m0-6v2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
    </svg>
    <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/80 text-white text-xs whitespace-nowrap rounded pointer-events-none">
      Click "Recheck" button to unlock
    </div>
  </div>
);

const page = ({}: Props) => {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormInput>();
  const createProject = api.project.createProject.useMutation();
  const checkCredits = api.project.checkCredits.useMutation();
  const [urlLocked, setUrlLocked] = React.useState(false);

  const refetch = useRefetch();
  
  const repoUrl = watch("repoUrl");
  const githubToken = watch("githubToken");
  
  const hasEnoughCredits = !!checkCredits?.data && !!checkCredits?.data?.userCredits
    ? checkCredits.data.fileCount <= checkCredits.data.userCredits
    : true;

  function onSubmit(data: FormInput) {
    if (!!checkCredits.data) {
      // Only proceed if repository is valid
      if (checkCredits.data.isValid) {
        createProject.mutate(
          {
            githubUrl: data.repoUrl,
            name: data.projectName,
            githubToken: data.githubToken,
          },
          {
            onSuccess: () => {
              toast.success("Project created successfully");
              refetch();
              reset();
              setUrlLocked(false);
            },
            onError: (error) => {
              if (error.message.includes("more than 80 credits")) {
                toast.error("Project creation is disabled for repositories requiring more than 80 credits");
              } else {
                toast.error("Failed to create project: " + error.message);
              }
            },
          },
        );
      } else {
        // Don't proceed if validation failed, just keep showing the error
        toast.error(checkCredits.data.error || "Repository validation failed");
      }
    } else {
      // Initial check of the repository
      checkCredits.mutate(
        {
          githubUrl: data.repoUrl,
          githubToken: data.githubToken,
        },
        {
          onSuccess: (data) => {
            if (data.isValid) {
              setUrlLocked(true);
              toast.success("Repository validated successfully. Fields are now locked.");
            }
          },
          onError: (error) => {
            toast.error("Failed to check repository: " + error.message);
          }
        }
      );
    }
  }
  
  const handleRecheck = () => {
    // Reset the validation state
    checkCredits.reset();
    setUrlLocked(false);
    toast.info("Fields unlocked. You can now edit your project details.");
  }

   

  return (
    <div className="flex h-full items-center justify-center gap-12">
      <img src="/undraw_developer.svg" className="h-56 w-auto" />
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link your Github Repository
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the URL of your repository to link it to Dionysus
          </p>
        </div>

        <div className="h4"></div>

        <div>
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 mb-2 text-red-700">
            <div className="flex items-center gap-2">
              <FileWarning className="size-4" />
              <p className="text-sm">
                It is suggested to link repository with{" "}
                <strong>less than 50 files</strong> for best experience.
              </p>
            </div>
          </div>
          
          {urlLocked && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 mb-4 text-blue-700">
              <div className="flex items-center gap-2">
                <Info className="size-4" />
                <div>
                  <p className="text-sm font-medium">All fields are locked after validation</p>
                  <p className="text-xs">
                    To make changes to your project details, click the "Recheck" or "Change Repo" button.
                  </p>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <Input
                {...register("projectName", { required: true })}
                placeholder="Project Name"
                required
                disabled={urlLocked}
                className={urlLocked ? "bg-muted pr-10" : ""}
              />
              {urlLocked && (
                <LockIndicator />
              )}
            </div>

            <div className="h-2"></div>

            <div className="relative">
              <Input
                {...register("repoUrl", { required: true })}
                placeholder="Github URL"
                type="url"
                required
                disabled={urlLocked}
                className={urlLocked ? "bg-muted pr-10" : ""}
              />
              {urlLocked && (
                <LockIndicator />
              )}
            </div>

            <div className="h-2"></div>

            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                GitHub Personal Access Token (required for private repositories)
              </label>
              <div className="relative mt-1">
                <Input
                  {...register("githubToken")}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  type="password"
                  disabled={urlLocked}
                  className={urlLocked ? "bg-muted pr-10" : ""}
                />
                {urlLocked && (
                  <LockIndicator />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Create a token with 'repo' scope at{" "}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    github.com/settings/tokens
                  </a>
                    <p className="text-xs text-red-400">
                    We promise that we will never store your token, or misuse any of them.
                    </p>
                </p>
              </div>
            </div>

            {!!checkCredits.data && (
              <div className={`mt-4 rounded-md border px-4 py-2 ${
                !checkCredits.data.isValid 
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : checkCredits.data?.fileCount > 80
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-orange-200 bg-orange-50 text-orange-700"
              }`}>
                {!checkCredits.data.isValid ? (
                  <div className="flex items-start gap-2">
                    <FileWarning className="size-4 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Repository validation failed</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleRecheck}
                          className="h-7 px-2 text-xs bg-amber-50/50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 mr-1">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                          </svg>
                          Recheck
                        </Button>
                      </div>
                      
                      <p className="text-sm">{checkCredits.data.error}</p>
                      
                      {checkCredits.data.error?.toLowerCase().includes("not found") && (
                        <p className="mt-2 text-sm">
                          This repository doesn't exist or is private. Please verify the URL is correct.
                        </p>
                      )}
                                          
                      {checkCredits.data.error?.toLowerCase().includes("token") && (
                        <p className="mt-2 text-sm flex items-center gap-1">
                          <svg viewBox="0 0 24 24" className="size-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 15v2m0-6v2m0-6v2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
                          </svg>
                          Please provide a GitHub personal access token with repo scope access.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="size-4" />
                        <p className="text-sm">
                          You will be charged{" "}
                          <strong>{checkCredits.data?.fileCount}</strong> credits for
                          this repository.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRecheck}
                        className="h-7 px-2 text-xs border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 mr-1">
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                          <path d="M16 21h5v-5" />
                        </svg>
                        Change Repo
                      </Button>
                    </div>
                    {checkCredits.data?.fileCount > 80 && (
                      <div className="ml-6 text-sm font-semibold text-red-700 mt-1">
                        Error: Project creation is disabled for repositories requiring more than 80 credits
                      </div>
                    )}
                    <p className="ml-6 text-sm text-blue-600">
                      You have <strong>{checkCredits.data?.userCredits}</strong>{" "}
                      credits remaining.
                    </p>
                    <p className="ml-6 text-sm text-red-900">
                      Remember This process takes some time so be patient and check in 2-5 min till then have a coffee🍵
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="h-4"></div>

            <Button
              type="submit"
              disabled={
                createProject.isPending ||
                checkCredits.isPending ||
                (checkCredits.data && (!checkCredits.data.isValid || checkCredits.data.fileCount > 80))
              }
            >                {!checkCredits.data 
                ? "Check Repository" 
                : !checkCredits.data.isValid
                ? (checkCredits.data.error?.toLowerCase().includes("token") 
                    ? "Add Token & Validate Repository" 
                    : "Fix Issues & Validate Repository")
                : "Create Project"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default page;
