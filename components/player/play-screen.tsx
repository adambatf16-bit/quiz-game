'use client'

import { QuestionView } from '@/components/game/question-view'
import { QuestionCounter } from '@/components/game/game-header'
import { Timer } from '@/components/game/timer'
import type { ClientGameState } from '@/lib/types'
import { cn } from '@/lib/utils'

type PlayScreenProps = {
  state: ClientGameState
  selected: number | null
  onSelect: (choice: number) => void
}

export function PlayScreen({ state, selected, onSelect }: PlayScreenProps) {
  const game = state.game!
  const question = state.question!
  const reveal = state.reveal
  const me = state.me
  const answered = selected !== null
  const timeUp = game.phase === 'question' && game.remainingMs <= 0

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-4 py-4">
      <header className="flex items-center justify-between gap-3">
        <QuestionCounter index={game.questionIndex} total={game.totalQuestions} />
        {game.phase === 'question' ? (
          <Timer remainingMs={game.remainingMs} durationMs={game.durationMs} receivedAt={state.receivedAt} />
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">نقاطك</span>
            <span className="text-2xl font-black tabular-nums">{me?.score ?? 0}</span>
          </div>
        )}
      </header>

      <QuestionView
        question={question}
        reveal={reveal}
        selected={selected}
        onSelect={onSelect}
        disabled={answered || timeUp}
      />

      <div className="mt-auto pb-2" aria-live="polite">
        {game.phase === 'question' && answered && (
          <p className="text-center font-semibold text-muted-foreground">تم تسجيل إجابتك. بانتظار انتهاء الوقت...</p>
        )}
        {reveal && me && (
          <div
            className={cn(
              'flex items-center justify-between rounded-2xl p-4 font-bold animate-in fade-in slide-in-from-bottom-2 duration-300',
              me.answer?.choice === reveal.correct ? 'bg-success text-success-foreground' : 'bg-card',
            )}
          >
            <span className="text-lg">
              {me.answer === null
                ? 'لم تُجب في الوقت'
                : me.answer.choice === reveal.correct
                  ? `إجابة صحيحة! +${me.answer.points}`
                  : 'إجابة خاطئة'}
            </span>
            <span className="tabular-nums">{`المركز ${me.rank} من ${game.playerCount}`}</span>
          </div>
        )}
      </div>
    </main>
  )
}
