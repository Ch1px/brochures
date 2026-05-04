import 'server-only'

const BASE = 'https://api.openf1.org/v1'

export type OpenF1Session = {
  session_key: number
  session_name: string
  session_type: string
  meeting_key: number
  date_start: string
  country_code: string | null
  circuit_short_name: string | null
  year: number
}

export type OpenF1SessionResult = {
  session_key: number
  driver_number: number
  position: number | null
  points: number | null
  dnf?: boolean
  dns?: boolean
  dsq?: boolean
}

export type OpenF1Driver = {
  driver_number: number
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string | null
  headshot_url: string | null
  meeting_key: number
}

export type OpenF1RaceControl = {
  date: string
  category: string
  message: string
  flag: string | null
  driver_number: number | null
  lap_number: number | null
  session_key: number
  meeting_key: number
}

export type OpenF1Lap = {
  session_key: number
  meeting_key: number
  driver_number: number
  lap_number: number
  date_start: string | null
  lap_duration: number | null
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  is_pit_out_lap: boolean
}

export type OpenF1Location = {
  session_key: number
  meeting_key: number
  driver_number: number
  date: string
  x: number
  y: number
  z: number
}

async function fetchOpenF1<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`OpenF1 ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export function fetchRaces(year: number) {
  return fetchOpenF1<OpenF1Session[]>(`/sessions?session_type=Race&year=${year}`)
}

export function fetchSessions(year: number, sessionType?: 'Race' | 'Qualifying' | 'Sprint' | 'Practice') {
  const tail = sessionType ? `&session_type=${sessionType}` : ''
  return fetchOpenF1<OpenF1Session[]>(`/sessions?year=${year}${tail}`)
}

export function fetchSessionResult(sessionKey: number) {
  return fetchOpenF1<OpenF1SessionResult[]>(`/session_result?session_key=${sessionKey}`)
}

export function fetchDrivers(meetingKey: number) {
  return fetchOpenF1<OpenF1Driver[]>(`/drivers?meeting_key=${meetingKey}`)
}

export function fetchRaceControl(sessionKey: number) {
  return fetchOpenF1<OpenF1RaceControl[]>(`/race_control?session_key=${sessionKey}`)
}

export function fetchLaps(sessionKey: number, driverNumber: number) {
  return fetchOpenF1<OpenF1Lap[]>(
    `/laps?session_key=${sessionKey}&driver_number=${driverNumber}`,
  )
}

export function fetchLocation(
  sessionKey: number,
  driverNumber: number,
  dateGte?: string,
  dateLt?: string,
) {
  const parts = [`session_key=${sessionKey}`, `driver_number=${driverNumber}`]
  if (dateGte) parts.push(`date>=${encodeURIComponent(dateGte)}`)
  if (dateLt) parts.push(`date<${encodeURIComponent(dateLt)}`)
  return fetchOpenF1<OpenF1Location[]>(`/location?${parts.join('&')}`)
}
