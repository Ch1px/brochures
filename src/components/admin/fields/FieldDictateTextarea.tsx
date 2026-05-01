'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Mic, MicOff, Sparkles } from 'lucide-react'
import { polishDictationAction } from '@/lib/sanity/actions'

type Props = {
  label: string
  description?: string
  value: string | undefined
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  disabled?: boolean
}

type SR = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SREvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SREvent = {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}
type SRConstructor = new () => SR

function getSpeechRecognition(): SRConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor
    webkitSpeechRecognition?: SRConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Textarea with a built-in dictate button. Uses the browser's Web Speech API
 * — Chrome / Edge / Safari, free, no API costs. Falls back silently to a
 * plain textarea on browsers without support (Firefox).
 *
 * UX: click the mic to start. The textarea becomes read-only while listening
 * (so cursor maths stays simple) and shows live interim text in italic-grey
 * while words are still being decided. Click again or press Esc to stop —
 * dictated speech is appended to whatever was already in the field.
 */
export function FieldDictateTextarea({
  label,
  description,
  value,
  onChange,
  rows = 10,
  placeholder,
  disabled,
}: Props) {
  const id = useId()
  const [isListening, setIsListening] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)

  const recognitionRef = useRef<SR | null>(null)
  // Snapshot of the field value at the moment listening started — finalized
  // speech is appended after this; interim words are shown after that.
  const baseRef = useRef('')
  // Whether the user wants it on. Browsers stop recognition after ~60s of
  // audio or silence; we auto-restart while this flag is true.
  const wantOnRef = useRef(false)
  // Latest committed value, kept in a ref so the async polish callback can
  // read it without depending on stale closure state.
  const valueRef = useRef('')
  valueRef.current = value ?? ''

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null)
  }, [])

  function startListening() {
    const Ctor = getSpeechRecognition()
    if (!Ctor) return
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-GB'

    baseRef.current = (value ?? '').replace(/\s+$/, '')
    setInterim('')
    setError(null)

    rec.onresult = (e) => {
      let final = ''
      let interimChunk = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        const t = r[0].transcript
        if (r.isFinal) {
          final += (final ? ' ' : '') + t.trim()
        } else {
          interimChunk += t
        }
      }
      final = final.replace(/\s+/g, ' ').trim()
      onChange(joinWithSpace(baseRef.current, final))
      setInterim(interimChunk.trim())
    }

    rec.onerror = (e) => {
      // 'no-speech' / 'aborted' aren't user-facing errors.
      if (e.error === 'no-speech' || e.error === 'aborted') return
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone access blocked. Allow it in your browser to dictate.')
      } else {
        setError(`Mic error: ${e.error}`)
      }
    }

    rec.onend = () => {
      if (wantOnRef.current) {
        try {
          rec.start()
        } catch {
          // Already started — ignore.
        }
      } else {
        setIsListening(false)
        setInterim('')
        // Auto-polish the dictated portion so the final field has proper
        // capitalisation, punctuation, and paragraphs — like Claude's dictate.
        void polishDictatedPortion()
      }
    }

    recognitionRef.current = rec
    wantOnRef.current = true
    setIsListening(true)
    rec.start()
  }

  function stopListening() {
    wantOnRef.current = false
    recognitionRef.current?.stop()
  }

  async function polishDictatedPortion() {
    const base = baseRef.current
    const current = valueRef.current
    // The dictated portion is everything appended after the snapshot.
    const dictated = current.startsWith(base) ? current.slice(base.length).trim() : ''
    if (!dictated) return
    setIsPolishing(true)
    try {
      const res = await polishDictationAction(dictated)
      if (res.ok && res.value) {
        onChange(joinWithSpace(base, res.value))
      } else if (!res.ok) {
        // Non-fatal — keep the raw transcript and just surface the issue.
        setError(`Couldn't polish dictation: ${res.error}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Polish failed')
    } finally {
      setIsPolishing(false)
    }
  }

  // Stop & cleanup on unmount.
  useEffect(() => {
    return () => {
      wantOnRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  // If the field is disabled mid-dictation (e.g. a parent submission starts),
  // stop listening so we don't keep updating frozen state.
  useEffect(() => {
    if (disabled && isListening) stopListening()
  }, [disabled, isListening])

  // Esc to stop while listening. Capture-phase so we win against the modal's
  // Esc-to-close handler — otherwise the modal would close mid-dictation.
  useEffect(() => {
    if (!isListening) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        stopListening()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [isListening])

  // While listening, the parent's `value` already reflects committed final
  // chunks (we call onChange on every onresult). Add the live interim words
  // on top so the user sees them being decided.
  const display = isListening ? joinWithSpace(value ?? '', interim) : (value ?? '')

  return (
    <div className="field-group">
      <div className="field-dictate-header">
        <label className="field-label" htmlFor={id}>
          <span className="field-label-text">{label}</span>
          {description ? (
            <span
              className="field-label-info"
              tabIndex={0}
              role="img"
              aria-label={description}
              data-tooltip={description}
            >
              ⓘ
            </span>
          ) : null}
        </label>
        {supported ? (
          <button
            type="button"
            className={`field-dictate-mic${isListening ? ' is-active' : ''}${isPolishing ? ' is-polishing' : ''}`}
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
            aria-pressed={isListening}
            title={isListening ? 'Stop (Esc)' : 'Dictate'}
            disabled={disabled || isPolishing}
          >
            {isPolishing ? (
              <Sparkles size={13} />
            ) : isListening ? (
              <MicOff size={13} />
            ) : (
              <Mic size={13} />
            )}
            <span>{isPolishing ? 'Polishing…' : isListening ? 'Listening…' : 'Dictate'}</span>
          </button>
        ) : null}
      </div>
      <textarea
        id={id}
        className={`field-textarea field-dictate-textarea${isListening ? ' is-listening' : ''}`}
        value={display}
        onChange={(e) => {
          if (isListening) return
          onChange(e.target.value)
        }}
        rows={rows}
        placeholder={placeholder}
        readOnly={isListening}
        disabled={disabled}
      />
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  )
}

function joinWithSpace(a: string, b: string): string {
  if (!a) return b
  if (!b) return a
  return a + ' ' + b
}
