import { ArrowLeft, Send } from "lucide-react"
import { useState } from "react"
import type { Expedient } from "../data/expedients"
import {
  Alert,
  Breadcrumbs,
  Button,
  Heading,
  Panel,
  PanelHeader,
  TextareaField,
} from "../components/system"

export function ReassignmentRequestView({
  record,
  duplicateId,
  onCancel,
  onSubmit,
}: {
  record: Expedient
  duplicateId?: string
  onCancel: () => void
  onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const submit = () => {
    if (!reason.trim()) {
      setError("Describe el motivo de la solicitud.")
      return
    }
    onSubmit(reason.trim())
  }

  return (
    <>
      <Breadcrumbs
        items={["TRASU", record.reference, "Solicitar reasignación"]}
      />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onCancel}
        variant="quiet"
      >
        Cancelar y volver sin cambios
      </Button>
      <div className="page-title">
        <div>
          <span className="eyebrow">Analista STK-02 · prototipo</span>
          <Heading level={1}>Solicitar reasignación</Heading>
          <p>
            Presenta una solicitud justificada para evaluación. La
            responsabilidad vigente no cambia al enviarla.
          </p>
        </div>
      </div>

      <div className="form-layout">
        <Panel className="form-panel">
          <PanelHeader
            description="No se impone una propuesta de responsable nuevo porque no está sustentada en la especificación."
            eyebrow="Solicitud demostrativa"
            title="Motivo de la reasignación"
          />
          <div className="form-body">
            {duplicateId ? (
              <Alert tone="error" title="Ya existe una solicitud pendiente">
                La solicitud {duplicateId} debe evaluarse antes de registrar
                otra para este expediente.
              </Alert>
            ) : (
              <>
                <TextareaField
                  error={error}
                  label="Motivo obligatorio"
                  onChange={(event) => {
                    setReason(event.target.value)
                    setError("")
                  }}
                  placeholder="Describe el motivo operativo de la solicitud"
                  rows={6}
                  value={reason}
                />
                <Alert title="Responsabilidad sin cambios">
                  Enviar la solicitud no modifica al responsable vigente.
                </Alert>
              </>
            )}
          </div>
          <div className="form-footer">
            <Button onClick={onCancel} variant="secondary">
              Cancelar
            </Button>
            <Button
              disabled={Boolean(duplicateId)}
              icon={<Send size={17} />}
              note="Se registra de inmediato, sin confirmación posterior. El responsable no cambia hasta que un Supervisor decida."
              onClick={submit}
            >
              Enviar solicitud
            </Button>
          </div>
        </Panel>
        <Panel className="form-context">
          <PanelHeader eyebrow="Contexto" title="Responsabilidad vigente" />
          <dl className="compact-details">
            <div>
              <dt>Expediente</dt>
              <dd>{record.reference}</dd>
            </div>
            <div>
              <dt>Responsable actual</dt>
              <dd>{record.responsible ?? "Por asignar"}</dd>
            </div>
            <div>
              <dt>Solicitante</dt>
              <dd>Usuario DEMO-014 · STK-02</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </>
  )
}
