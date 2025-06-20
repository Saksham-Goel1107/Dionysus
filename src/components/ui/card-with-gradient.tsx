import { cn } from "@/lib/utils"

interface CardWithGradientProps {
  children: React.ReactNode
  className?: string
  gradient: "violet" | "blue" | "emerald" | "amber" | "rose"
}

export function CardWithGradient({ children, className, gradient }: CardWithGradientProps) {
  const gradientMap = {
    violet: "from-violet-500/10",
    blue: "from-blue-500/10",
    emerald: "from-emerald-500/10",
    amber: "from-amber-500/10",
    rose: "from-rose-500/10",
  }

  const iconColorMap = {
    violet: "text-violet-500",
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br via-transparent to-transparent", gradientMap[gradient])} />
      <div className="relative">{children}</div>
    </div>
  )
}
