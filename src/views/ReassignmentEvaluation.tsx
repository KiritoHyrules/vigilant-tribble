import { ArrowLeft, Check, History, X } from "lucide-react"
import { useState } from "react"
import type { Expedient } from "../data/expedients"
import type { ReassignmentRequest } from "../data/reassignment"
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

type Decision = "approve" | "reject"

export function ReassignmentEvaluation({
  request,
  record,
  onBack,
  onDecide,
}: {
  request: ReassignmentRequest
  record: Expedient
  onBack: () => void
  onDecide: (
    decision: Decision,
    justification: string,
    newResponsible?: string,
  ) => void
}) {
  const [newResponsible, setNewResponsible] = useState("")
  const [justification, setJustification] = useState("")
  const [error, setError] = useState("")
  const [decision, setDecision] = useState<Decision | null>(null)

  const prepare = (nextDecision: Decision) => {
    if (nextDecision === "approve" && !newResponsible) {
      setError("Selecciona el nuevo responsable antes de aprobar.")
      return
    }
    if (nextDecision === "reject" && !justification.trim()) {
      setError("Registra la justificación del rechazo.")
      return
    }
    setError("")
    setDecision(nextDecision)
  }

  const resolved = request.status !== "Pendiente de evaluación"

  return (
    <>
      <Breadcrumbs
        items={["TRASU", "Solicitudes de reasignación", request.id]}
      />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onBack}
        variant="quiet"
      >
        Volver a solicitudes
      </Button>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Evaluación supervisora · STK-01</span>
          <Heading level={1}>{request.id}</Heading>
          <p>
            Solicitud asociada a {request.expedientReference}. La
            responsabilidad solo cambia después de confirmar una aprobación.
          </p>
        </div>
        <Badge
          tone={
            request.status === "Aprobada"
              ? "green"
              : request.status === "Rechazada"
                ? "neutral"
                : "amber"
          }
        >
          {request.status}
        </Badge>
      </div>

      {resolved && (
        <Alert
          tone={request.status === "Aprobada" ? "success" : "info"}
          title={`Solicitud ${request.status.toLocaleLowerCase("es")}`}
        >
          {request.status === "Aprobada"
            ? `La responsabilidad demostrativa se actualizó a ${request.newResponsible}.`
            : "La responsabilidad anterior se conserva sin cambios."}
        </Alert>
      )}

      <div className="evaluation-layout">
        <div className="detail-main">
          <Panel className="detail-section">
            <PanelHeader
              description="Información presentada por el solicitante."
              eyebrow="Solicitud"
              title="Motivo y contexto"
            />
            <dl className="read-grid">
              <div>
                <dt>Expediente</dt>
                <dd>{request.expedientReference}</dd>
              </div>
              <div>
                <dt>Solicitante</dt>
                <dd>{request.requester}</dd>
              </div>
              <div>
                <dt>Responsable al solicitar</dt>
                <dd>{request.currentResponsible}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{request.date}</dd>
              </div>
              <div className="read-grid__wide">
                <dt>Motivo presentado</dt>
                <dd>{request.reason}</dd>
              </div>
            </dl>
          </Panel>

          <Panel className="detail-section">
            <PanelHeader
              eyebrow="Trazabilidad"
              title="Historial relevante de responsabilidad"
            />
            <div className="assignment-list">
              {record.assignments.map((assignment, index) => (
                <div key={`${assignment.responsible}-${assignment.date}`}>
                  <span className="timeline-marker">
                    <History size={15} />
                  </span>
                  <div>
                    <strong>{assignment.label}</strong>
                    <p>{assignment.responsible}</p>
                  </div>
                  <time>{assignment.date}</time>
                  {index === 0 && <Badge tone="blue">Vigente</Badge>}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel className="decision-panel">
          <PanelHeader
            description="Completa los datos requeridos y confirma la decisión al final."
            eyebrow="Decisión demostrativa"
            title={resolved ? "Resultado registrado" : "Resolver solicitud"}
          />
          <div className="form-body">
            {resolved ? (
              <dl className="compact-details">
                <div>
                  <dt>Decisión</dt>
                  <dd>{request.status}</dd>
                </div>
                {request.newResponsible && (
                  <div>
                    <dt>Nuevo responsable</dt>
                    <dd>{request.newResponsible}</dd>
                  </div>
                )}
                <div>
                  <dt>Justificación</dt>
                  <dd>{request.resolutionJustification}</dd>
                </div>
              </dl>
            ) : (
              <>
                <SelectField
                  label="Nuevo responsable para una aprobación"
                  onChange={(event) => {
                    setNewResponsible(event.target.value)
                    setError("")
                  }}
                  options={[
                    { value: "", label: "Seleccionar responsable" },
                    { value: "Usuario DEMO-021", label: "Usuario DEMO-021" },
                    { value: "Usuario DEMO-033", label: "Usuario DEMO-033" },
                  ]}
                  value={newResponsible}
                />
                <TextareaField
                  label="Justificación de la decisión"
                  onChange={(event) => {
                    setJustification(event.target.value)
                    setError("")
                  }}
                  placeholder="Registra el sustento de la decisión"
                  rows={5}
                  value={justification}
                />
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="decision-actions">
            {resolved ? (
              <Button onClick={onBack}>Volver a la bandeja</Button>
            ) : (
              <>
                <Button
                  icon={<X size={17} />}
                  onClick={() => prepare("reject")}
                  variant="danger"
                >
                  Rechazar
                </Button>
                <Button
                  icon={<Check size={17} />}
                  onClick={() => prepare("approve")}
                >
                  Aprobar
                </Button>
              </>
            )}
          </div>
        </Panel>
      </div>

      <Dialog
        footer={
          <>
            <Button onClick={() => setDecision(null)} variant="secondary">
              Cancelar
            </Button>
            <Button
              icon={
                decision === "approve" ? <Check size={17} /> : <X size={17} />
              }
              onClick={() => {
                if (!decision) return
                onDecide(
                  decision,
                  justification.trim() ||
                    "Aprobación confirmada en la demostración.",
                  decision === "approve" ? newResponsible : undefined,
                )
                setDecision(null)
              }}
              variant={decision === "reject" ? "danger" : "primary"}
            >
              Confirmar {decision === "approve" ? "aprobación" : "rechazo"}
            </Button>
          </>
        }
        onClose={() => setDecision(null)}
        open={Boolean(decision)}
        title={`Confirmar ${decision === "approve" ? "aprobación" : "rechazo"}`}
      >
        <div className="confirmation-copy">
          <p>
            {decision === "approve"
              ? `La responsabilidad de ${record.reference} cambiará a ${newResponsible}.`
              : `La solicitud será rechazada y ${request.currentResponsible} conservará la responsabilidad.`}
          </p>
          <p>Esta acción solo modifica el estado local del prototipo.</p>
        </div>
      </Dialog>
    </>
  )
}
