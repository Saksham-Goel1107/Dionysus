import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, MessageSquare, FileAudio, ArrowRight } from "lucide-react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full p-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Simple Yet Powerful
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Dionysus makes it easy to get insights from your code and meetings
              in just a few steps.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Step 1</CardTitle>
                <CardDescription>Connect Repository</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p>
                Enter the URL of your GitHub repository to connect it to
                Dionysus. Our AI will summarize recent commits and analyze the
                codebase for insights.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" disabled>
                Connect <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Step 2</CardTitle>
                <CardDescription>Ask Questions</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p>
                Ask questions about your code in natural language. Our AI will
                provide relevant and accurate answers based on your repository.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" disabled>
                Ask <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <FileAudio className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Step 3</CardTitle>
                <CardDescription>Upload Audio</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p>
                Upload meeting recordings to get AI-powered transcriptions and
                summaries of key points discussed in your meetings.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" disabled>
                Upload <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
