type Props = {
  label: string
  description?: string
  children: React.ReactNode
  /** Optional id to wire up htmlFor; the child input should share this id. */
  htmlFor?: string
}

/**
 * Shared field wrapper — label with an optional hoverable info icon that
 * surfaces the description as a tooltip, then the actual control.
 * Used by all Field* components for consistency.
 */
export function FieldLabel({ label, description, htmlFor, children }: Props) {
  return (
    <div className="field-group">
      <label className="field-label" htmlFor={htmlFor}>
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
      {children}
    </div>
  )
}
