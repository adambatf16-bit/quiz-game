'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, MonitorPlay } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GameTitle } from '@/components/game/game-header'

type JoinScreenProps = {
  defaultNickname: string
  canJoin: boolean
  onJoin: (nickname: string) => Promise<void>
}

export function JoinScreen({ defaultNickname, canJoin, onJoin }: JoinScreenProps) {
  const [nickname, setNickname] = useState(defaultNickname)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      await onJoin(nickname)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-10">
      <div className="flex flex-col items-center gap-4">
        <GameTitle />
        <p className="max-w-md text-balance text-center text-lg text-muted-foreground md:text-xl">
          10 أسئلة، 10 ثوانٍ لكل سؤال. هل تستطيع اكتشاف أخطاء البيانات؟
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3 rounded-3xl bg-card p-5 shadow-xl">
        <label htmlFor="nickname" className="text-sm font-semibold text-muted-foreground">
          اسمك المستعار
        </label>
        <input
          id="nickname"
          name="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          minLength={2}
          required
          autoComplete="off"
          placeholder="مثال: صقر البيانات"
          className="h-14 rounded-2xl border-2 border-input bg-background px-4 text-center text-xl font-bold outline-none placeholder:font-medium placeholder:text-muted-foreground/60 focus:border-primary"
        />
        <Button
          type="submit"
          disabled={!canJoin || loading || nickname.trim().length < 2}
          className="h-14 rounded-2xl text-xl font-black"
        >
          {loading ? <Loader2 className="size-6 animate-spin" aria-label="جارٍ الدخول" /> : 'ابدأ اللعبة'}
        </Button>
        {!canJoin && (
          <p className="text-center text-sm text-muted-foreground">لا توجد جولة مفتوحة الآن. انتظر المضيف لفتح جولة جديدة.</p>
        )}
        {error && (
          <p className="text-center text-sm font-semibold text-destructive" role="alert">
            {error}
          </p>
        )}
        <p className="text-center text-xs text-muted-foreground">لا نطلب أي معلومات شخصية — اسم مستعار فقط.</p>
      </form>

      <Link
        href="/host"
        className="flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <MonitorPlay className="size-4" aria-hidden="true" />
        شاشة المضيف
      </Link>
    </main>
  )
}
