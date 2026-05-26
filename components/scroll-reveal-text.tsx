"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealTextProps {
  text: string
  className?: string
  paragraph?: boolean
}

export function ScrollRevealText({ text, className, paragraph = false }: ScrollRevealTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleScroll = () => {
      const rect = el.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const start = windowHeight * 0.8
      const end = windowHeight * 0.3

      const scrolled = start - rect.top
      const range = start - end

      const p = Math.min(Math.max(scrolled / range, 0), 1)
      setProgress(p)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const words = text.split(" ")

  return (
    <div ref={ref} className={cn("relative", paragraph ? "text-muted-foreground" : "", className)}>
      {words.map((word, i) => {
        const wordProgress = (i / words.length) * 100
        const opacity = Math.min(Math.max((progress * 100 - wordProgress) / 15, 0), 1)

        return (
          <span
            key={i}
            className="inline-block transition-none"
            style={{
              opacity,
              marginRight: "0.25em",
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
