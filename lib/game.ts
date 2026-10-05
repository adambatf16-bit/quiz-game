import { QUESTIONS } from './questions'
import type { GameState, LeaderboardEntry, Phase } from './types'

export const QUESTION_MS = 10_000
export const REVEAL_MS = 6_000

/* ---------------------------------------------------------------------------
 * In-memory store (no database). All state lives in this server process.
 * Every operation below is synchronous between reads and writes, so it is
 * atomic in Node's single-threaded event loop (same guarantees the guarded
 * SQL updates gave before).
 * ------------------------------------------------------------------------- */

type Player = {
  id: string
  token: string
  nickname: string
  score: number
  correct: number
  createdAt: number
  seq: number
}

type Answer = { playerId: string; choice: number; points: number }

type Game = {
  id: string
  hostToken: string
  phase: Phase
  currentQ: number
  phaseStartedAt: number
  createdAt: number
  players: Player[]
  answers: Map<number, Map<string, Answer>> // questionIndex -> playerId -> answer
}

const globalForStore = globalThis as unknown as { __quizGames?: Game[]; __quizSeq?: number }
const games: Game[] = (globalForStore.__quizGames ??= [])
const MAX_GAMES = 20

type GameRow = {
  game: Game
  id: string
  hostToken: string
  phase: Phase
  currentQ: number
  elapsed: number
}

export class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

function currentGame(): Game | null {
  return games.length ? games[games.length - 1] : null
}

export async function loadCurrentGame(): Promise<GameRow | null> {
  const g = currentGame()
  if (!g) return null
  return {
    game: g,
    id: g.id,
    hostToken: g.hostToken,
    phase: g.phase,
    currentQ: g.currentQ,
    elapsed: Date.now() - g.phaseStartedAt,
  }
}

function answersFor(g: Game, q: number): Map<string, Answer> {
  let m = g.answers.get(q)
  if (!m) {
    m = new Map()
    g.answers.set(q, m)
  }
  return m
}

/** Advances the game phase based on elapsed time. */
function advance(row: GameRow): boolean {
  const g = row.game
  if (g.phase === 'question') {
    let done = row.elapsed >= QUESTION_MS
    if (!done) {
      const players = g.players.length
      const answered = answersFor(g, g.currentQ).size
      done = players > 0 && answered >= players
    }
    if (!done) return false
    g.phase = 'reveal'
    g.phaseStartedAt = Date.now()
    return true
  }

  if (g.phase === 'reveal' && row.elapsed >= REVEAL_MS) {
    const isLast = g.currentQ + 1 >= QUESTIONS.length
    if (isLast) {
      g.phase = 'finished'
    } else {
      g.phase = 'question'
      g.currentQ = g.currentQ + 1
    }
    g.phaseStartedAt = Date.now()
    return true
  }

  return false
}

