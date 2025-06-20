import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  icon?: React.ReactNode
  title: string
  description?: string
  className?: string
}

export function PageHeader({ icon, title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Link href="/">
        <Button variant="ghost" className="flex items-center gap-2 px-0 hover:bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        {icon && <div className="text-primary">{icon}</div>}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {description && (
        <p className="text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
