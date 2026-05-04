/* eslint-disable no-console */
/**
 * Precompute the F1 race-replay payload for the admin sidebar card.
 *
 *   npx tsx scripts/build-race-replay.ts
 *   npx tsx scripts/build-race-replay.ts --session-key=9662
 *   npx tsx scripts/build-race-replay.ts --year=2024
 *
 * Writes:
 *   public/race-replays/latest.json
 *   public/race-replays/{raceSessionKey}.json
 *
 * Run after each Grand Prix; commit the JSON. Fully standalone (no Next.js
 * runtime, no Sanity) — talks directly to the public OpenF1 REST API.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'https://api.openf1.org/v1'

// ───── Types ──────────────────────────────────────────────────────────────

type OpenF1Session = {
  session_key: number
  meeting_key: number
  session_name: string
  session_type: string
  date_start: string
  date_end: string
  country_name: string | null
  country_code: string | null
  circuit_short_name: string | null
  location: string | null
  year: number
}

type OpenF1SessionResult = {
  session_key: number
  driver_number: number
  position: number | null
  points: number | null
  dnf?: boolean
  dns?: boolean
  dsq?: boolean
}

type OpenF1Driver = {
  driver_number: number
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string | null
  meeting_key: number
}

type OpenF1Lap = {
  session_key: number
  driver_number: number
  lap_number: number
  date_start: string | null
  lap_duration: number | null
  is_pit_out_lap: boolean | null
}

type OpenF1Location = {
  session_key: number
  driver_number: number
  date: string
  x: number
  y: number
}

type OpenF1RaceControl = {
  date: string
  category: string
  message: string
  flag: string | null
  driver_number: number | null
  lap_number: number | null
  session_key: number
}

type OpenF1Stint = {
  session_key: number
  driver_number: number
  stint_number: number
  lap_start: number
  lap_end: number
  compound: string | null
  tyre_age_at_start: number | null
}

// ───── Output payload ─────────────────────────────────────────────────────

type RaceReplayStint = {
  lapStart: number
  lapEnd: number
  compound: string
}

type RaceReplayDriver = {
  number: number
  acronym: string
  name: string
  team: string
  color: string
  finalPosition: number | null
  startSampleIndex: number
  endSampleIndex: number
  samples: number[] // [x0, y0, x1, y1, …] quantised 0–10000
  stints: RaceReplayStint[]
}

type RaceControlEvent = {
  /** Race-time (ms relative to lights-out) when the message was issued. */
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
  /** Race-time (ms relative to race start) at which each lap begins. Index 0 = lap 1. */
  lapTimeline: number[]
  totalLaps: number
  raceControl: RaceControlEvent[]
  drivers: RaceReplayDriver[]
}

// ───── HTTP ───────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms))
}

async function api<T>(path: string, attempt = 0): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url)
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`OpenF1 ${path} → ${res.status} (gave up after ${attempt} retries)`)
    const retryAfter = Number(res.headers.get('retry-after')) || 0
    const wait = Math.max(retryAfter * 1000, 800 * Math.pow(2, attempt))
    await sleep(wait + Math.random() * 200)
    return api<T>(path, attempt + 1)
  }
  if (!res.ok) throw new Error(`OpenF1 ${path} → ${res.status}`)
  return (await res.json()) as T
}

async function pool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (true) {
      const i = next++
      if (i >= items.length) return
      try {
        const value = await fn(items[i], i)
        results[i] = { status: 'fulfilled', value }
      } catch (reason) {
        results[i] = { status: 'rejected', reason }
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  )
  return results
}

// ───── Geometry ───────────────────────────────────────────────────────────

type Point = [number, number]

/** Douglas–Peucker polyline simplification. tolerance is in input units. */
function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points
  const sqTol = tolerance * tolerance
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]

  while (stack.length) {
    const [a, b] = stack.pop()!
    let maxSqDist = 0
    let index = -1
    for (let i = a + 1; i < b; i++) {
      const d = perpSqDist(points[i], points[a], points[b])
      if (d > maxSqDist) {
        index = i
        maxSqDist = d
      }
    }
    if (maxSqDist > sqTol && index !== -1) {
      keep[index] = 1
      stack.push([a, index], [index, b])
    }
  }

  const out: Point[] = []
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i])
  return out
}

