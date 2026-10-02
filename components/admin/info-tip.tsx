"use client"

import { type ReactNode, useState } from "react"
import { Info } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function InfoTip({
  label = "More information",
  children,
  className,
}: {
  label?: string
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span
        className="inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <PopoverTrigger asChild>
          <button
            aria-label={label}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            type="button"
          >
            <Info className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-w-[min(20rem,calc(100vw-2rem))] text-sm leading-relaxed"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          side="top"
        >
          {children}
        </PopoverContent>
      </span>
    </Popover>
  )
}
