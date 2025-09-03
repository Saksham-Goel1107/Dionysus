'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import React, { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import AskQuestionCrad from '../dashboard/_components/AskQuestionCard';
import CodeReferences from '../dashboard/_components/CodeReferences';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { toast } from 'sonner';
import useRefetch from '@/hooks/use-refetch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const NoProjectsCard = () => {

  const { isLoading: isProjectsLoading } = api.project.getProjects.useQuery();
  if (isProjectsLoading) {
      return (
        <div className="flex h-full flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-300" />
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-300">Loading projects...</p>
        </div>
      );
    }

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-primary/10 p-3">
        <Plus className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">No Projects Yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Create a project first to start asking questions about your codebase. This will help us
        provide accurate and contextual answers.
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
    },
  );
  const { data: isCreator } = api.project.isProjectCreator.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const deleteQuestion = api.project.deleteQuestion.useMutation();
  const refetch = useRefetch();

  const [questionIndex, setQuestionIndex] = React.useState(0);
  const question = questions?.[questionIndex];
  const { resolvedTheme } = useTheme();

  // State for confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion.mutate(
      { questionId },
      {
        onSuccess: () => {
          toast.success('Question deleted successfully');
          refetch();
          setDialogOpen(false);
          setQuestionToDelete(null);
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to delete question');
          setDialogOpen(false);
        },
      },
    );
  };

  const openDeleteDialog = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    setQuestionToDelete(questionId);
    setDialogOpen(true);
  };

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
                  resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'
                } relative mb-2 p-4 shadow-md shadow-border`}
              >
                <Image
                  className="rounded-full"
                  height={30}
                  width={30}
                  src={question.user.imageUrl ?? ''}
                  alt="User avatar"
                />
                <div className="flex flex-col overflow-hidden text-left">
                  <div className="flex items-center gap-2">
                    <p
                      className={`line-clamp-1 text-lg font-medium ${
                        resolvedTheme === 'dark' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {question.question}
                    </p>
                    <span className="whitespace-nowrap text-xs text-gray-400">
                      {question.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-500">{question.answer}</p>
                </div>

                {isCreator && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-2 h-6 w-6 group-hover:opacity-100"
                    onClick={(e) => openDeleteDialog(e, question.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </SheetTrigger>
          </React.Fragment>
        ))}
        {questions?.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No questions asked yet. Start by asking a question about your codebase!
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Question Deletion */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteQuestion.isPending}
              onClick={() => questionToDelete && handleDeleteQuestion(questionToDelete)}
            >
              {deleteQuestion.isPending ? 'Deleting...' : 'Delete Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {question && (
        <SheetContent
          side="right"
          className="flex h-screen w-full flex-col overflow-y-auto p-3 sm:max-w-[80vw] sm:p-6"
        >
          <SheetHeader>
            <SheetTitle className="mb-1 text-base font-semibold leading-tight tracking-tight sm:mb-2 sm:text-xl">
              {question.question}
            </SheetTitle>
          </SheetHeader>

          <div data-color-mode={resolvedTheme} className="markdown-editor-container flex-1">
            <ScrollArea className="max-h-[60vh] w-full flex-1 overflow-y-auto sm:max-h-[70vh]">
              <div
                className={`rounded-lg border border-gray-200 bg-white p-3 text-sm text-card-foreground shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5 sm:text-base`}
                style={{ minHeight: 60 }}
              >
                <MDEditor.Markdown source={question.answer} className="md-preview-content" />
              </div>
            </ScrollArea>
          </div>

          <div className="my-1 w-full border-t border-gray-200 dark:border-gray-800 sm:my-4" />

          <CodeReferences
            filesReferences={
              Array.isArray(question.filesReferences)
                ? (question.filesReferences as {
                    fileName: string;
                    sourceCode: string;
                    summary: string;
                  }[])
                : []
            }
          />
        </SheetContent>
      )}
    </Sheet>
  );
};

export default QaPage;
