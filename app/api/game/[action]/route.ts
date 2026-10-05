import { NextResponse, type NextRequest } from 'next/server'
import { createGame, GameError, joinGame, startGame, submitAnswer } from '@/lib/game'

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  try {
    switch (action) {
      case 'create':
        return NextResponse.json(await createGame())
      case 'start':
        await startGame(str(body.gameId), str(body.hostToken))
        return NextResponse.json({ ok: true })
      case 'join':
        return NextResponse.json(await joinGame(str(body.nickname)))
      case 'answer':
        return NextResponse.json(
          await submitAnswer(str(body.playerId), str(body.token), Number(body.questionIndex), Number(body.choice)),
        )
      default:
        return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[game] action error', action, error)
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 })
  }
}
