import { Github, Code, Headphones, Zap, Moon, Smartphone } from "lucide-react";

export function Features() {
  return (
    <section
      id="features"
      className="w-full bg-muted/50 p-12 md:py-24 lg:py-32"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Everything You Need
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Dionysus combines powerful AI capabilities with a seamless user
              experience to enhance your development workflow.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Github className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">GitHub Integration</h3>
            <p className="text-center text-muted-foreground">
              Connect to any GitHub repository and get AI-powered summaries of
              recent commits and codebase insights.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Code Analysis</h3>
            <p className="text-center text-muted-foreground">
              Ask questions about your code and get intelligent answers from our
              AI.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Headphones className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Audio Transcription</h3>
            <p className="text-center text-muted-foreground">
              Upload meeting recordings and get AI-powered summaries of key
              points.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Fast Performance</h3>
            <p className="text-center text-muted-foreground">
              Built with Next.js for optimal performance and user experience.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Moon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Dark Mode</h3>
            <p className="text-center text-muted-foreground">
              Switch between light and dark themes based on your preference.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Responsive Design</h3>
            <p className="text-center text-muted-foreground">
              Enjoy a seamless experience across all devices and screen sizes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
