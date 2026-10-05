import type { LeaderboardEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Leaderboard({
  entries,
  highlight,
  limit = 5,
  title = 'الترتيب',
}: {
  entries: LeaderboardEntry[]
  highlight?: string
  limit?: number
  title?: string
}) {
  if (!entries.length) return null
  return (
    <section aria-label={title} className="w-full">
      <h3 className="mb-2 text-sm font-bold text-muted-foreground">{title}</h3>
      <ol className="flex flex-col gap-1.5">
        {entries.slice(0, limit).map((e) => (
          <li
            key={`${e.rank}-${e.nickname}`}
            className={cn(
              'flex items-center gap-3 rounded-xl bg-card px-3 py-2',
              highlight === e.nickname && 'ring-2 ring-primary',
            )}
          >
            <span className="w-6 text-center font-black text-primary tabular-nums">{e.rank}</span>
            <span className="flex-1 truncate font-semibold">{e.nickname}</span>
            <span className="font-bold tabular-nums">{e.score}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
