'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { LatestUpdateCard } from './LatestUpdateCard'

type ReplayStint = {
  lapStart: number
  lapEnd: number
  compound: string
}

type ReplayDriver = {
  number: number
  acronym: string
  name: string
  team: string
  color: string
  finalPosition: number | null
  startSampleIndex: number
  endSampleIndex: number
  samples: number[] // [x0, y0, x1, y1, …] quantised 0–10000
  stints: ReplayStint[]
}

type RaceControlEvent = {
  tMs: number
  message: string
  flag: string | null
}

type RaceReplay = {
  kind: 'replay'
  generatedAt: string
  race: {
    name: string
    circuit: string
    country: string | null
    raceSessionKey: number
    year: number
  }
  viewBox: [number, number]
  trackPath: string
  sampleIntervalMs: number
  durationMs: number
  lapTimeline: number[]
  totalLaps: number
  raceControl: RaceControlEvent[]
  drivers: ReplayDriver[]
}

type CardState = 'loading' | 'fallback' | { kind: 'replay'; data: RaceReplay }

const SPEEDS = [1, 5, 10] as const
type Speed = (typeof SPEEDS)[number]
const DEFAULT_SPEED: Speed = 10
const FPS = 30
const FRAME_INTERVAL_MS = 1000 / FPS

