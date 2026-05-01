'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import './easter-egg.css'
import {
  type Track,
  type TrackId,
  type Sample,
  TRACK_LIST,
  buildTrack,
  SLOT,
} from './easter-egg-tracks'
import { getCarPath, CAR_VBOX_W, CAR_VBOX_H } from './easter-egg-car'

const CAR_LEN = 30
const CAR_HEIGHT = CAR_LEN * (CAR_VBOX_H / CAR_VBOX_W)

// ────────────────────────── Physics ──────────────────────────────
const MAX_SPEED = 620
const ACCEL = 490
const COAST_DECEL = 500
const CORNER_GRIP = 490
const GRIP_LENIENCY = 1.10
const OVERSPEED_GRACE = 0.30
const AI_TARGET_STRAIGHT = 550
const AI_TARGET_CORNER = 445
const AI_LOOKAHEAD = 150
const AI_MISTAKE_CHANCE = 0.28
const AI_MISTAKE_BOOST = 1.18
const DERAIL_TIME = 0.6
const TOTAL_LAPS = 3

const CANVAS_W = 1400
const CANVAS_H = 800

type Phase = 'idle' | 'countdown' | 'racing' | 'finished'

type Car = {
  s: number
  v: number
  laps: number
  derailedFor: number
  overspeedFor: number
  lastS: number
}

// Module-level handle so trigger UIs anywhere in the tree can open the game
// without having to share React state. The mounted <EasterEgg /> instance
// registers its setter on mount and clears it on unmount.
let openHandler: (() => void) | null = null
export function openEasterEgg() {
  openHandler?.()
}

export function EasterEgg() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    openHandler = () => setOpen(true)
    return () => {
      if (openHandler) openHandler = null
    }
  }, [])

  return open ? <ScalextricGame onClose={() => setOpen(false)} /> : null
}

