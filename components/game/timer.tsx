'use client'

import { useNow } from '@/lib/game-client'
import { cn } from '@/lib/utils'

type TimerProps = {
  remainingMs: number
  durationMs: number
  receivedAt: number
  size?: 'md' | 'lg'
}

export function Timer({ remainingMs, durationMs, receivedAt, size = 'md' }: TimerProps) {
  const now = useNow(100)
  const left = Math.max(0, receivedAt + remainingMs - now)
  const seconds = Math.ceil(left / 1000)
  const progress = durationMs ? left / durationMs : 0
  const urgent = seconds <= 3

  const radius = 44
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className={cn('relative shrink-0', size === 'lg' ? 'size-32 md:size-40' : 'size-20 md:size-24')}
      role="timer"
      aria-live="off"
      aria-label={`الوقت المتبقي ${seconds} ثانية`}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-secondary" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn('transition-[stroke-dashoffset] duration-100 ease-linear', urgent ? 'stroke-destructive' : 'stroke-primary')}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-black tabular-nums',
          size === 'lg' ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl',
          urgent ? 'text-destructive' : 'text-foreground',
        )}
      >
        {seconds}
      </span>
    </div>
  )
}
