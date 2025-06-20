import { Button } from "@/components/ui/button"
import { ArrowRight, Github, Headphones, Code } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="w-full p-12  md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Enhance Your Development Workflow with AI
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Dionysus is an AI-powered development assistant that helps you understand codebases, analyze
                repositories, and transcribe meetings.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-in">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-full w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-8 rounded-lg dark:bg-gradient-to-r dark:from-blue-800 dark:to-blue-600 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Github className="h-6 w-6 text-white" />
                    <h3 className="text-lg font-semibold text-white">Repository Analysis</h3>
                  </div>
                  <p className="text-white/90">
                  Input a GitHub repository URL to get AI-powered summaries of recent commits and insights about the
                  codebase.
                  </p>
                  <div className="flex items-center gap-2">
                    <Code className="h-6 w-6 text-white" />
                    <h3 className="text-lg font-semibold text-white">Code Q&A</h3>
                  </div>
                  <p className="text-white/90">Ask questions about your code and get intelligent answers.</p>
                  <div className="flex items-center gap-2">
                    <Headphones className="h-6 w-6 text-white" />
                    <h3 className="text-lg font-semibold text-white">Audio Transcription</h3>
                  </div>
                  <p className="text-white/90">Upload meeting recordings and get AI-powered summaries of key points.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