function ScalextricGame({ onClose }: { onClose: () => void }) {
  const [trackId, setTrackId] = useState<TrackId>('spain')

  // Build (or rebuild) the track when the selection changes. Memoised so
  // the SVG sampling is only paid once per track id.
  const track = useMemo(() => buildTrack(trackId, CANVAS_W, CANVAS_H), [trackId])
  const trackRef = useRef<Track>(track)
  trackRef.current = track

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const phaseRef = useRef<Phase>('idle')
  const throttleRef = useRef(false)
  const playerRef = useRef<Car>({ s: 0, v: 0, laps: 0, derailedFor: 0, overspeedFor: 0, lastS: 0 })
  const aiRef = useRef<Car>({ s: 0, v: 0, laps: 0, derailedFor: 0, overspeedFor: 0, lastS: 0 })
  const countdownRef = useRef(3)
  const winnerRef = useRef<'player' | 'ai' | null>(null)
  const aiPrevCornerRef = useRef(false)
  const aiMistakeRef = useRef(false)

  const [, force] = useState(0)
  const rerender = useCallback(() => force((n) => n + 1), [])

  const start = useCallback(() => {
    playerRef.current = { s: 0, v: 0, laps: 0, derailedFor: 0, overspeedFor: 0, lastS: 0 }
    aiRef.current = { s: 0, v: 0, laps: 0, derailedFor: 0, overspeedFor: 0, lastS: 0 }
    aiPrevCornerRef.current = false
    aiMistakeRef.current = false
    countdownRef.current = 3
    winnerRef.current = null
    phaseRef.current = 'countdown'
    rerender()
  }, [rerender])

  // Restart whenever the modal opens or the track changes
  useEffect(() => {
    start()
  }, [start, trackId])

  // ────────────── Input handling ──────────────
  useEffect(() => {
    const setThrottle = (v: boolean) => {
      throttleRef.current = v
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault()
        setThrottle(true)
      }
      if (e.key === 'Enter' && phaseRef.current === 'finished') {
        start()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        setThrottle(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [onClose, start])

  // ────────────── Game loop + render ──────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()
    let countdownTimer = 0

    const tick = (now: number) => {
      const dtRaw = (now - last) / 1000
      const dt = Math.min(dtRaw, 1 / 30)
      last = now

      const player = playerRef.current
      const ai = aiRef.current
      const phase = phaseRef.current
      const t = trackRef.current

      if (phase === 'countdown') {
        countdownTimer += dt
        if (countdownTimer >= 1) {
          countdownTimer = 0
          countdownRef.current -= 1
          if (countdownRef.current <= 0) {
            phaseRef.current = 'racing'
          }
          rerender()
        }
      } else if (phase === 'racing') {
        // ── Player ──
        if (player.derailedFor > 0) {
          player.derailedFor -= dt
          player.v = Math.max(0, player.v - COAST_DECEL * 1.5 * dt)
        } else if (throttleRef.current) {
          player.v = Math.min(MAX_SPEED, player.v + ACCEL * dt)
        } else {
          player.v = Math.max(0, player.v - COAST_DECEL * dt)
        }

        // ── AI ──
        const aiHere = t.sample(ai.s, 0)
        const aiAhead = t.sample(ai.s + AI_LOOKAHEAD, 0)
        const aiInOrApproachingCorner = aiAhead.isCorner || aiHere.isCorner
        const enteredCorner = aiHere.isCorner && !aiPrevCornerRef.current
        if (enteredCorner && ai.derailedFor <= 0) {
          aiMistakeRef.current = Math.random() < AI_MISTAKE_CHANCE
        }
        if (!aiHere.isCorner) aiMistakeRef.current = false
        aiPrevCornerRef.current = aiHere.isCorner

        const baseTarget = aiInOrApproachingCorner ? AI_TARGET_CORNER : AI_TARGET_STRAIGHT
        const aiTarget = aiMistakeRef.current && aiHere.isCorner
          ? CORNER_GRIP * GRIP_LENIENCY * AI_MISTAKE_BOOST
          : baseTarget

        if (ai.derailedFor > 0) {
          ai.derailedFor -= dt
          ai.v = Math.max(0, ai.v - COAST_DECEL * 1.5 * dt)
        } else if (ai.v < aiTarget) {
          ai.v = Math.min(aiTarget, ai.v + ACCEL * 0.85 * dt)
        } else {
          ai.v = Math.max(aiTarget, ai.v - COAST_DECEL * dt)
        }

        // Advance positions
        player.s += player.v * dt
        ai.s += ai.v * dt

        // Corner-grip check (both cars share the same physics)
        applyCornerGrip(player, t, dt)
        applyCornerGrip(ai, t, dt)

        // Lap detection: arc-length crossing the start line (s wraps via mod)
        const len = t.length
        for (const c of [player, ai]) {
          const sMod = ((c.s % len) + len) % len
          const lastMod = ((c.lastS % len) + len) % len
          if (sMod < lastMod) c.laps += 1
          c.lastS = c.s
        }

        if (player.laps >= TOTAL_LAPS || ai.laps >= TOTAL_LAPS) {
          phaseRef.current = 'finished'
          winnerRef.current = player.laps >= TOTAL_LAPS ? 'player' : 'ai'
          rerender()
        }
      }

      // ────────────── Render ──────────────
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t.draw(ctx)

      const playerWarn = Math.min(1, player.overspeedFor / OVERSPEED_GRACE)
      const aiWarn = Math.min(1, ai.overspeedFor / OVERSPEED_GRACE)
      drawCar(ctx, t.sample(player.s, SLOT), '#cf212a', player.derailedFor > 0, playerWarn, now)
      drawCar(ctx, t.sample(ai.s, -SLOT), '#e5e5e5', ai.derailedFor > 0, aiWarn, now)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rerender])

  const phase = phaseRef.current
  const player = playerRef.current
  const ai = aiRef.current
  const playerLap = Math.min(TOTAL_LAPS, player.laps + 1)
  const aiLap = Math.min(TOTAL_LAPS, ai.laps + 1)

  const showPicker = phase === 'countdown' || phase === 'finished'

  return (
    <div className="egg-game-root" role="dialog" aria-label="Scalextric race">
      <button className="egg-game-close" type="button" onClick={onClose} aria-label="Close">
        ×
      </button>

      <div className="egg-game-stage">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="egg-game-canvas"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            throttleRef.current = true
          }}
          onPointerUp={(e) => {
            try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
            throttleRef.current = false
          }}
          onPointerCancel={() => { throttleRef.current = false }}
          onPointerLeave={() => { throttleRef.current = false }}
        />

        {phase === 'countdown' ? (
          <div className="egg-game-overlay">
            <div className="egg-game-countdown">
              {countdownRef.current > 0 ? countdownRef.current : 'GO'}
            </div>
          </div>
        ) : null}

        {phase === 'finished' ? (
          <div className="egg-game-overlay">
            <div className="egg-game-result">
              <div className="egg-game-result-title">
                {winnerRef.current === 'player' ? 'Chequered flag.' : 'Pipped at the line.'}
              </div>
              <div className="egg-game-result-sub">
                You {winnerRef.current === 'player' ? 'won' : 'lost'} the race.
              </div>
              <div className="egg-game-result-actions">
                <button type="button" className="egg-game-btn primary" onClick={start}>
                  Race again
                </button>
                <button type="button" className="egg-game-btn" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showPicker ? (
        <div className="egg-game-tracks" role="tablist" aria-label="Track">
          {TRACK_LIST.map((tr) => (
            <button
              key={tr.id}
              type="button"
              role="tab"
              aria-selected={tr.id === trackId}
              className={`egg-game-track-btn${tr.id === trackId ? ' active' : ''}`}
              onClick={() => setTrackId(tr.id)}
            >
              {tr.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="egg-game-hud">
        <div className="egg-game-hud-row">
          <span className="egg-game-hud-dot" style={{ background: '#cf212a' }} />
          <span>You</span>
          <span className="egg-game-hud-laps">Lap {playerLap}/{TOTAL_LAPS}</span>
        </div>
        <div className="egg-game-hud-row">
          <span className="egg-game-hud-dot" style={{ background: '#e5e5e5' }} />
          <span>CPU</span>
          <span className="egg-game-hud-laps">Lap {aiLap}/{TOTAL_LAPS}</span>
        </div>
        <div className="egg-game-hud-hint">
          Hold <kbd>Space</kbd> to throttle. Ease off into corners — too fast and you'll spin off.
        </div>
      </div>
    </div>
  )
}

function applyCornerGrip(car: Car, track: Track, dt: number) {
  if (car.derailedFor > 0) return
  const pt = track.sample(car.s, 0)
  const overspeed = pt.isCorner && car.v > CORNER_GRIP * GRIP_LENIENCY
  if (overspeed) {
    car.overspeedFor += dt
    if (car.overspeedFor >= OVERSPEED_GRACE) {
      car.derailedFor = DERAIL_TIME
      car.overspeedFor = 0
      car.v = Math.max(60, car.v * 0.35)
    }
  } else {
    car.overspeedFor = Math.max(0, car.overspeedFor - dt * 1.5)
  }
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  sample: Sample,
  color: string,
  derailed: boolean,
  warn: number,
  now: number,
) {
  const carPath = getCarPath()
  ctx.save()
  ctx.translate(sample.x, sample.y)
  ctx.rotate(sample.angle)

  if (!derailed && warn > 0.05) {
    ctx.shadowColor = `rgba(255, 80, 90, ${0.35 + warn * 0.55})`
    ctx.shadowBlur = 5 + warn * 14
    if (warn > 0.5) {
      ctx.rotate(Math.sin(now / 30) * 0.05 * warn)
    }
  }

  if (derailed) {
    const wobble = Math.sin(now / 60) * 0.4
    ctx.rotate(wobble)
  }

  // Soft drop shadow under the car (separate from warn glow above)
  if (!derailed && warn < 0.2) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 1.5
  }

  const fill = derailed && Math.floor(now / 80) % 2 === 0 ? '#fff' : color

  if (carPath) {
    ctx.save()
    // Map viewBox space → car-render box, centered on origin and rotated to track tangent.
    ctx.scale(CAR_LEN / CAR_VBOX_W, CAR_HEIGHT / CAR_VBOX_H)
    ctx.translate(-CAR_VBOX_W / 2, -CAR_VBOX_H / 2)
    ctx.fillStyle = fill
    ctx.fill(carPath)
    ctx.restore()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Cockpit highlight (small dark oval) and a hint of body sheen so the
    // tiny silhouette reads at speed
    ctx.fillStyle = 'rgba(10, 10, 10, 0.55)'
    ctx.beginPath()
    ctx.ellipse(1, 0, 2.4, 1.6, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(-CAR_LEN * 0.35, -CAR_HEIGHT * 0.18)
    ctx.lineTo(CAR_LEN * 0.25, -CAR_HEIGHT * 0.18)
    ctx.stroke()
  } else {
    // SSR / no DOM fallback: simple rounded rect
    ctx.fillStyle = fill
    ctx.strokeStyle = '#0a0a0a'
    ctx.lineWidth = 1
    roundRect(ctx, -CAR_LEN / 2, -CAR_HEIGHT / 2, CAR_LEN, CAR_HEIGHT, 2)
    ctx.fill()
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
