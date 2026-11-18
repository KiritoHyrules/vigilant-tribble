import { ArrowLeft, RotateCcw, ShieldAlert } from "lucide-react"
import { useState } from "react"
import type { ExchangeRecord } from "../data/exchanges"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Dialog,
  Heading,
  Panel,
  PanelHeader,
  SelectField,
  TextareaField,
} from "../components/system"

export type TreatmentDraft = {
  action: "retry" | "escalate"
  note: string
}

export function ExchangeTreatmentView({
  record,
  onCancel,
  onConfirm,
}: {
  record: ExchangeRecord
  onCancel: () => void
  onConfirm: (draft: TreatmentDraft) => void
}) {
  const [action, setAction] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const review = () => {
    if (!action || !note.trim()) {
      setError("Selecciona un tratamiento y registra la condición observada.")
      return
    }
    setError("")
    setConfirmOpen(true)
  }

  return (
    <>
      <Breadcrumbs
        items={["TRASU", "Intercambios registrados", record.id, "Tratar fallo"]}
      />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onCancel}
        variant="quiet"
      >
        Cancelar y volver al intercambio
      </Button>
      <div className="page-title">
        <div>
          <span className="eyebrow">STK-06 habilitado · tratamiento local</span>
          <Heading level={1}>Tratar fallo o resultado incierto</Heading>
          <p>
            Registra un nuevo intento sin eliminar los {record.attempts.length}{" "}
            intentos existentes de {record.id}.
          </p>
        </div>
        <Badge tone="amber">{record.status}</Badge>
      </div>

      <div className="form-layout">
        <Panel className="form-panel">
          <PanelHeader
            description="No se ejecutará una llamada real al canal externo."
            eyebrow="Nuevo intento"
            title="Tratamiento a registrar"
          />
          <div className="form-body">
            <Alert tone="error" title="Condición observada">
              {record.attempts.at(-1)?.message ??
                "No existe detalle técnico disponible."}
            </Alert>
            <SelectField
              label="Tratamiento habilitado"
              onChange={(event) => {
                setAction(event.target.value)
                setError("")
              }}
              options={[
                { value: "", label: "Seleccionar tratamiento" },
                { value: "retry", label: "Registrar reintento" },
                {
                  value: "escalate",
                  label: "Registrar escalamiento técnico",
                },
              ]}
              value={action}
            />
            <TextareaField
              label="Nota del tratamiento"
              onChange={(event) => {
                setNote(event.target.value)
                setError("")
              }}
              placeholder="Describe la condición observada y el tratamiento"
              rows={5}
              value={note}
            />
            {error && (
              <Alert tone="error" title="Validación incompleta">
                {error}
              </Alert>
            )}
          </div>
          <div className="form-footer">
            <Button onClick={onCancel} variant="secondary">
              Cancelar
            </Button>
            <Button icon={<RotateCcw size={16} />} onClick={review}>
              Revisar nuevo intento
            </Button>
          </div>
        </Panel>
        <Panel className="form-context">
          <PanelHeader eyebrow="Historial preservado" title={record.id} />
          <div className="treatment-history-summary">
            {record.attempts.map((attempt) => (
              <div key={attempt.id}>
                <strong>{attempt.id}</strong>
                <span>{attempt.result}</span>
                <time>{attempt.date}</time>
              </div>
            ))}
          </div>
          <div className="form-body">
            <Alert title="Resultado del nuevo intento">
              Quedará como «Resultado desconocido» hasta contar con información
              externa sustentada.
            </Alert>
          </div>
        </Panel>
      </div>

      <Dialog
        footer={
          <>
            <Button onClick={() => setConfirmOpen(false)} variant="secondary">
              Volver
            </Button>
            <Button
              icon={<ShieldAlert size={16} />}
              onClick={() =>
                onConfirm({
                  action: action as "retry" | "escalate",
                  note: note.trim(),
                })
              }
            >
              Confirmar tratamiento
            </Button>
          </>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Confirmar nuevo intento"
      >
        <div className="confirmation-copy">
          <p>
            Se añadirá un intento nuevo a <strong>{record.id}</strong>.
          </p>
          <p>Los intentos anteriores permanecerán sin cambios.</p>
        </div>
      </Dialog>
    </>
  )
}
