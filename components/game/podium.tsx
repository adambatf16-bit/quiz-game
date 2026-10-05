import type { LeaderboardEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

const PLACES = [
  { index: 1, label: 'المركز الثاني', height: 'h-24 md:h-32', medal: 'bg-[oklch(0.82_0.02_268)] text-background' },
  { index: 0, label: 'المركز الأول', height: 'h-32 md:h-44', medal: 'bg-primary text-primary-foreground' },
  { index: 2, label: 'المركز الثالث', height: 'h-16 md:h-24', medal: 'bg-[oklch(0.68_0.11_55)] text-background' },
]

export function Podium({ entries, large }: { entries: LeaderboardEntry[]; large?: boolean }) {
  if (!entries.length) {
    return <p className="text-center text-muted-foreground">لا يوجد مشاركون</p>
  }
  return (
    <ol className="flex w-full items-end justify-center gap-2 md:gap-4" aria-label="المراكز الثلاثة الأولى">
      {PLACES.map(({ index, label, height, medal }) => {
        const entry = entries[index]
        if (!entry) return <li key={index} className="flex-1" aria-hidden="true" />
        return (
          <li key={index} className="flex max-w-48 flex-1 flex-col items-center gap-2">
            <span className="sr-only">{label}</span>
            <span
              className={cn(
                'w-full truncate text-center font-bold',
                large ? 'text-xl md:text-3xl' : 'text-base md:text-lg',
              )}
            >
              {entry.nickname}
            </span>
            <span className="text-sm font-semibold text-muted-foreground tabular-nums">{entry.score} نقطة</span>
            <div className={cn('flex w-full flex-col items-center justify-start rounded-t-2xl bg-card pt-3', height)}>
              <span className={cn('flex size-10 items-center justify-center rounded-full text-xl font-black md:size-12', medal)}>
                {index + 1}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