function perpSqDist(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) {
    const ddx = p[0] - a[0]
    const ddy = p[1] - a[1]
    return ddx * ddx + ddy * ddy
  }
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
  const cx = a[0] + Math.max(0, Math.min(1, t)) * dx
  const cy = a[1] + Math.max(0, Math.min(1, t)) * dy
  const ddx = p[0] - cx
  const ddy = p[1] - cy
  return ddx * ddx + ddy * ddy
}

/** Iteratively bump tolerance until point count is within target. */
function simplifyToCount(points: Point[], targetMax: number): Point[] {
  if (points.length <= targetMax) return points
  let tol = 0.5
  let out = simplify(points, tol)
  for (let i = 0; i < 20 && out.length > targetMax; i++) {
    tol *= 1.6
    out = simplify(points, tol)
  }
  return out
}

// ───── Build ──────────────────────────────────────────────────────────────

type Args = { sessionKey?: number; year?: number }

function parseArgs(): Args {
  const out: Args = {}
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.+)$/)
    if (!m) continue
    if (m[1] === 'session-key') out.sessionKey = Number(m[2])
    if (m[1] === 'year') out.year = Number(m[2])
  }
  return out
}

async function findRaceSession(args: Args): Promise<OpenF1Session> {
  if (args.sessionKey) {
    const sessions = await api<OpenF1Session[]>(`/sessions?session_key=${args.sessionKey}`)
    const found = sessions.find((s) => s.session_type === 'Race')
    if (!found) throw new Error(`Session ${args.sessionKey} is not a race`)
    return found
  }
  const now = Date.now()
  const thisYear = args.year ?? new Date().getFullYear()
  for (const year of [thisYear, thisYear - 1]) {
    const sessions = await api<OpenF1Session[]>(`/sessions?session_type=Race&year=${year}`)
    const past = sessions
      .filter((s) => new Date(s.date_start).getTime() < now)
      .sort((a, b) => b.date_start.localeCompare(a.date_start))
    if (past[0]) return past[0]
  }
  throw new Error('No past race found')
}

async function findQualifyingSession(meetingKey: number): Promise<OpenF1Session | null> {
  const sessions = await api<OpenF1Session[]>(
    `/sessions?meeting_key=${meetingKey}&session_type=Qualifying`,
  )
  return sessions[0] ?? null
}

async function findPoleSitter(qualySessionKey: number): Promise<number> {
  const results = await api<OpenF1SessionResult[]>(
    `/session_result?session_key=${qualySessionKey}`,
  )
  const sorted = results
    .filter((r) => r.position != null)
    .sort((a, b) => (a.position! - b.position!))
  if (!sorted[0]) throw new Error('No qualifying result found')
  return sorted[0].driver_number
}

async function fastestLap(
  sessionKey: number,
  driverNumber: number,
): Promise<{ start: string; durationSec: number } | null> {
  const laps = await api<OpenF1Lap[]>(
    `/laps?session_key=${sessionKey}&driver_number=${driverNumber}`,
  )
  const valid = laps.filter(
    (l) => l.lap_duration != null && l.date_start != null && l.is_pit_out_lap !== true,
  )
  if (valid.length === 0) return null
  valid.sort((a, b) => (a.lap_duration! - b.lap_duration!))
  const best = valid[0]
  return { start: best.date_start!, durationSec: best.lap_duration! }
}

/** Fetch race location for a driver in 25-minute chunks. */
async function fetchRaceLocation(
  sessionKey: number,
  driverNumber: number,
  startMs: number,
  endMs: number,
): Promise<OpenF1Location[]> {
  const CHUNK_MS = 25 * 60_000
  const chunks: Array<{ from: string; to: string }> = []
  for (let t = startMs; t < endMs; t += CHUNK_MS) {
    chunks.push({
      from: new Date(t).toISOString(),
      to: new Date(Math.min(t + CHUNK_MS, endMs)).toISOString(),
    })
  }
  // Sequential within a driver (chunks are small, rate-limit-friendly).
  const settled: PromiseSettledResult<OpenF1Location[]>[] = []
  for (const { from, to } of chunks) {
    try {
      const v = await api<OpenF1Location[]>(
        `/location?session_key=${sessionKey}&driver_number=${driverNumber}` +
          `&date>=${encodeURIComponent(from)}&date<${encodeURIComponent(to)}`,
      )
      settled.push({ status: 'fulfilled', value: v })
    } catch (reason) {
      settled.push({ status: 'rejected', reason })
    }
  }
  const out: OpenF1Location[] = []
  for (const r of settled) {
    if (r.status === 'fulfilled') out.push(...r.value)
    else console.warn(`  driver ${driverNumber} chunk failed:`, r.reason)
  }
  out.sort((a, b) => a.date.localeCompare(b.date))
  return out
}

