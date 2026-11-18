import { ArrowLeft, CheckCircle2, Upload, Wrench } from "lucide-react"
import { useState } from "react"
import type {
  InterventionRecord,
  InterventionStatus,
} from "../data/interventions"
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
} from "../components/system"

export type TechnicalActionDraft = {
  stage: string
  description: string
  result: InterventionStatus
  evidence?: string
}

export function TechnicalActionView({
  record,
  onCancel,
  onConfirm,
}: {
  record: InterventionRecord
  onCancel: () => void
  onConfirm: (draft: TechnicalActionDraft) => void
}) {
  const [stage, setStage] = useState("")
  const [description, setDescription] = useState("")
  const [result, setResult] = useState("")
  const [evidence, setEvidence] = useState("")
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const review = () => {
    if (!stage || !description.trim() || !result) {
      setError("Completa etapa, actuación y resultado.")
      return
    }
    if (result === "Recuperación comprobada" && !evidence) {
      setError("La recuperación comprobada requiere evidencia de verificación.")
      return
    }
    setError("")
    setConfirmOpen(true)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          "TRASU",
          "Intervenciones técnicas",
          record.id,
          "Registrar actuación",
        ]}
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
          <span className="eyebrow">Soporte STK-08 · modo demostrativo</span>
          <Heading level={1}>Registrar actuación técnica</Heading>
          <p>
            Añade un registro local a {record.id} sin ejecutar operaciones sobre
            infraestructura real.
          </p>
        </div>
      </div>
      <div className="form-layout">
        <Panel className="form-panel">
          <PanelHeader
            description="El resultado debe reflejar únicamente lo comprobado."
            eyebrow="Actuación autorizada"
            title="Datos técnicos"
          />
          <div className="form-body">
            <SelectField
              label="Etapa"
              onChange={(event) => setStage(event.target.value)}
              options={[
                { value: "", label: "Seleccionar etapa" },
                {
                  value: "Inicio de intervención",
                  label: "Inicio de intervención",
                },
                { value: "Actuación ejecutada", label: "Actuación ejecutada" },
                { value: "Verificación", label: "Verificación" },
              ]}
              value={stage}
            />
            <TextareaField
              label="Actuación ejecutada o condición observada"
              onChange={(event) => {
                setDescription(event.target.value)
                setError("")
              }}
              placeholder="Describe el registro técnico demostrativo"
              rows={5}
              value={description}
            />
            <SelectField
              label="Resultado registrado"
              onChange={(event) => {
                setResult(event.target.value)
                setError("")
              }}
              options={[
                { value: "", label: "Seleccionar resultado" },
                {
                  value: "Intervención registrada",
                  label: "Intervención registrada",
                },
                {
                  value: "Verificación pendiente",
                  label: "Verificación pendiente",
                },
                {
                  value: "Recuperación parcial",
                  label: "Recuperación parcial",
                },
                {
                  value: "Recuperación comprobada",
                  label: "Recuperación comprobada",
                },
                {
                  value: "Resultado desconocido",
                  label: "Resultado desconocido",
                },
              ]}
              value={result}
            />
            <div className="demo-file-field">
              <span>Evidencia de verificación</span>
              <strong>{evidence || "Sin evidencia seleccionada"}</strong>
              <Button
                icon={<Upload size={15} />}
                onClick={() => {
                  setEvidence("VERIF-TECNICA-DEMO.pdf")
                  setError("")
                }}
                variant="secondary"
              >
                Incorporar evidencia demostrativa
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
            <Button icon={<CheckCircle2 size={16} />} onClick={review}>
              Revisar actuación
            </Button>
          </div>
        </Panel>
        <Panel className="form-context">
          <PanelHeader eyebrow="Componente" title={record.component} />
          <div className="form-body">
            <Alert title="Sin efectos institucionales reales">
              El prototipo no desbloquea usuarios, modifica permisos, accede a
              servidores ni reinicia servicios.
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
              icon={<Wrench size={16} />}
              onClick={() =>
                onConfirm({
                  stage,
                  description: description.trim(),
                  result: result as InterventionStatus,
                  evidence: evidence || undefined,
                })
              }
            >
              Confirmar registro técnico
            </Button>
          </>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Confirmar actuación demostrativa"
      >
        <div className="confirmation-copy">
          <p>
            La actuación se añadirá al historial de <strong>{record.id}</strong>
            .
          </p>
          <p>No se simulará una reparación institucional efectiva.</p>
        </div>
      </Dialog>
    </>
  )
}
