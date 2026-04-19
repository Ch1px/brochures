type Props = {
  label: string
  description?: string
  children: React.ReactNode
  /** Optional id to wire up htmlFor; the child input should share this id. */
  htmlFor?: string
}

/**
 * Shared field wrapper — label above, optional description beneath the label,
 * then the actual control. Used by all Field* components for consistency.
 */
export function FieldLabel({ label, description, htmlFor, children }: Props) {
  return (
    <div className="field-group">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {description ? <div className="field-description">{description}</div> : null}
      {children}
    </div>
  )
}
