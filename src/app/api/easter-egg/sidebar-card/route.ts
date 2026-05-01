import { NextResponse } from 'next/server'
import { fetchRaces, fetchRaceControl, type OpenF1Session, type OpenF1RaceControl } from '@/lib/openf1'

export const dynamic = 'force-dynamic'

const INTERESTING = /TRACK LIMITS|TIME PENALTY|DRIVE.THROUGH|INCIDENT|UNDER INVESTIGATION|REPRIMAND|UNSAFE RELEASE|FORMATION LAP|SAFETY CAR|VIRTUAL SAFETY CAR|CHEQUERED FLAG|RED FLAG|YELLOW FLAG|RAIN|BLUE FLAG/i
const BORING = /^(DRS ENABLED|DRS DISABLED|PIT (ENTRY|EXIT) (OPEN|CLOSED)|GREEN LIGHT|RISK OF RAIN: \d|TRACK INSPECTION)/i

function pickMessage(messages: OpenF1RaceControl[]): OpenF1RaceControl | null {
  if (messages.length === 0) return null
  const filtered = messages.filter((m) => !BORING.test(m.message.trim()))
  const interesting = filtered.filter((m) => INTERESTING.test(m.message))
  const pool = interesting.length > 0 ? interesting : filtered.length > 0 ? filtered : messages
  return pool[Math.floor(Math.random() * pool.length)]
}

async function tryYear(year: number): Promise<OpenF1Session[]> {
  try {
    return await fetchRaces(year)
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const now = Date.now()
    const thisYear = new Date().getFullYear()

    let sessions = await tryYear(thisYear)
    if (sessions.length === 0) sessions = await tryYear(thisYear - 1)

    const onlyRaces = sessions.filter((r) => r.session_name === 'Race')
    const past = onlyRaces
      .filter((r) => new Date(r.date_start).getTime() < now)
      .sort((a, b) => b.date_start.localeCompare(a.date_start))
    const future = onlyRaces
      .filter((r) => new Date(r.date_start).getTime() > now)
      .sort((a, b) => a.date_start.localeCompare(b.date_start))

    const recent = past[0]
    const WINDOW_MS = 60 * 86400_000
    const candidates = past.filter(
      (r) => now - new Date(r.date_start).getTime() < WINDOW_MS,
    )

    for (const candidate of candidates) {
      try {
        const messages = await fetchRaceControl(candidate.session_key)
        if (!Array.isArray(messages)) continue
        const picked = pickMessage(messages)
        if (picked) {
          return NextResponse.json({
            kind: 'quote',
            message: picked.message,
            race: candidate.circuit_short_name ?? candidate.country_code ?? 'Race',
            lap: picked.lap_number,
          })
        }
      } catch {
        // try the next-most-recent race
      }
    }

    if (future[0]) {
      return NextResponse.json({
        kind: 'countdown',
        race: future[0].circuit_short_name ?? future[0].country_code ?? 'Race',
        starts: future[0].date_start,
      })
    }

    if (recent) {
      return NextResponse.json({
        kind: 'countdown-past',
        race: recent.circuit_short_name ?? recent.country_code ?? 'Race',
        when: recent.date_start,
      })
    }

    return NextResponse.json({ kind: 'idle' })
  } catch (err) {
    return NextResponse.json({ kind: 'error', error: (err as Error).message }, { status: 500 })
  }
}
