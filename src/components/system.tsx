import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react"
import { useEffect, useId, useRef } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info,
  LoaderCircle,
  Search,
  ShieldAlert,
  X,
} from "lucide-react"

type ButtonVariant = "primary" | "secondary" | "quiet" | "restricted" | "danger"

export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  note,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  icon?: ReactNode
  /** Consecuencia que no se deduce del texto del botón. Se muestra siempre, no tras un clic. */
  note?: string
}) {
  const noteId = useId()
  const control = (
    <button
      className={`button button--${variant} ${className}`}
      type="button"
      {...props}
      aria-describedby={
        note
          ? [props["aria-describedby"], noteId].filter(Boolean).join(" ")
          : props["aria-describedby"]
      }
    >
      {icon}
      <span>{children}</span>
    </button>
  )
  if (!note) return control
  return (
    <div className="action-with-note">
      {control}
      <p className="action-note" id={noteId}>
        {note}
      </p>
    </div>
  )
}

export function IconButton({
  label,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}) {
  return (
    <button
      aria-label={label}
      className={`icon-button ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export function Heading({
  level = 2,
  children,
  className = "",
}: {
  level?: 1 | 2 | 3 | 4
  children: ReactNode
  className?: string
}) {
  const Tag = `h${level}` as const
  return (
    <Tag className={`heading heading--${level} ${className}`}>{children}</Tag>
  )
}

export function SearchField({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
}) {
  return (
    <label className={`search-field ${className}`}>
      <span className="sr-only">{label}</span>
      <Search aria-hidden="true" size={18} />
      <input aria-label={label} type="search" {...props} />
    </label>
  )
}

export function TextField({
  label,
  error,
  className = "",
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  return (
    <div className={`text-field ${error ? "field--error" : ""} ${className}`}>
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={[props["aria-describedby"], error ? errorId : ""].filter(Boolean).join(" ") || undefined}
      />
      {error && <small id={errorId} role="alert">{error}</small>}
    </div>
  )
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{
    value: string
    label: string
  }>
  onChange: ChangeEventHandler<HTMLSelectElement>
}) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select aria-label={label} onChange={onChange} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TextareaField({
  label,
  error,
  className = "",
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  return (
    <div className={`textarea-field ${error ? "field--error" : ""} ${className}`}>
      <label htmlFor={fieldId}>{label}</label>
      <textarea
        id={fieldId}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={[props["aria-describedby"], error ? errorId : ""].filter(Boolean).join(" ") || undefined}
      />
      {error && <small id={errorId} role="alert">{error}</small>}
    </div>
  )
}

type BadgeTone = "blue" | "green" | "amber" | "neutral"

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone
  children: ReactNode
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

type AlertTone = "info" | "success" | "error"

const alertIcons = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
}

export function Alert({
  tone = "info",
  title,
  children,
  onDismiss,
}: {
  tone?: AlertTone
  title: string
  children: ReactNode
  onDismiss?: () => void
}) {
  const Icon = alertIcons[tone]
  return (
    <div
      className={`alert alert--${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="alert__icon" size={20} />
      <div className="alert__content">
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
      {onDismiss && (
        <IconButton label="Cerrar mensaje" onClick={onDismiss}>
          <X size={18} />
        </IconButton>
      )}
    </div>
  )
}

export function Panel({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: ReactNode
  className?: string
  as?: "section" | "div" | "aside"
}) {
  return <Tag className={`panel ${className}`}>{children}</Tag>
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="panel-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <Heading level={2}>{title}</Heading>
        {description && (
          <p className="panel-header__description">{description}</p>
        )}
      </div>
      {action && <div className="panel-header__action">{action}</div>}
    </div>
  )
}

export function Tabs({
  items,
  value,
  onChange,
  label,
}: {
  items: Array<{
    id: string
    label: string
  }>
  value: string
  onChange: (id: string) => void
  label: string
}) {
  return (
    <div aria-label={label} className="tabs" role="tablist">
      {items.map((item) => (
        <button
          aria-selected={value === item.id}
          className="tab"
          key={item.id}
          onClick={() => onChange(item.id)}
          role="tab"
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={`Tabla de resultados: ${columns.join(", ")}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <Heading level={3}>{title}</Heading>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function LoadingState() {
  return (
    <div aria-live="polite" className="loading-state">
      <LoaderCircle aria-hidden="true" className="spin" size={22} />
      <span>Cargando contenido…</span>
    </div>
  )
}

export function UnauthorizedState() {
  return (
    <EmptyState
      description="Esta sección solo se mostrará cuando las atribuciones habilitadas lo permitan."
      icon={<ShieldAlert size={24} />}
      title="Acceso no habilitado"
    />
  )
}

export function Dialog({
  open,
  title,
  children,
  footer,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousName = previousFocus?.getAttribute("aria-label") ?? previousFocus?.textContent
    dialog.showModal()
    return () => {
      dialog.close()
      requestAnimationFrame(() => {
        const sameControl = (previousFocus?.getAttribute("aria-label") ?? previousFocus?.textContent) === previousName
        if (sameControl && previousFocus?.isConnected && previousFocus.getClientRects().length && !previousFocus.closest('dialog:not([open]), [inert]') && !previousFocus.matches(":disabled")) previousFocus.focus()
        else {
          const heading = document.querySelector<HTMLElement>(".workspace h1")
          if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
        }
      })
    }
  }, [open])

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} className="system-modal" onCancel={(event) => { event.preventDefault(); onClose() }}>
      <div className="dialog">
        <div className="dialog__header">
          <div id={titleId}>
            <Heading level={2}>{title}</Heading>
          </div>
          <IconButton label="Cerrar diálogo" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </div>
        <div className="dialog__body">{children}</div>
        <div className="dialog__footer">
          {footer ?? (
            <Button onClick={onClose} variant="secondary">
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </dialog>
  )
}

export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Ruta de ubicación" className="breadcrumbs">
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 && <ChevronRight aria-hidden="true" size={14} />}
          <span aria-current={index === items.length - 1 ? "page" : undefined}>
            {item}
          </span>
        </span>
      ))}
    </nav>
  )
}
