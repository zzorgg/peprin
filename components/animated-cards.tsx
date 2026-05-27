"use client"

import { Matrix, wave, loader, pulse, snake } from "@/components/ui/matrix"

const cardAnimations = [
  { frames: wave, label: "Wave animation" },
  { frames: loader, label: "Loader animation" },
  { frames: pulse, label: "Pulse animation" },
  { frames: snake, label: "Snake animation" },
]

export function AnimatedCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cardAnimations.map((anim, index) => (
        <div
          key={index}
          className="flex aspect-square items-center justify-center rounded-xl border border-border/50 bg-card/50"
        >
          <Matrix
            rows={7}
            cols={7}
            frames={anim.frames}
            fps={20}
            size={12}
            gap={3}
            palette={{
              on: "hsl(0 0% 100%)",
              off: "hsl(0 0% 30%)",
            }}
            ariaLabel={anim.label}
          />
        </div>
      ))}
    </div>
  )
}
