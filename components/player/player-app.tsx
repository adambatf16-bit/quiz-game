'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postAction, readStored, useGameState, writeStored } from '@/lib/game-client'
import { GameTitle } from '@/components/game/game-header'
import { JoinScreen } from './join-screen'
import { PlayScreen } from './play-screen'
import { ResultsScreen } from './results-screen'

const PLAYER_KEY = 'spot-error-player'
const NICK_KEY = 'spot-error-nickname'

type StoredPlayer = { id: string; token: string; gameId: string; nickname: string }

function CenteredMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
      <GameTitle size="sm" />
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
        <p className="text-2xl font-bold">{title}</p>
        {children}
      </div>
    </main>
  )
}

export function PlayerApp() {
  const [player, setPlayer] = useState<StoredPlayer | null>(null)
  const [lastNickname, setLastNickname] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [waitingReplay, setWaitingReplay] = useState(false)
  const [pending, setPending] = useState<{ q: number; choice: number } | null>(null)
  const rejoining = useRef(false)

  useEffect(() => {
    setPlayer(readStored<StoredPlayer>(PLAYER_KEY))
    setLastNickname(readStored<string>(NICK_KEY) ?? '')
    setHydrated(true)
  }, [])

  const { data, mutate } = useGameState(player)
  const game = data?.game ?? null

  const join = useCallback(
    async (nickname: string) => {
      const res = await postAction<{ playerId: string; token: string; gameId: string; nickname: string }>('join', {
        nickname,
      })
      const stored = { id: res.playerId, token: res.token, gameId: res.gameId, nickname: res.nickname }
      writeStored(PLAYER_KEY, stored)
      writeStored(NICK_KEY, res.nickname)
      setLastNickname(res.nickname)
      setPlayer(stored)
      setPending(null)
      await mutate()
    },
    [mutate],
  )

  useEffect(() => {
    if (!waitingReplay || !game || game.phase !== 'lobby' || game.id === player?.gameId || rejoining.current) return
    rejoining.current = true
    join(lastNickname)
      .catch(() => {
        setPlayer(null)
        writeStored(PLAYER_KEY, null)
      })
      .finally(() => {
        rejoining.current = false
        setWaitingReplay(false)
      })
  }, [waitingReplay, game, player?.gameId, lastNickname, join])

  async function handleSelect(choice: number) {
    if (!player || !game || game.phase !== 'question') return
    const q = game.questionIndex
    setPending({ q, choice })
    try {
      await postAction('answer', { playerId: player.id, token: player.token, questionIndex: q, choice })
    } catch {
      setPending(null)
    }
    mutate()
  }

  function goHome() {
    writeStored(PLAYER_KEY, null)
    setPlayer(null)
    setWaitingReplay(false)
    setPending(null)
  }

  if (!hydrated || !data) return <CenteredMessage title="جارٍ التحميل..." />

  if (waitingReplay) {
    return (
      <CenteredMessage title="بانتظار جولة جديدة">
        <p className="text-muted-foreground">سيتم إدخالك تلقائيًا عندما يفتح المضيف جولة جديدة.</p>
        <button type="button" onClick={goHome} className="text-sm text-muted-foreground underline underline-offset-4">
          العودة للبداية
        </button>
      </CenteredMessage>
    )
  }

  const isMember = !!data.me && !!game && player?.gameId === game.id

  if (!isMember) {
    return (
      <JoinScreen
        key={lastNickname}
        defaultNickname={lastNickname}
        canJoin={!!game && game.phase !== 'finished'}
        onJoin={join}
      />
    )
  }

  if (game.phase === 'lobby') {
    return (
      <CenteredMessage title={`أهلًا ${data.me!.nickname}!`}>
        <p className="text-lg text-muted-foreground">بانتظار المضيف لبدء اللعبة...</p>
        <p className="rounded-full bg-card px-4 py-1.5 text-sm font-semibold tabular-nums">{`${game.playerCount} لاعب في الغرفة`}</p>
      </CenteredMessage>
    )
  }

  if (game.phase === 'finished') {
    return (
      <ResultsScreen
        state={data}
        onReplay={() => {
          setPending(null)
          setWaitingReplay(true)
        }}
        onHome={goHome}
      />
    )
  }

  const selected =
    data.me?.answer?.choice ?? (pending && pending.q === game.questionIndex ? pending.choice : null)

  return <PlayScreen state={data} selected={selected} onSelect={handleSelect} />
}
