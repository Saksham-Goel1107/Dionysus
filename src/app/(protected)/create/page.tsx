"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import { FormInput } from "@/types/FormInput";
import { FileWarning, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {};

const page = ({}: Props) => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const createProject = api.project.createProject.useMutation();
  const checkCredits = api.project.checkCredits.useMutation();

  const refetch = useRefetch();

  function onSubmit(data: FormInput) {
    if (!!checkCredits.data) {
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
          },
          onError: () => {
            toast.error("Failed to create project");
          },
        },
      );
    } else {
      checkCredits.mutate({
        githubUrl: data.repoUrl,
        githubToken: data.githubToken,
      });
    }

    return true;
  }

  const hasEnoughCredits = checkCredits?.data?.userCredits
    ? checkCredits.data.fileCount <= checkCredits.data.userCredits
    : true;
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
                It is suggested to link repository with {" "}
                <strong> less than 50 files</strong> for best experience.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register("projectName", { required: true })}
              placeholder="Project Name"
              required
            />

            <div className="h-2"></div>

            <Input
              {...register("repoUrl", { required: true })}
              placeholder="Github URL"
              type="url"
              required
            />

            <div className="h-2"></div>

            <Input
              {...register("githubToken")}
              placeholder="Github Token (optional)"
            />

            {!!checkCredits.data && (
              <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-2 text-orange-700">
                <div className="flex items-center gap-2">
                  <Info className="size-4" />
                  <p className="text-sm">
                    You will be charged{" "}
                    <strong>{checkCredits.data?.fileCount}</strong> credits for
                    this repository.
                  </p>
                </div>
                <p className="ml-6 text-sm text-blue-600">
                  You have <strong>{checkCredits.data?.userCredits}</strong>{" "}
                  credits remaining.
                </p>
              </div>
            )}

            <div className="h-4"></div>

            <Button
              type="submit"
              disabled={
                createProject.isPending ||
                checkCredits.isPending ||
                !hasEnoughCredits
              }
            >
              {!!checkCredits.data ? "Create Project" : "Check Credits"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default page;
