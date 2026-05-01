import { NextResponse } from 'next/server'
import { fetchRaces, fetchSessionResult, fetchDrivers, type OpenF1SessionResult, type OpenF1Session } from '@/lib/openf1'

const POINTS_BY_POSITION = [0, 25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
const FETCH_CHUNK = 4
const FETCH_RETRIES = 2
const RETRY_DELAY_MS = 350

export const revalidate = 3600

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchSessionResultWithRetry(sessionKey: number): Promise<OpenF1SessionResult[]> {
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const data = await fetchSessionResult(sessionKey)
      if (Array.isArray(data) && data.length > 0) return data
      if (attempt === FETCH_RETRIES) return data
    } catch {
      if (attempt === FETCH_RETRIES) return []
    }
    await sleep(RETRY_DELAY_MS * (attempt + 1))
  }
  return []
}

async function fetchAllResultsChunked(sessions: OpenF1Session[]): Promise<OpenF1SessionResult[][]> {
  const out: OpenF1SessionResult[][] = []
  for (let i = 0; i < sessions.length; i += FETCH_CHUNK) {
    const chunk = sessions.slice(i, i + FETCH_CHUNK)
    const part = await Promise.all(chunk.map((s) => fetchSessionResultWithRetry(s.session_key)))
    out.push(...part)
  }
  return out
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const yearStr = url.searchParams.get('year') ?? new Date().getFullYear().toString()
  const year = parseInt(yearStr, 10)
  if (Number.isNaN(year) || year < 2023 || year > 2030) {
    return NextResponse.json({ error: 'invalid year' }, { status: 400 })
  }

  try {
    const races = await fetchRaces(year)
    const finished = races
      .filter((r) => r.session_type === 'Race')
      .sort((a, b) => a.date_start.localeCompare(b.date_start))
      .filter((r) => new Date(r.date_start).getTime() < Date.now())

    if (finished.length === 0) {
      return NextResponse.json({ year, rounds: [], drivers: [] })
    }

    const allResults = await fetchAllResultsChunked(finished)

    const lastMeeting = finished[finished.length - 1].meeting_key
    const driversList = await fetchDrivers(lastMeeting).catch(() => [])

    const driverMap = new Map<
      number,
      { number: number; name: string; acronym: string; team: string; color: string }
    >()
    for (const d of driversList) {
      driverMap.set(d.driver_number, {
        number: d.driver_number,
        name: d.full_name,
        acronym: d.name_acronym,
        team: d.team_name,
        color: d.team_colour ? `#${d.team_colour}` : '#7d7d7d',
      })
    }

    const rounds = finished.map((race, idx) => {
      const results = allResults[idx] ?? []
      const isSprint = race.session_name === 'Sprint'
      const baseName = race.circuit_short_name ?? race.country_code ?? race.session_name
      return {
        key: race.session_key,
        name: isSprint ? `${baseName} · Sprint` : baseName,
        country: race.country_code ?? '',
        date: race.date_start.slice(0, 10),
        results: results.map((r) => ({
          driver: r.driver_number,
          position: r.position,
          points:
            typeof r.points === 'number'
              ? r.points
              : r.position && r.position >= 1 && r.position <= 10
                ? POINTS_BY_POSITION[r.position]
                : 0,
        })),
      }
    })

    return NextResponse.json({
      year,
      rounds,
      drivers: Array.from(driverMap.values()),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
