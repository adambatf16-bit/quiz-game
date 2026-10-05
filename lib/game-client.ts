'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import type { ClientGameState } from './types'

async function fetchState(url: string): Promise<ClientGameState> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('state fetch failed')
  const data = await res.json()
  return { ...data, receivedAt: Date.now() }
}

export function useGameState(player?: { id: string; token: string } | null) {
  const key = player
    ? `/api/game?playerId=${encodeURIComponent(player.id)}&token=${encodeURIComponent(player.token)}`
    : '/api/game'
  return useSWR<ClientGameState>(key, fetchState, {
    refreshInterval: 1000,
    dedupingInterval: 400,
    revalidateOnFocus: true,
    keepPreviousData: true,
  })
}

export async function postAction<T = unknown>(action: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`/api/game/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'حدث خطأ')
  return data as T
}

export function useNow(intervalMs = 100) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function readStored<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}