export async function getState(playerId?: string | null, token?: string | null): Promise<GameState> {
  let row = await loadCurrentGame()
  if (row && advance(row)) row = await loadCurrentGame()

  const empty: GameState = {
    game: null,
    nicknames: [],
    question: null,
    reveal: null,
    leaderboard: [],
    me: null,
  }
  if (!row) return empty
  const game = row

  // score desc, then join order asc
  const players = [...game.game.players].sort((a, b) => b.score - a.score || a.seq - b.seq)
  const answers = Array.from(answersFor(game.game, game.currentQ).values())

  const ranked: (LeaderboardEntry & { id: string; token: string })[] = players.map((p, i) => ({
    id: p.id,
    token: p.token,
    nickname: p.nickname,
    score: p.score,
    correct: p.correct,
    rank: i + 1,
  }))

  const q = QUESTIONS[game.currentQ]
  const showQuestion = game.phase !== 'lobby'
  const showReveal = game.phase === 'reveal' || game.phase === 'finished'

  const durationMs = game.phase === 'question' ? QUESTION_MS : game.phase === 'reveal' ? REVEAL_MS : 0
  const remainingMs = durationMs ? Math.max(0, durationMs - game.elapsed) : 0

  const counts = [0, 0, 0, 0]
  for (const a of answers) if (a.choice >= 0 && a.choice < 4) counts[a.choice]++

  const meRow = playerId && token ? ranked.find((p) => p.id === playerId && p.token === token) : undefined
  const myAnswer = meRow ? answers.find((a) => a.playerId === meRow.id) : undefined

  return {
    game: {
      id: game.id,
      phase: game.phase,
      questionIndex: game.currentQ,
      totalQuestions: QUESTIONS.length,
      remainingMs,
      durationMs,
      playerCount: players.length,
      answeredCount: answers.length,
    },
    nicknames: game.phase === 'lobby' ? players.slice(0, 200).map((p) => p.nickname) : [],
    question: showQuestion ? { prompt: q.prompt, table: q.table, options: [...q.options] } : null,
    reveal: showReveal ? { correct: q.correct, explanation: q.explanation, counts } : null,
    leaderboard: ranked.slice(0, 10).map(({ rank, nickname, score, correct }) => ({ rank, nickname, score, correct })),
    me: meRow
      ? {
          id: meRow.id,
          nickname: meRow.nickname,
          score: meRow.score,
          correct: meRow.correct,
          rank: meRow.rank,
          answer: myAnswer ? { choice: myAnswer.choice, points: showReveal ? myAnswer.points : 0 } : null,
        }
      : null,
  }
}

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export async function createGame() {
  const id = randomCode()
  const hostToken = crypto.randomUUID()
  const now = Date.now()
  games.push({
    id,
    hostToken,
    phase: 'lobby',
    currentQ: 0,
    phaseStartedAt: now,
    createdAt: now,
    players: [],
    answers: new Map(),
  })
  // keep memory bounded: drop the oldest games
  while (games.length > MAX_GAMES) games.shift()
  return { gameId: id, hostToken }
}

export async function startGame(gameId: string, hostToken: string) {
  const row = await loadCurrentGame()
  if (!row || row.id !== gameId || row.hostToken !== hostToken) {
    throw new GameError('غير مصرح لك بالتحكم في هذه اللعبة', 403)
  }
  if (row.phase !== 'lobby') throw new GameError('اللعبة بدأت بالفعل')
  row.game.phase = 'question'
  row.game.currentQ = 0
  row.game.phaseStartedAt = Date.now()
}

export async function joinGame(rawNickname: string) {
  const nickname = rawNickname.replace(/\s+/g, ' ').trim()
  if (nickname.length < 2 || nickname.length > 20) {
    throw new GameError('الاسم المستعار يجب أن يكون بين 2 و 20 حرفًا')
  }
  const row = await loadCurrentGame()
  if (!row || row.phase === 'finished') throw new GameError('لا توجد لعبة متاحة حاليًا، انتظر المضيف')

  const lower = nickname.toLowerCase()
  if (row.game.players.some((p) => p.nickname.toLowerCase() === lower)) {
    throw new GameError('هذا الاسم مستخدم، اختر اسمًا آخر')
  }

  const id = crypto.randomUUID()
  const token = crypto.randomUUID()
  const seq = (globalForStore.__quizSeq = (globalForStore.__quizSeq ?? 0) + 1)
  row.game.players.push({ id, token, nickname, score: 0, correct: 0, createdAt: Date.now(), seq })
  return { playerId: id, token, gameId: row.id, nickname }
}

export async function submitAnswer(playerId: string, token: string, questionIndex: number, choice: number) {
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) throw new GameError('إجابة غير صالحة')
  const row = await loadCurrentGame()
  if (!row || row.phase !== 'question' || row.currentQ !== questionIndex || row.elapsed >= QUESTION_MS) {
    throw new GameError('انتهى وقت الإجابة')
  }

  const player = row.game.players.find((p) => p.id === playerId && p.token === token)
  if (!player) throw new GameError('لاعب غير معروف', 403)

  const isCorrect = QUESTIONS[questionIndex].correct === choice
  const speed = Math.max(0, 1 - row.elapsed / QUESTION_MS)
  const points = isCorrect ? Math.round(500 + 500 * speed) : 0

  const qa = answersFor(row.game, questionIndex)
  if (qa.has(playerId)) return { accepted: false }

  qa.set(playerId, { playerId, choice, points })
  if (isCorrect) {
    player.score += points
    player.correct += 1
  }
  return { accepted: true }
}
