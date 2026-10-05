export type Phase = 'lobby' | 'question' | 'reveal' | 'finished'

export type LeaderboardEntry = {
  rank: number
  nickname: string
  score: number
  correct: number
}

export type PublicQuestion = {
  prompt: string
  table?: string[][]
  options: string[]
}

export type RevealInfo = {
  correct: number
  explanation: string
  counts: number[]
}

export type MeInfo = {
  id: string
  nickname: string
  score: number
  correct: number
  rank: number
  answer: { choice: number; points: number } | null
}

export type GameState = {
  game: {
    id: string
    phase: Phase
    questionIndex: number
    totalQuestions: number
    remainingMs: number
    durationMs: number
    playerCount: number
    answeredCount: number
  } | null
  nicknames: string[]
  question: PublicQuestion | null
  reveal: RevealInfo | null
  leaderboard: LeaderboardEntry[]
  me: MeInfo | null
}

export type ClientGameState = GameState & { receivedAt: number }
