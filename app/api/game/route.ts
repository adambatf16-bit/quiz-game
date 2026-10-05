import { NextResponse, type NextRequest } from 'next/server'
import { getState } from '@/lib/game'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get('playerId')
  const token = req.nextUrl.searchParams.get('token')
  try {
    const state = await getState(playerId, token)
    return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[game] state error', error)
    return NextResponse.json({ error: 'تعذر تحميل حالة اللعبة' }, { status: 500 })
  }
}
