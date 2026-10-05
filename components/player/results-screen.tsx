import { Button } from '@/components/ui/button'
import { Podium } from '@/components/game/podium'
import { Leaderboard } from '@/components/game/leaderboard'
import type { ClientGameState } from '@/lib/types'

type ResultsScreenProps = {
  state: ClientGameState
  onReplay: () => void
  onHome: () => void
}

export function ResultsScreen({ state, onReplay, onHome }: ResultsScreenProps) {
  const me = state.me
  const total = state.game?.totalQuestions ?? 5

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center gap-6 px-5 py-8">
      <h1 className="text-center text-4xl font-black">النتائج النهائية</h1>

      <Podium entries={state.leaderboard} />

      {me && (
        <section className="grid w-full grid-cols-3 gap-2 rounded-3xl bg-card p-4 text-center" aria-label="نتيجتك">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">ترتيبك</span>
            <span className="text-2xl font-black text-primary tabular-nums">{me.rank}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">نقاطك</span>
            <span className="text-2xl font-black tabular-nums">{me.score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">إجابات صحيحة</span>
            <span className="text-2xl font-black tabular-nums">{`${me.correct}/${total}`}</span>
          </div>
        </section>
      )}

      <Leaderboard entries={state.leaderboard} highlight={me?.nickname} limit={10} title="ترتيب المشاركين" />

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button onClick={onReplay} className="h-12 flex-1 rounded-2xl text-lg font-bold">
          إعادة اللعب
        </Button>
        <Button onClick={onHome} variant="outline" className="h-12 flex-1 rounded-2xl text-lg font-bold">
          العودة للبداية
        </Button>
      </div>
    </main>
  )
}
