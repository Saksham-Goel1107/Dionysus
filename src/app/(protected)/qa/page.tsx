"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import AskQuestionCrad from "../dashboard/_components/AskQuestionCard";
import CodeReferences from "../dashboard/_components/CodeReferences";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useTheme } from "next-themes";
import Image from "next/image";

const NoProjectsCard = () => {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-primary/10 p-3">
        <Plus className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">No Projects Yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Create a project first to start asking questions about your codebase.
        This will help us provide accurate and contextual answers.
      </p>
      <Button asChild className="mt-6">
        <Link href="/create">Create Your First Project</Link>
      </Button>
    </Card>
  );
};

const QaPage = () => {
  const { projectId, projects } = useProject();
  const { data: questions } = api.project.getQuestions.useQuery(
    { projectId },
    {
      enabled: !!projectId,
    }
  );
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const question = questions?.[questionIndex];
  const { resolvedTheme } = useTheme();

  if (!projects || projects.length === 0) {
    return (
      <div className="container max-w-4xl py-8">
        <NoProjectsCard />
      </div>
    );
  }

  return (
    <Sheet>
      <AskQuestionCrad />
      <div className="h-4" />
      <h1 className="text-xl font-semibold">Saved Questions</h1>
      <div className="h-2" />
      <div className="flex flex-col gap-2">
        {questions?.map((question, index) => (
          <React.Fragment key={question.id}>
            <SheetTrigger onClick={() => setQuestionIndex(index)}>
              <div
                className={`flex items-center gap-4 rounded-lg border ${
                  resolvedTheme === "dark" ? "bg-gray-900" : "bg-white"
                } p-4 shadow-md shadow-border mb-2`}
              >
                <Image
                  className="rounded-full"
                  height={30}
                  width={30}
                  src={question.user.imageUrl ?? ""}
                  alt="User avatar"
                />
                <div className="flex flex-col text-left overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p
                      className={`line-clamp-1 text-lg font-medium ${
                        resolvedTheme === "dark"
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {question.question}
                    </p>
                    <span className="whitespace-nowrap text-xs text-gray-400">
                      {question.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-500">
                    {question.answer}
                  </p>
                </div>
              </div>
            </SheetTrigger>
          </React.Fragment>
        ))}
        {questions?.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No questions asked yet. Start by asking a question about your codebase!
          </div>
        )}
      </div>

      {question && (
        <SheetContent
          side="right"
          className="h-screen w-full sm:max-w-[80vw] sm:p-6 p-3 flex flex-col overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-base sm:text-xl mb-1 sm:mb-2 font-semibold tracking-tight leading-tight">
              {question.question}
            </SheetTitle>
          </SheetHeader>

          <div
            data-color-mode={resolvedTheme}
            className="markdown-editor-container flex-1"
          >
            <ScrollArea className="flex-1 w-full max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              <div
                className={`p-3 sm:p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 text-card-foreground text-sm sm:text-base`}
                style={{ minHeight: 60 }}
              >
                <MDEditor.Markdown
                  source={question.answer}
                  className="md-preview-content"
                />
              </div>
            </ScrollArea>
          </div>

          <div className="my-1 sm:my-4 border-t border-gray-200 dark:border-gray-800 w-full" />

          <CodeReferences
            filesReferences={
              Array.isArray(question.filesReferences)
                ? (question.filesReferences as { fileName: string; sourceCode: string; summary: string }[])
                : []
            }
          />
        </SheetContent>
      )}
    </Sheet>
  );
};

export default QaPage;