/** Downsample a sorted location series to 1 sample per intervalMs (nearest-time). */
function downsample(
  locations: OpenF1Location[],
  startMs: number,
  intervalMs: number,
  count: number,
): Array<Point | null> {
  const out: Array<Point | null> = new Array(count)
  if (locations.length === 0) return out.fill(null)
  let i = 0
  for (let s = 0; s < count; s++) {
    const target = startMs + s * intervalMs
    while (
      i + 1 < locations.length &&
      Math.abs(new Date(locations[i + 1].date).getTime() - target) <
        Math.abs(new Date(locations[i].date).getTime() - target)
    ) {
      i++
    }
    const dt = Math.abs(new Date(locations[i].date).getTime() - target)
    out[s] = dt < intervalMs * 2 ? [locations[i].x, locations[i].y] : null
  }
  return out
}

function colorFor(team_colour: string | null | undefined): string {
  if (team_colour && /^[0-9A-Fa-f]{6}$/.test(team_colour)) return `#${team_colour}`
  return '#7d7d7d'
}

async function build() {
  const args = parseArgs()
  const race = await findRaceSession(args)
  const raceStart = new Date(race.date_start).getTime()
  const raceEnd = new Date(race.date_end).getTime()
  const raceDurationMs = raceEnd - raceStart
  console.log(
    `→ Race: ${race.country_code ?? race.location ?? 'Unknown'} ${race.year}` +
      ` (session_key ${race.session_key}, duration ${(raceDurationMs / 60000).toFixed(0)} min)`,
  )

  const qualy = await findQualifyingSession(race.meeting_key)
  if (!qualy) throw new Error('No qualifying session found for meeting')
  console.log(`→ Qualifying: session_key ${qualy.session_key}`)

  const pole = await findPoleSitter(qualy.session_key)
  console.log(`→ Pole-sitter: #${pole}`)

  let outlineLap = await fastestLap(qualy.session_key, pole)
  if (!outlineLap) {
    console.warn('  pole has no usable fastest lap; falling back to P2')
    const results = await api<OpenF1SessionResult[]>(
      `/session_result?session_key=${qualy.session_key}`,
    )
    const p2 = results.find((r) => r.position === 2)
    if (!p2) throw new Error('No fallback driver')
    outlineLap = await fastestLap(qualy.session_key, p2.driver_number)
    if (!outlineLap) throw new Error('No fallback fastest lap')
  }
  const outlineStart = new Date(outlineLap.start).getTime()
  const outlineEnd = outlineStart + outlineLap.durationSec * 1000
  const outlineRaw = await api<OpenF1Location[]>(
    `/location?session_key=${qualy.session_key}` +
      `&driver_number=${pole}` +
      `&date>=${encodeURIComponent(new Date(outlineStart).toISOString())}` +
      `&date<${encodeURIComponent(new Date(outlineEnd + 1000).toISOString())}`,
  )
  outlineRaw.sort((a, b) => a.date.localeCompare(b.date))
  const outlinePts: Point[] = outlineRaw.map((p) => [p.x, p.y])
  console.log(`→ Outline: ${outlinePts.length} raw points`)

  const drivers = await api<OpenF1Driver[]>(`/drivers?meeting_key=${race.meeting_key}`)
  // Dedupe by driver_number (drivers can appear multiple times across sessions)
  const driverMap = new Map<number, OpenF1Driver>()
  for (const d of drivers) {
    if (!driverMap.has(d.driver_number)) driverMap.set(d.driver_number, d)
  }
  const driverList = Array.from(driverMap.values())
  console.log(`→ Drivers: ${driverList.length}`)

  const raceResults = await api<OpenF1SessionResult[]>(
    `/session_result?session_key=${race.session_key}`,
  )
  const positionByDriver = new Map<number, number | null>()
  for (const r of raceResults) positionByDriver.set(r.driver_number, r.position ?? null)

  // Race winner's laps drive the lap counter. If the winner has no usable lap
  // data, walk up positions until something works.
  const sortedResults = [...raceResults]
    .filter((r) => r.position != null)
    .sort((a, b) => (a.position! - b.position!))
  let lapTimelineMs: number[] = []
  let totalLaps = 0
  for (const r of sortedResults) {
    try {
      const laps = await api<OpenF1Lap[]>(
        `/laps?session_key=${race.session_key}&driver_number=${r.driver_number}`,
      )
      const valid = laps
        .filter((l) => l.date_start != null)
        .sort((a, b) => a.lap_number - b.lap_number)
      if (valid.length === 0) continue
      lapTimelineMs = valid.map((l) =>
        Math.max(0, new Date(l.date_start!).getTime() - raceStart),
      )
      totalLaps = Math.max(...valid.map((l) => l.lap_number))
      console.log(`→ Lap timeline: leader #${r.driver_number}, ${totalLaps} laps`)
      break
    } catch {
      // try next finisher
    }
  }
  if (lapTimelineMs.length === 0) {
    console.warn('  no lap timeline available; falling back to even split')
    totalLaps = 0
  }

  // Anchor playback t=0 at lights-out (lap 1's date_start). The session window
  // begins earlier — typically when cars are rolled to the grid for the
  // formation lap — and including that pre-race time makes the lap counter
  // look stuck at 1 for several minutes. Trim the offset.
  let effectiveRaceStart = raceStart
  if (lapTimelineMs.length > 0 && lapTimelineMs[0] > 5000) {
    const offsetMs = lapTimelineMs[0]
    effectiveRaceStart = raceStart + offsetMs
    lapTimelineMs = lapTimelineMs.map((t) => t - offsetMs)
    console.log(
      `→ Anchoring t=0 at lights-out (skipping ${(offsetMs / 1000).toFixed(0)}s pre-race rolling)`,
    )
  }

  // Tyre stints — per-driver compound usage by lap range. Fetched once for
  // the whole race session.
  const stintsByDriver = new Map<number, RaceReplayStint[]>()
  try {
    const stintsRaw = await api<OpenF1Stint[]>(
      `/stints?session_key=${race.session_key}`,
    )
    for (const s of stintsRaw) {
      if (!s.compound) continue
      if (s.lap_start == null || s.lap_end == null) continue
      const list = stintsByDriver.get(s.driver_number) ?? []
      list.push({
        lapStart: s.lap_start,
        lapEnd: s.lap_end,
        compound: s.compound.toUpperCase(),
      })
      stintsByDriver.set(s.driver_number, list)
    }
    for (const list of stintsByDriver.values()) {
      list.sort((a, b) => a.lapStart - b.lapStart)
    }
    console.log(`→ Stints: ${stintsByDriver.size} drivers with tyre data`)
  } catch (err) {
    console.warn('  stints fetch failed:', err)
  }

  // Race-control events. Filter to the interesting ones (drop DRS toggles,
  // pit-lane open/close, etc) and convert timestamps to race-relative ms.
  const RC_INTERESTING =
    /TRACK LIMITS|TIME PENALTY|DRIVE.THROUGH|INCIDENT|UNDER INVESTIGATION|REPRIMAND|UNSAFE RELEASE|FORMATION LAP|SAFETY CAR|VIRTUAL SAFETY CAR|CHEQUERED FLAG|RED FLAG|YELLOW FLAG|RAIN|BLUE FLAG|GREEN FLAG|RACE START/i
  const RC_BORING =
    /^(DRS ENABLED|DRS DISABLED|PIT (ENTRY|EXIT) (OPEN|CLOSED)|RISK OF RAIN: \d|TRACK INSPECTION)/i
  const raceControlEvents: RaceControlEvent[] = []
  try {
    const rcRaw = await api<OpenF1RaceControl[]>(
      `/race_control?session_key=${race.session_key}`,
    )
    for (const m of rcRaw) {
      const msg = (m.message ?? '').trim()
      if (!msg) continue
      if (RC_BORING.test(msg)) continue
      if (!RC_INTERESTING.test(msg)) continue
      const tMs = new Date(m.date).getTime() - effectiveRaceStart
      if (tMs < -10_000) continue // pre-race junk
      raceControlEvents.push({
        tMs: Math.max(0, tMs),
        message: msg,
        flag: m.flag,
      })
    }
    raceControlEvents.sort((a, b) => a.tMs - b.tMs)
    console.log(`→ Race control: ${raceControlEvents.length} relevant messages`)
  } catch (err) {
    console.warn('  race control fetch failed:', err)
  }

  const SAMPLE_INTERVAL_MS = 2000
  console.log(
    `→ Session window: ${(raceDurationMs / 60000).toFixed(0)} min` +
      ` (will trim to actual race finish)`,
  )

  // Fetch each driver's race location with bounded concurrency (rate-limit friendly).
  const fetched = await pool(driverList, 2, async (drv) => {
    console.log(`  fetching #${drv.driver_number} ${drv.name_acronym}`)
    const locs = await fetchRaceLocation(
      race.session_key,
      drv.driver_number,
      raceStart,
      raceEnd,
    )
    return { drv, locs }
  })

  // Find the actual race-end time: the latest timestamp across all drivers
  // is when the last finisher crossed the line. Add a 5-second tail and clamp
  // to the session window. This is much shorter than the 2-hour session cap.
  let latestSampleMs = effectiveRaceStart
  for (const r of fetched) {
    if (r.status !== 'fulfilled') continue
    for (const l of r.value.locs) {
      const t = new Date(l.date).getTime()
      if (t > latestSampleMs) latestSampleMs = t
    }
  }
  const actualRaceEnd = Math.min(latestSampleMs + 5000, raceEnd)
  const actualDurationMs = actualRaceEnd - effectiveRaceStart
  const sampleCount = Math.ceil(actualDurationMs / SAMPLE_INTERVAL_MS)
  console.log(
    `→ Actual race duration: ${(actualDurationMs / 60000).toFixed(1)} min` +
      ` (${sampleCount} samples per driver)`,
  )

  // Bounding box is computed from the qualifying-lap racing line ONLY.
  // This keeps the circuit visually centred in the SVG. Pit-lane and any
  // off-track excursions during the race will render outside the viewBox
  // (overflow: visible on the SVG, with the card containing the spillover).
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const [x, y] of outlinePts) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  if (!isFinite(minX)) throw new Error('No valid qualifying-lap coordinates')

  // Padding. 6% gives the racing line breathing room without making it small.
  const padX = (maxX - minX) * 0.06
  const padY = (maxY - minY) * 0.06
  minX -= padX
  maxX += padX
  minY -= padY
  maxY += padY
  const rangeX = maxX - minX
  const rangeY = maxY - minY
  const aspect = rangeX / rangeY
  const VIEW_W = 1000
  const VIEW_H = Math.round(VIEW_W / aspect)

  function normX(x: number) {
    return ((x - minX) / rangeX) * 10000
  }
  function normY(y: number) {
    // Flip Y — OpenF1 coords are typically rendered with Y up, SVG is Y down.
    return ((maxY - y) / rangeY) * 10000
  }

  // Build track path, simplified to ≤200 points.
  const normalisedOutline: Point[] = outlinePts.map((p) => [normX(p[0]), normY(p[1])])
  const simplified = simplifyToCount(normalisedOutline, 200)
  // Convert 0-10000 normalised values back to viewBox-space for the path string.
  const fmtPath = simplified
    .map((p, i) => {
      const x = ((p[0] / 10000) * VIEW_W).toFixed(1)
      const y = ((p[1] / 10000) * VIEW_H).toFixed(1)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
  const trackPath = simplified.length > 2 ? fmtPath + ' Z' : fmtPath
  console.log(`→ Outline simplified: ${outlinePts.length} → ${simplified.length} points`)

  // Downsample each driver and build replay drivers.
  const replayDrivers: RaceReplayDriver[] = []
  for (let i = 0; i < fetched.length; i++) {
    const r = fetched[i]
    if (r.status !== 'fulfilled') continue
    const { drv, locs } = r.value
    if (locs.length === 0) continue
    const points = downsample(locs, effectiveRaceStart, SAMPLE_INTERVAL_MS, sampleCount)

    // Find first/last non-null indices.
    let start = -1
    let end = -1
    for (let s = 0; s < points.length; s++) {
      if (points[s] != null) {
        if (start === -1) start = s
        end = s
      }
    }
    if (start === -1) continue

    // OpenF1 keeps reporting GPS for parked cars after retirement, so DNF
    // drivers naturally have data through to the end. For drivers that did
    // not earn a final position (DNF / unclassified), walk backward from
    // the end and drop trailing stationary samples — those represent the
    // car parked at the side of the track or on the back of a flatbed.
    const finalPos = positionByDriver.get(drv.driver_number) ?? null
    if (finalPos === null) {
      // Establish "moving" baseline from this driver's first 50 frames.
      const distances: number[] = []
      for (let s = start + 1; s <= end && distances.length < 50; s++) {
        const a = points[s - 1]
        const b = points[s]
        if (!a || !b) continue
        distances.push(Math.hypot(b[0] - a[0], b[1] - a[1]))
      }
      if (distances.length > 0) {
        distances.sort((p, q) => p - q)
        const median = distances[Math.floor(distances.length / 2)]
        const stationaryThreshold = Math.max(median * 0.05, 1) // 5% of typical motion
        let trimmed = end
        while (trimmed > start) {
          const a = points[trimmed - 1]
          const b = points[trimmed]
          if (!a || !b) {
            trimmed--
            continue
          }
          const dist = Math.hypot(b[0] - a[0], b[1] - a[1])
          if (dist < stationaryThreshold) trimmed--
          else break
        }
        if (trimmed < end) {
          console.log(
            `  ${drv.name_acronym} retired — trimmed ${end - trimmed} stationary samples` +
              ` (lasts to ~${((trimmed * SAMPLE_INTERVAL_MS) / 60000).toFixed(1)} min)`,
          )
          end = trimmed
        }
      }
    }

    // Forward-fill leading nulls with first known sample, back-fill trailing
    // (retired) with last known. Interior nulls also forward-filled so the
    // dot freezes briefly through any gap rather than teleporting.
    let lastKnown: Point | null = null
    const samples: number[] = []
    for (let s = 0; s < points.length; s++) {
      const current: Point = points[s] ?? lastKnown ?? points[start]!
      lastKnown = current
      samples.push(Math.round(normX(current[0])), Math.round(normY(current[1])))
    }

    replayDrivers.push({
      number: drv.driver_number,
      acronym: drv.name_acronym,
      name: drv.full_name,
      team: drv.team_name,
      color: colorFor(drv.team_colour),
      finalPosition: positionByDriver.get(drv.driver_number) ?? null,
      startSampleIndex: start,
      endSampleIndex: end,
      samples,
      stints: stintsByDriver.get(drv.driver_number) ?? [],
    })
  }

  if (replayDrivers.length === 0) throw new Error('No drivers had usable location data')

  const payload: RaceReplay = {
    kind: 'replay',
    generatedAt: new Date().toISOString(),
    race: {
      name: race.session_name,
      circuit: race.circuit_short_name ?? race.location ?? race.country_name ?? 'Race',
      country: race.country_name ?? race.country_code ?? null,
      raceSessionKey: race.session_key,
      year: race.year,
    },
    viewBox: [VIEW_W, VIEW_H],
    trackPath,
    sampleIntervalMs: SAMPLE_INTERVAL_MS,
    durationMs: actualDurationMs,
    lapTimeline: lapTimelineMs,
    totalLaps,
    raceControl: raceControlEvents.filter((e) => e.tMs <= actualDurationMs),
    drivers: replayDrivers,
  }

  const outDir = resolve(process.cwd(), 'public', 'race-replays')
  mkdirSync(outDir, { recursive: true })
  const json = JSON.stringify(payload)
  writeFileSync(resolve(outDir, 'latest.json'), json)
  writeFileSync(resolve(outDir, `${race.session_key}.json`), json)
  console.log(
    `\n✓ Wrote ${(json.length / 1024).toFixed(1)} KB → public/race-replays/latest.json` +
      ` and ${race.session_key}.json (${replayDrivers.length} drivers, ${sampleCount} samples each)`,
  )
}

build().catch((err) => {
  console.error('\n✗ build-race-replay failed:', err)
  process.exit(1)
})
