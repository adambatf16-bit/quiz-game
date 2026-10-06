'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Loader2, Play, RotateCcw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GameTitle, QuestionCounter } from '@/components/game/game-header'
import { QuestionView } from '@/components/game/question-view'
import { Timer } from '@/components/game/timer'
import { Leaderboard } from '@/components/game/leaderboard'
import { Podium } from '@/components/game/podium'
import { postAction, readStored, useGameState, writeStored } from '@/lib/game-client'

const HOST_KEY = 'spot-error-host'
type HostSession = { gameId: string; hostToken: string }

export function HostApp() {
  const [host, setHost] = useState<HostSession | null>(null)
  const [joinUrl, setJoinUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data, mutate } = useGameState(null)

  useEffect(() => {
    setHost(readStored<HostSession>(HOST_KEY))
    setJoinUrl(window.location.origin)
  }, [])

  const game = data?.game ?? null
  const isOwner = !!host && !!game && host.gameId === game.id

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setBusy(false)
    }
  }

  const createRound = () =>
    run(async () => {
      const res = await postAction<HostSession>('create', {})
      writeStored(HOST_KEY, res)
      setHost(res)
    })

  const startRound = () =>
    run(async () => {
      if (!host) return
      await postAction('start', host)
    })

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" aria-label="جارٍ التحميل" />
      </main>
    )
  }

  const errorBanner = error && (
    <p className="text-center font-semibold text-destructive" role="alert">
      {error}
    </p>
  )

  if (!isOwner || game.phase === 'lobby') {
    const canStart = isOwner && game?.phase === 'lobby'
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row lg:items-center">
        <section className="flex flex-1 flex-col items-center gap-6 lg:items-start">
          <GameTitle />
          <p className="text-balance text-center text-xl text-muted-foreground lg:text-start md:text-2xl">
            10 أسئلة، 20 ثانية لكل سؤال. امسح الرمز وادخل باسم مستعار.
          </p>
          {joinUrl && (
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <div className="rounded-3xl bg-foreground p-4">
                <QRCodeSVG value={joinUrl} size={240} bgColor="transparent" fgColor="#1a1d3a" title="رمز الدخول للعبة" />
              </div>
              <p className="font-mono text-lg font-bold" dir="ltr">
                {joinUrl.replace(/^https?:\/\//, '')}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {canStart ? (
              <Button onClick={startRound} disabled={busy || game.playerCount === 0} className="h-14 rounded-2xl px-8 text-xl font-black">
                {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
                ابدأ اللعبة
              </Button>
            ) : (
              <Button onClick={createRound} disabled={busy} className="h-14 rounded-2xl px-8 text-xl font-black">
                {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
                فتح جولة جديدة
              </Button>
            )}
            {canStart && (
              <Button variant="outline" onClick={createRound} disabled={busy} className="h-14 rounded-2xl px-5 font-bold">
                <RotateCcw className="size-4" aria-hidden="true" />
                جولة جديدة
              </Button>
            )}
          </div>
          {!isOwner && game && game.phase !== 'finished' && (
            <p className="text-sm text-muted-foreground">
              توجد جولة جارية يديرها جهاز آخر. فتح جولة جديدة سيستبدلها.
            </p>
          )}
          {errorBanner}
        </section>

        <section className="flex w-full flex-col gap-3 rounded-3xl bg-card p-5 lg:max-w-md lg:self-stretch" aria-label="اللاعبون">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Users className="size-5 text-primary" aria-hidden="true" />
            اللاعبون
            <span className="ms-auto rounded-full bg-primary px-3 py-0.5 text-base font-black text-primary-foreground tabular-nums">
              {canStart ? game.playerCount : 0}
            </span>
          </h2>
          {canStart && data.nicknames.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-live="polite">
              {data.nicknames.map((n) => (
                <li key={n} className="rounded-full bg-secondary px-3 py-1 font-semibold animate-in fade-in zoom-in-95 duration-300">
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              {canStart ? 'بانتظار انضمام اللاعبين...' : 'افتح جولة جديدة ليتمكن اللاعبون من الانضمام.'}
            </p>
          )}
        </section>
      </main>
    )
  }

  if (game.phase === 'finished') {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center gap-8 px-6 py-8">
        <h1 className="text-4xl font-black md:text-6xl">النتائج النهائية</h1>
        <Podium entries={data.leaderboard} large />
        <Leaderboard entries={data.leaderboard.slice(3)} limit={7} title="بقية الترتيب" />
        <Button onClick={createRound} disabled={busy} className="h-14 rounded-2xl px-8 text-xl font-black">
          <RotateCcw className="size-5" aria-hidden="true" />
          إعادة اللعب
        </Button>
        {errorBanner}
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-6 py-6">
      <header className="flex items-center justify-between gap-4">
        <QuestionCounter index={game.questionIndex} total={game.totalQuestions} />
        <GameTitle size="sm" />
        {game.phase === 'question' ? (
          <Timer remainingMs={game.remainingMs} durationMs={game.durationMs} receivedAt={data.receivedAt} size="lg" />
        ) : (
          <div className="w-32 text-end text-lg font-bold text-muted-foreground md:w-40">الإجابة الصحيحة</div>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <QuestionView question={data.question!} reveal={data.reveal} showCounts large />
        </div>
        <aside className="flex w-full flex-col gap-4 lg:w-80">
          <div className="rounded-3xl bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">أجابوا</p>
            <p className="text-5xl font-black tabular-nums" aria-live="polite">
              {game.answeredCount}
              <span className="text-2xl text-muted-foreground">{` / ${game.playerCount}`}</span>
            </p>
          </div>
          {game.phase === 'reveal' && <Leaderboard entries={data.leaderboard} limit={5} title="أفضل 5" />}
        </aside>
      </div>
    </main>
  )
}