export function RaceReplayCard() {
  const [state, setState] = useState<CardState>('loading')

  useEffect(() => {
    let cancelled = false
    fetch('/race-replays/latest.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { kind: 'fallback' }))
      .then((d: unknown) => {
        if (cancelled) return
        if (
          d &&
          typeof d === 'object' &&
          (d as { kind?: string }).kind === 'replay' &&
          Array.isArray((d as RaceReplay).drivers)
        ) {
          setState({ kind: 'replay', data: d as RaceReplay })
        } else {
          setState('fallback')
        }
      })
      .catch(() => {
        if (!cancelled) setState('fallback')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') return <LoadingCard />
  if (state === 'fallback') return <LatestUpdateCard />
  return <ReplayAnimation data={state.data} />
}

function LoadingCard() {
  return (
    <div className="admin-shell-replay">
      <div className="admin-shell-replay-label">Last race</div>
      <div className="admin-shell-replay-text">Tuning in…</div>
    </div>
  )
}

function lapForRaceTime(timeline: number[], raceTimeMs: number): number {
  if (timeline.length === 0) return 0
  // Binary search for largest index with timeline[i] <= raceTimeMs.
  let lo = 0
  let hi = timeline.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (timeline[mid] <= raceTimeMs) {
      found = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return found + 1 // lap number is 1-indexed
}

function rcIndexForRaceTime(events: RaceControlEvent[], raceTimeMs: number): number {
  if (events.length === 0) return -1
  let lo = 0
  let hi = events.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (events[mid].tMs <= raceTimeMs) {
      found = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return found
}

function sentenceCase(s: string): string {
  const trimmed = s.trim().toLowerCase()
  if (!trimmed) return s
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

const FLAG_COLORS: Record<string, string> = {
  RED: '#dc2626',
  YELLOW: '#facc15',
  'DOUBLE YELLOW': '#facc15',
  BLUE: '#2563eb',
  GREEN: '#22c55e',
  WHITE: '#f3f4f6',
  CHEQUERED: 'var(--chrome-text)',
  'BLACK AND WHITE': 'var(--chrome-text)',
  BLACK: 'var(--chrome-text)',
  CLEAR: 'var(--chrome-border-strong)',
}

// F1 tyre compound icon assets in /public/tyres/.
const COMPOUND_IMAGES: Record<string, string> = {
  SOFT: '/tyres/soft.png',
  MEDIUM: '/tyres/medium.png',
  HARD: '/tyres/hard.png',
  INTERMEDIATE: '/tyres/inter.png',
  WET: '/tyres/wet.png',
}
const COMPOUND_LABELS: Record<string, string> = {
  SOFT: 'Soft',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  INTERMEDIATE: 'Inter',
  WET: 'Wet',
}

function compoundForLap(stints: ReplayStint[] | undefined, lap: number): string | null {
  if (!stints || stints.length === 0) return null
  for (const s of stints) {
    if (s.lapStart <= lap && lap <= s.lapEnd) return s.compound
  }
  // Lap is beyond the last recorded stint — assume the latest compound is still on.
  return stints[stints.length - 1].compound
}

function ReplayAnimation({ data }: { data: RaceReplay }) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const circleRefs = useRef<Array<SVGCircleElement | null>>([])
  const rafRef = useRef<number | null>(null)
  const lastDrawRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const raceTimeRef = useRef(0) // ms of race time elapsed (0 .. durationMs)
  const pausedRef = useRef(false)
  const visibleRef = useRef(true)
  const speedRef = useRef<Speed>(DEFAULT_SPEED)
  const lastLapRef = useRef(0)
  const lastRcIdxRef = useRef(-2)

  const [speed, setSpeed] = useState<Speed>(DEFAULT_SPEED)
  const [currentLap, setCurrentLap] = useState(() =>
    Math.max(1, lapForRaceTime(data.lapTimeline, 0)),
  )
  const [currentRc, setCurrentRc] = useState<RaceControlEvent | null>(() => {
    const idx = rcIndexForRaceTime(data.raceControl, 0)
    return idx >= 0 ? data.raceControl[idx] : null
  })
  const [hover, setHover] = useState<{
    driver: ReplayDriver
    x: number
    y: number
  } | null>(null)

  const winner =
    data.drivers.find((d) => d.finalPosition === 1) ?? data.drivers[0] ?? null
  const [viewW, viewH] = data.viewBox
  const sampleCount = Math.floor(data.durationMs / data.sampleIntervalMs)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  function handleRestart() {
    raceTimeRef.current = 0
    lastFrameTimeRef.current = 0
    lastLapRef.current = 0
    lastRcIdxRef.current = -2
    setCurrentLap(Math.max(1, lapForRaceTime(data.lapTimeline, 0)))
    const idx = rcIndexForRaceTime(data.raceControl, 0)
    setCurrentRc(idx >= 0 ? data.raceControl[idx] : null)
  }

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const onVisibility = () => {
      visibleRef.current = document.visibilityState !== 'hidden'
      if (!visibleRef.current) lastFrameTimeRef.current = 0
    }
    document.addEventListener('visibilitychange', onVisibility)

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visibleRef.current = e.isIntersecting
          if (!e.isIntersecting) lastFrameTimeRef.current = 0
        }
      },
      { threshold: 0.01 },
    )
    io.observe(stage)

    function frame(now: number) {
      rafRef.current = requestAnimationFrame(frame)
      if (pausedRef.current || !visibleRef.current) {
        lastFrameTimeRef.current = now
        return
      }

      // Advance race time by wall-clock delta × speed.
      if (lastFrameTimeRef.current > 0) {
        const wallDelta = now - lastFrameTimeRef.current
        raceTimeRef.current += wallDelta * speedRef.current
        if (raceTimeRef.current >= data.durationMs) {
          raceTimeRef.current = raceTimeRef.current % data.durationMs
        }
      }
      lastFrameTimeRef.current = now

      // Throttle paint to FPS.
      if (now - lastDrawRef.current < FRAME_INTERVAL_MS) return
      lastDrawRef.current = now

      const raceTime = raceTimeRef.current
      const sampleIdxFloat = (raceTime / data.durationMs) * sampleCount
      const i = Math.floor(sampleIdxFloat)
      const lerp = sampleIdxFloat - i

      for (let d = 0; d < data.drivers.length; d++) {
        const driver = data.drivers[d]
        const ref = circleRefs.current[d]
        if (!ref) continue
        const retired = i > driver.endSampleIndex
        if (retired) {
          // Drop DNF cars off the track entirely (they fade out via CSS transition).
          ref.style.opacity = '0'
          ref.style.pointerEvents = 'none'
          continue
        }
        const clamped = Math.max(
          driver.startSampleIndex,
          Math.min(driver.endSampleIndex, i),
        )
        const ax = driver.samples[clamped * 2]
        const ay = driver.samples[clamped * 2 + 1]
        const next = clamped + 1
        const bx = next <= driver.endSampleIndex ? driver.samples[next * 2] : ax
        const by = next <= driver.endSampleIndex ? driver.samples[next * 2 + 1] : ay
        const x = ((ax + (bx - ax) * lerp) / 10000) * viewW
        const y = ((ay + (by - ay) * lerp) / 10000) * viewH
        ref.style.transform = `translate(${x}px, ${y}px)`
        ref.style.opacity = '1'
        ref.style.pointerEvents = 'all'
      }

      // Update lap counter only when it changes.
      const lap = lapForRaceTime(data.lapTimeline, raceTime)
      if (lap !== lastLapRef.current) {
        lastLapRef.current = lap
        setCurrentLap(Math.max(1, lap))
      }

      // Update race-control message only when it changes.
      const rcIdx = rcIndexForRaceTime(data.raceControl, raceTime)
      if (rcIdx !== lastRcIdxRef.current) {
        lastRcIdxRef.current = rcIdx
        setCurrentRc(rcIdx >= 0 ? data.raceControl[rcIdx] : null)
      }
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
      io.disconnect()
    }
  }, [data, sampleCount, viewW, viewH])

  const lapText =
    data.totalLaps > 0
      ? `Lap ${Math.min(currentLap, data.totalLaps)} / ${data.totalLaps}`
      : `Lap ${currentLap}`

  return (
    <div className="admin-shell-replay">
      <div className="admin-shell-replay-label">
        Last race · {data.race.circuit}
      </div>
      <div
        ref={stageRef}
        className="admin-shell-replay-stage"
        onMouseEnter={() => {
          pausedRef.current = true
        }}
        onMouseLeave={() => {
          pausedRef.current = false
          lastFrameTimeRef.current = 0
          setHover(null)
        }}
      >
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="admin-shell-replay-svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <path d={data.trackPath} className="admin-shell-replay-track" />
          {data.drivers.map((driver, i) => {
            // DNF / unclassified drivers are skipped entirely — frame loop
            // tolerates the resulting null ref via its `if (!ref) continue`.
            if (driver.finalPosition === null) return null
            return (
            <circle
              key={driver.number}
              ref={(el) => {
                circleRefs.current[i] = el
              }}
              cx={0}
              cy={0}
              r={Math.max(viewW, viewH) * 0.012}
              fill={driver.color}
              stroke="rgba(0,0,0,0.55)"
              strokeWidth={Math.max(viewW, viewH) * 0.002}
              className="admin-shell-replay-dot"
              onMouseEnter={(e) => {
                setHover({ driver, x: e.clientX, y: e.clientY })
              }}
              onMouseMove={(e) => {
                setHover((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
              }}
            />
            )
          })}
        </svg>
        {hover ? (
          <div
            className="admin-shell-replay-tooltip"
            style={{ left: hover.x + 14, top: hover.y - 22 }}
          >
            <span className="admin-shell-replay-tooltip-number">
              {hover.driver.number}
            </span>
            <span
              className="admin-shell-replay-tooltip-bar"
              style={{ background: hover.driver.color }}
              aria-hidden
            />
            <div className="admin-shell-replay-tooltip-info">
              <span className="admin-shell-replay-tooltip-name">
                {(() => {
                  const parts = hover.driver.name.trim().split(/\s+/)
                  const last = parts[parts.length - 1] ?? hover.driver.name
                  const first = parts.slice(0, -1).join(' ')
                  return (
                    <>
                      {first ? (
                        <span className="admin-shell-replay-tooltip-first">
                          {first}{' '}
                        </span>
                      ) : null}
                      <span className="admin-shell-replay-tooltip-last">
                        {last}
                      </span>
                    </>
                  )
                })()}
              </span>
              <span className="admin-shell-replay-tooltip-team">
                {hover.driver.team}
                {hover.driver.finalPosition
                  ? ` · P${hover.driver.finalPosition}`
                  : ''}
              </span>
            </div>
            {(() => {
              const compound = compoundForLap(hover.driver.stints, currentLap)
              if (!compound) return null
              const src = COMPOUND_IMAGES[compound]
              if (!src) return null
              return (
                <div
                  className="admin-shell-replay-tooltip-tyre"
                  title={`${COMPOUND_LABELS[compound] ?? compound} compound`}
                >
                  <img src={src} alt="" />
                </div>
              )
            })()}
          </div>
        ) : null}
      </div>

      <div className="admin-shell-replay-meta">
        <span className="admin-shell-replay-lap">{lapText}</span>
        {winner ? (
          <span className="admin-shell-replay-meta-right">
            <span
              className="admin-shell-replay-caption-swatch"
              style={{ background: winner.color }}
            />
            {winner.acronym}
          </span>
        ) : null}
      </div>

      <div
        className="admin-shell-replay-rc"
        style={{
          borderLeftColor: currentRc?.flag
            ? FLAG_COLORS[currentRc.flag] ?? 'var(--brand-red)'
            : 'var(--chrome-border-strong)',
        }}
      >
        <span className="admin-shell-replay-rc-label">Race control</span>
        <span className="admin-shell-replay-rc-text" title={currentRc?.message ?? ''}>
          {currentRc ? sentenceCase(currentRc.message) : 'Awaiting lights out…'}
        </span>
      </div>

      <div className="admin-shell-replay-controls" role="group" aria-label="Playback controls">
        <button
          type="button"
          className="admin-shell-replay-control admin-shell-replay-restart"
          onClick={handleRestart}
          aria-label="Restart from lap 1"
          title="Restart"
        >
          <RotateCcw size={11} aria-hidden />
        </button>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className="admin-shell-replay-control admin-shell-replay-speed"
            aria-pressed={speed === s}
            onClick={() => setSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  )
}
