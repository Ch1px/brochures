'use client'

import { useEffect, useState } from 'react'

type CardData =
  | { kind: 'quote'; message: string; race: string; lap: number | null }
  | { kind: 'countdown'; race: string; starts: string }
  | { kind: 'countdown-past'; race: string; when: string }
  | { kind: 'idle' }
  | { kind: 'error'; error: string }

function sentenceCase(s: string): string {
  const lower = s.toLowerCase().trim()
  if (!lower) return s
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function formatDelta(ms: number): string {
  const abs = Math.abs(ms)
  const days = Math.floor(abs / 86_400_000)
  const hours = Math.floor((abs % 86_400_000) / 3_600_000)
  const minutes = Math.floor((abs % 3_600_000) / 60_000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function LatestUpdateCard() {
  const [data, setData] = useState<CardData | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const r = await fetch('/api/easter-egg/sidebar-card', { cache: 'no-store' })
        const d: CardData = await r.json()
        if (!cancelled) setData(d)
      } catch {
        if (!cancelled) setData({ kind: 'error', error: 'fetch' })
      }
    }

    load()
    const id = setInterval(load, 25_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!data || (data.kind !== 'countdown' && data.kind !== 'countdown-past')) return
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [data])

  if (!data) {
    return (
      <div className="admin-shell-update">
        <div className="admin-shell-update-label">Race control</div>
        <div className="admin-shell-update-text">Tuning in…</div>
      </div>
    )
  }

  if (data.kind === 'quote') {
    const lap = data.lap ? ` · Lap ${data.lap}` : ''
    return (
      <div className="admin-shell-update">
        <div className="admin-shell-update-label">Race control · {data.race}{lap}</div>
        <div className="admin-shell-update-text admin-shell-update-quote">{sentenceCase(data.message)}</div>
      </div>
    )
  }

  if (data.kind === 'countdown') {
    const delta = new Date(data.starts).getTime() - Date.now()
    return (
      <div className="admin-shell-update">
        <div className="admin-shell-update-label">Lights out · {data.race}</div>
        <div className="admin-shell-update-text">
          <span className="admin-shell-update-strong">{formatDelta(delta)}</span> to go
        </div>
      </div>
    )
  }

  if (data.kind === 'countdown-past') {
    const delta = Date.now() - new Date(data.when).getTime()
    return (
      <div className="admin-shell-update">
        <div className="admin-shell-update-label">Last race · {data.race}</div>
        <div className="admin-shell-update-text">
          <span className="admin-shell-update-strong">{formatDelta(delta)}</span> ago
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell-update">
      <div className="admin-shell-update-label">Latest update</div>
      <div className="admin-shell-update-text">Off-season. See you at lights out.</div>
    </div>
  )
}
