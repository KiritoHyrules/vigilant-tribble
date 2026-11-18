import { ArrowLeft, Route, Upload } from "lucide-react"
import { useState } from "react"
import type { Expedient } from "../data/expedients"
import {
  Alert,
  Breadcrumbs,
  Button,
  Dialog,
  Heading,
  Panel,
  PanelHeader,
  SelectField,
  TextareaField,
  TextField,
} from "../components/system"

export type DerivationDraft = {
  reason: string
  destination: string
  relatedAction: string
  evidence: string
}

export function SpecialDerivationView({
  record,
  onCancel,
  onConfirm,
}: {
  record: Expedient
  onCancel: () => void
  onConfirm: (draft: DerivationDraft) => void
}) {
  const [reason, setReason] = useState("")
  const [destination, setDestination] = useState("")
  const [relatedAction, setRelatedAction] = useState("")
  const [evidence, setEvidence] = useState("")
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const review = () => {
    if (!reason.trim() || !destination || !relatedAction || !evidence) {
      setError("Completa motivo, destino, actuación y constancia demostrativa.")
      return
    }
    setError("")
    setConfirmOpen(true)
  }

  return (
    <>
      <Breadcrumbs items={["TRASU", record.reference, "Derivación especial"]} />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onCancel}
        variant="quiet"
      >
        Cancelar y volver al expediente
      </Button>
      <div className="page-title">
        <div>
          <span className="eyebrow">
            Atribución demostrativa condicionada · STK-02/STK-06
          </span>
          <Heading level={1}>Registrar derivación a ruta especial</Heading>
          <p>
            Registra la derivación interna sin ejecutar ni resolver el
            procedimiento de la institución externa.
          </p>
        </div>
      </div>
      <div className="form-layout">
        <Panel className="form-panel">
          <PanelHeader
            description={`Expediente asociado: ${record.reference}`}
            eyebrow="Registro interno"
            title="Datos de la derivación"
          />
          <div className="form-body">
            <TextareaField
              label="Motivo de la derivación"
              onChange={(event) => {
                setReason(event.target.value)
                setError("")
              }}
              placeholder="Describe el motivo operativo"
              rows={5}
              value={reason}
            />
            <TextField
              label="Destino externo conocido"
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Destino especial DEMO"
              value={destination}
            />
            <SelectField
              label="Actuación relacionada"
              onChange={(event) => setRelatedAction(event.target.value)}
              options={[
                { value: "", label: "Seleccionar actuación" },
                { value: record.action, label: record.action },
                {
                  value: "Actuación especial demostrativa",
                  label: "Actuación especial demostrativa",
                },
              ]}
              value={relatedAction}
            />
            <div className="demo-file-field">
              <span>Constancia o evidencia</span>
              <strong>{evidence || "Sin constancia seleccionada"}</strong>
              <Button
                icon={<Upload size={15} />}
                onClick={() => setEvidence("CONST-DERIVACION-DEMO.pdf")}
                variant="secondary"
              >
                Incorporar constancia
              </Button>
            </div>
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
            <Button icon={<Route size={16} />} onClick={review}>
              Revisar derivación
            </Button>
          </div>
        </Panel>
        <Panel className="form-context">
          <PanelHeader eyebrow="Límite funcional" title="Resultado esperado" />
          <div className="form-body">
            <Alert title="Solo registro interno">
              La derivación no cierra el expediente, no ejecuta el procedimiento
              externo y no afirma un resultado institucional.
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
              icon={<Route size={16} />}
              onClick={() =>
                onConfirm({
                  reason: reason.trim(),
                  destination,
                  relatedAction,
                  evidence,
                })
              }
            >
              Confirmar registro interno
            </Button>
          </>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Confirmar derivación especial"
      >
        <div className="confirmation-copy">
          <p>
            Se registrará una derivación para{" "}
            <strong>{record.reference}</strong>.
          </p>
          <p>No se simulará el resultado del procedimiento externo.</p>
        </div>
      </Dialog>
    </>
  )
}
