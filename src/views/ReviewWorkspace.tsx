import {
  ArrowLeft,
  Check,
  FileText,
  History,
  MessageSquareWarning,
} from "lucide-react"
import { useState } from "react"
import type {
  DocumentVersion,
  ExpedientDocument,
  ReviewTask,
} from "../data/documents"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Dialog,
  Heading,
  Panel,
  PanelHeader,
  TextareaField,
} from "../components/system"

type Decision = "conform" | "observe"

export function ReviewWorkspace({
  document,
  version,
  task,
  onBack,
  onDecide,
}: {
  document: ExpedientDocument
  version: DocumentVersion
  task: ReviewTask
  onBack: () => void
  onDecide: (decision: Decision, note: string) => void
}) {
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [decision, setDecision] = useState<Decision | null>(null)
  const resolved = task.status !== "Pendiente de revisión"

  const prepare = (next: Decision) => {
    if (next === "observe" && !note.trim()) {
      setError(
        "Registra una fundamentación comprensible para las observaciones.",
      )
      return
    }
    setError("")
    setDecision(next)
  }

  return (
    <>
      <Breadcrumbs
        items={["TRASU", "Revisiones pendientes", task.id, version.id]}
      />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onBack}
        variant="quiet"
      >
        Volver a revisiones
      </Button>
      <div className="review-sticky-identity">
        <div>
          <span>Versión exacta asignada</span>
          <strong>{version.id}</strong>
        </div>
        <div>
          <span>Documento</span>
          <strong>{document.id}</strong>
        </div>
        <Badge
          tone={
            task.status === "Observada"
              ? "amber"
              : task.status === "Conformidad interna"
                ? "green"
                : "blue"
          }
        >
          {task.status}
        </Badge>
      </div>
      <div className="page-title">
        <div>
          <span className="eyebrow">Revisor STK-03 · {task.id}</span>
          <Heading level={1}>Revisión de versión</Heading>
          <p>
            La decisión quedará vinculada exclusivamente a {version.id}; no a
            otra versión del documento.
          </p>
        </div>
      </div>

      {resolved && (
        <Alert
          tone={task.status === "Conformidad interna" ? "success" : "info"}
          title="Resultado ya registrado"
        >
          Se evita una segunda decisión para esta asignación. Resultado:{" "}
          {task.status}.
        </Alert>
      )}

      <div className="review-workspace">
        <Panel className="simulated-viewer">
          <div className="viewer-toolbar">
            <FileText size={18} />
            <strong>{version.fileName}</strong>
            <span>Visor simulado · solo lectura</span>
          </div>
          <div className="viewer-page">
            <span>TRASU · Documento de demostración</span>
            <Heading level={2}>{document.name}</Heading>
            <p>
              Contenido simulado de {version.id}. Esta superficie permite
              contextualizar la revisión sin representar un documento
              institucional real.
            </p>
            <div />
            <div />
            <div />
          </div>
        </Panel>

        <aside className="review-decision">
          <Panel className="detail-section">
            <PanelHeader
              description="Metadatos de la versión asignada."
              eyebrow="Identidad"
              title={version.id}
            />
            <dl className="compact-details">
              <div>
                <dt>Expediente</dt>
                <dd>{task.expedientReference}</dd>
              </div>
              <div>
                <dt>Autor</dt>
                <dd>{version.author}</dd>
              </div>
              <div>
                <dt>Recepción</dt>
                <dd>{task.receivedAt}</dd>
              </div>
            </dl>
          </Panel>

          {version.observations.length > 0 && (
            <Panel className="detail-section">
              <PanelHeader
                eyebrow="Antecedentes"
                title="Observaciones previas"
              />
              <div className="observation-list compact">
                {version.observations.map((observation) => (
                  <div key={observation.id}>
                    <History size={15} />
                    <span>{observation.text}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel className="decision-panel review-result-panel">
            <PanelHeader
              description="La conformidad es exclusivamente interna."
              eyebrow="Resultado"
              title={resolved ? task.status : "Registrar revisión"}
            />
            <div className="form-body">
              {resolved ? (
                <p className="result-note">{task.resultNote}</p>
              ) : (
                <TextareaField
                  error={error}
                  label="Fundamentación de observaciones"
                  onChange={(event) => {
                    setNote(event.target.value)
                    setError("")
                  }}
                  placeholder="Obligatorio al emitir observaciones"
                  rows={5}
                  value={note}
                />
              )}
            </div>
            {!resolved && (
              <div className="decision-actions">
                <Button
                  icon={<MessageSquareWarning size={16} />}
                  onClick={() => prepare("observe")}
                  variant="secondary"
                >
                  Emitir observaciones
                </Button>
                <Button
                  icon={<Check size={16} />}
                  onClick={() => prepare("conform")}
                >
                  Registrar conformidad interna
                </Button>
              </div>
            )}
          </Panel>
        </aside>
      </div>

      <Dialog
        footer={
          <>
            <Button onClick={() => setDecision(null)} variant="secondary">
              Cancelar
            </Button>
            <Button
              icon={
                decision === "observe" ? (
                  <MessageSquareWarning size={16} />
                ) : (
                  <Check size={16} />
                )
              }
              onClick={() => {
                if (!decision) return
                onDecide(
                  decision,
                  decision === "observe"
                    ? note.trim()
                    : "Conformidad interna registrada por Revisor DEMO-003.",
                )
                setDecision(null)
              }}
            >
              Confirmar resultado
            </Button>
          </>
        }
        onClose={() => setDecision(null)}
        open={Boolean(decision)}
        title={
          decision === "observe"
            ? "Confirmar observaciones"
            : "Confirmar conformidad interna"
        }
      >
        <div className="confirmation-copy">
          <p>
            El resultado se vinculará a <strong>{version.id}</strong>.
          </p>
          <p>No constituye una decisión legal ni una notificación externa.</p>
        </div>
      </Dialog>
    </>
  )
}
