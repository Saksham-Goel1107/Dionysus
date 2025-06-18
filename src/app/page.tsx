import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, Headphones, Users, FileAudio, Bot } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center px-4 lg:px-6">
        <Link className="flex items-center justify-center" href="#">
          <Bot className="h-6 w-6" />
          <span className="ml-2 text-2xl font-bold">Dionysus</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Revolutionize Your GitHub Workflow with AI
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Dionysus: Your AI-powered GitHub companion for seamless
                  collaboration, code analysis, and meeting insights.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="flex items-center justify-center space-x-4">
                  <Link href="/sign-up">
                    <Button>Get Started</Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button>Login</Button>
                  </Link>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Start enhancing your GitHub experience today. No credit card
                  required.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-gray-100 py-12 dark:bg-gray-800 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter sm:text-5xl">
              Key Features
            </h2>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <Github className="mb-2 h-8 w-8" />
                  <CardTitle>GitHub Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Seamlessly connect your GitHub repositories and access
                    powerful AI-driven insights and analytics.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="mb-2 h-8 w-8" />
                  <CardTitle>Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Invite team members, share projects, and work together
                    efficiently on a unified platform.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <FileAudio className="mb-2 h-8 w-8" />
                  <CardTitle>Meeting Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Upload audio files from meetings and get AI-generated
                    transcripts, summaries, and timestamps.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to Transform Your GitHub Experience?
                </h2>
                <p className="max-w-[600px] text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join Dionysus today and unlock the power of AI for your GitHub
                  projects.
                </p>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex w-full shrink-0 flex-col items-center gap-2 border-t px-4 py-6 sm:flex-row md:px-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Dionysus. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:ml-auto sm:gap-6">
          <Link className="text-xs underline-offset-4 hover:underline" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs underline-offset-4 hover:underline" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
