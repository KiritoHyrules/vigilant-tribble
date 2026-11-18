import { ArrowLeft, FileQuestion, FileText, History } from "lucide-react"
import type { TraceRecord } from "../data/traceability"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Heading,
  Panel,
  PanelHeader,
} from "../components/system"

export function EvidenceDetail({
  record,
  sequence,
  origin,
  onBack,
  onOpenExpedient,
}: {
  record: TraceRecord
  sequence: TraceRecord[]
  origin: "list" | "expedient"
  onBack: () => void
  onOpenExpedient: () => void
}) {
  return (
    <>
      <Breadcrumbs
        items={[
          "TRASU",
          origin === "list"
            ? "Evidencia y trazabilidad"
            : record.expedientReference,
          record.id,
        ]}
      />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onBack}
        variant="quiet"
      >
        {origin === "list" ? "Volver a trazabilidad" : "Volver al expediente"}
      </Button>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Auditor STK-09 · solo lectura</span>
          <Heading level={1}>{record.id}</Heading>
          <p>
            Detalle de una actuación existente. Esta consulta no modifica su
            origen ni el expediente.
          </p>
        </div>
        <Badge
          tone={
            record.evidenceAvailability === "Disponible" ? "green" : "neutral"
          }
        >
          Evidencia {record.evidenceAvailability.toLocaleLowerCase("es")}
        </Badge>
      </div>
      <Alert title="Límites de la consulta">
        El prototipo no certifica firma digital, sello de tiempo, integridad
        criptográfica ni validez oficial de la evidencia.
      </Alert>
      <div className="evidence-detail-layout">
        <div className="detail-main">
          <Panel className="detail-section">
            <PanelHeader
              description="Datos existentes en el registro demostrativo."
              eyebrow="Actuación"
              title={record.action}
            />
            <dl className="read-grid">
              <div>
                <dt>Fecha y hora</dt>
                <dd>{record.date}</dd>
              </div>
              <div>
                <dt>Expediente</dt>
                <dd>{record.expedientReference}</dd>
              </div>
              <div>
                <dt>Actor registrado</dt>
                <dd>{record.actor}</dd>
              </div>
              <div>
                <dt>Referencia de origen</dt>
                <dd>{record.source}</dd>
              </div>
              <div>
                <dt>Documento</dt>
                <dd>{record.documentId ?? "No corresponde o no consta"}</dd>
              </div>
              <div>
                <dt>Versión exacta</dt>
                <dd>{record.versionId ?? "No corresponde o no consta"}</dd>
              </div>
              <div className="read-grid__wide">
                <dt>Descripción</dt>
                <dd>{record.description}</dd>
              </div>
            </dl>
          </Panel>
          <Panel className="detail-section">
            <PanelHeader
              description="Secuencia disponible para el mismo expediente."
              eyebrow="Orden cronológico"
              title="Actuaciones relacionadas"
            />
            <div className="trace-sequence">
              {sequence.map((item) => (
                <div key={item.id}>
                  <span className="timeline-marker">
                    <History size={15} />
                  </span>
                  <div>
                    <strong>{item.action}</strong>
                    <span>
                      {item.id} · {item.source}
                    </span>
                  </div>
                  <time>{item.date}</time>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <aside className="detail-side">
          <Panel className="detail-section">
            <PanelHeader eyebrow="Disponibilidad" title="Evidencia asociada" />
            <div className="evidence-file-card">
              {record.evidenceReference ? (
                <>
                  <FileText size={24} />
                  <strong>{record.evidenceReference}</strong>
                  <span>Referencia demostrativa disponible</span>
                </>
              ) : (
                <>
                  <FileQuestion size={24} />
                  <strong>Evidencia no disponible</strong>
                  <span>No se crea ni infiere una constancia inexistente.</span>
                </>
              )}
            </div>
          </Panel>
          <Button onClick={onOpenExpedient} variant="secondary">
            Ver expediente compartido
          </Button>
        </aside>
      </div>
    </>
  )
}
