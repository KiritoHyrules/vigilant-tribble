import { ArrowLeft, CheckCircle2, UserPlus } from "lucide-react"
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
} from "../components/system"

export function InitialAssignmentView({
  record,
  onCancel,
  onConfirm,
}: {
  record: Expedient
  onCancel: () => void
  onConfirm: (responsible: string) => void
}) {
  const [responsible, setResponsible] = useState("")
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const review = () => {
    if (!responsible) {
      setError("Selecciona un responsable habilitado para continuar.")
      return
    }
    setError("")
    setConfirmOpen(true)
  }

  return (
    <>
      <Breadcrumbs items={["TRASU", record.reference, "Asignación inicial"]} />
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
          <span className="eyebrow">Supervisor STK-01 · prototipo</span>
          <Heading level={1}>Asignar responsable inicial</Heading>
          <p>
            Registra la primera responsabilidad del expediente. Esta acción no
            representa su incorporación al circuito.
          </p>
        </div>
      </div>

      <div className="form-layout">
        <Panel className="form-panel">
          <PanelHeader
            description="Selecciona un responsable del conjunto ficticio habilitado."
            eyebrow="Datos necesarios"
            title="Responsable a asignar"
          />
          <div className="form-body">
            {record.responsible ? (
              <Alert
                tone="error"
                title="La asignación inicial ya no corresponde"
              >
                El expediente ya cuenta con responsable vigente. Utiliza el
                circuito de reasignación.
              </Alert>
            ) : (
              <>
                <SelectField
                  label="Responsable habilitado"
                  onChange={(event) => {
                    setResponsible(event.target.value)
                    setError("")
                  }}
                  options={[
                    { value: "", label: "Seleccionar responsable" },
                    { value: "Usuario DEMO-014", label: "Usuario DEMO-014" },
                    { value: "Usuario DEMO-021", label: "Usuario DEMO-021" },
                  ]}
                  value={responsible}
                />
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
                <Alert title="Sin reglas adicionales inferidas">
                  La demostración no calcula capacidad, carga ni elegibilidad.
                </Alert>
              </>
            )}
          </div>
          <div className="form-footer">
            <Button onClick={onCancel} variant="secondary">
              Cancelar
            </Button>
            <Button
              disabled={Boolean(record.responsible)}
              icon={<CheckCircle2 size={17} />}
              onClick={review}
            >
              Revisar asignación
            </Button>
          </div>
        </Panel>

        <Panel className="form-context">
          <PanelHeader eyebrow="Comprobación" title="Datos del expediente" />
          <dl className="compact-details">
            <div>
              <dt>Referencia</dt>
              <dd>{record.reference}</dd>
            </div>
            <div>
              <dt>Situación operativa</dt>
              <dd>{record.status}</dd>
            </div>
            <div>
              <dt>Responsable vigente</dt>
              <dd>{record.responsible ?? "Por asignar"}</dd>
            </div>
            <div>
              <dt>Registrará la acción</dt>
              <dd>Supervisor DEMO-001 · STK-01</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Dialog
        footer={
          <>
            <Button onClick={() => setConfirmOpen(false)} variant="secondary">
              Volver
            </Button>
            <Button
              icon={<UserPlus size={17} />}
              onClick={() => onConfirm(responsible)}
            >
              Confirmar asignación
            </Button>
          </>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Confirmar asignación inicial"
      >
        <div className="confirmation-copy">
          <p>
            Se asignará <strong>{responsible}</strong> como responsable vigente
            de <strong>{record.reference}</strong>.
          </p>
          <p>El cambio se registrará en el historial demostrativo.</p>
        </div>
      </Dialog>
    </>
  )
}
