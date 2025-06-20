import { cn } from "@/lib/utils"

interface GradientHeaderProps {
  children: React.ReactNode
  className?: string
}

export function GradientHeader({ children, className }: GradientHeaderProps) {
  return (
    <div className={cn("min-h-[200px] w-full bg-gradient-to-b from-primary/10 to-transparent", className)}>
      {children}
    </div>
  )
}

interface ContentContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl"
}

export function ContentContainer({ children, className, maxWidth = "7xl" }: ContentContainerProps) {
  return (
    <div className={cn(`container max-w-${maxWidth} py-12 md:py-16`, className)}>
      {children}
    </div>
  )
}

interface StickyTabsHeaderProps {
  children: React.ReactNode
}

export function StickyTabsHeader({ children }: StickyTabsHeaderProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {children}
    </div>
  )
}
