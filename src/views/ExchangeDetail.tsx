import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  History,
  RotateCcw,
} from "lucide-react"
import type { Actor } from "../components/AppShell"
import type { ExchangeRecord, ExchangeStatus } from "../data/exchanges"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Heading,
  Panel,
  PanelHeader,
} from "../components/system"

function statusTone(status: ExchangeStatus) {
  return status === "Confirmado"
    ? "green" as const
    : status === "Fallido"
      ? "amber" as const
      : status === "Pendiente de confirmación"
        ? "blue" as const
        : "neutral" as const
}

export function ExchangeDetail({
  actor,
  record,
  origin,
  notice,
  onBack,
  onOpenExpedient,
  onTreatFailure,
}: {
  actor: Actor
  record: ExchangeRecord
  origin: "list" | "expedient"
  notice?: string
  onBack: () => void
  onOpenExpedient: () => void
  onTreatFailure: () => void
}) {
  const canTreat =
    actor === "exchange" &&
    (record.status === "Fallido" || record.status === "Resultado desconocido")

  return (
    <>
      <Breadcrumbs
        items={[
          "TRASU",
          origin === "list"
            ? "Intercambios registrados"
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
        {origin === "list" ? "Volver a intercambios" : "Volver al expediente"}
      </Button>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">
            Intercambio ficticio · historial íntegro
          </span>
          <Heading level={1}>{record.id}</Heading>
          <p>
            Registro interno asociado a {record.expedientReference}. Consultar
            esta vista no ejecuta llamadas ni confirma resultados externos.
          </p>
        </div>
        <Badge tone={statusTone(record.status)}>{record.status}</Badge>
      </div>

      {notice && (
        <Alert tone="success" title="Registro local actualizado">
          {notice}
        </Alert>
      )}

      <div className="exchange-detail-layout">
        <div className="detail-main">
          <Panel className="detail-section">
            <PanelHeader
              description="Información registrada para la salida demostrativa."
              eyebrow="Identidad"
              title="Detalle del intercambio"
            />
            <dl className="read-grid">
              <div>
                <dt>Expediente relacionado</dt>
                <dd>{record.expedientReference}</dd>
              </div>
              <div>
                <dt>Actuación o documento</dt>
                <dd>{record.relatedItem}</dd>
              </div>
              <div>
                <dt>Tipo de actuación</dt>
                <dd>{record.actionType}</dd>
              </div>
              <div>
                <dt>Fecha registrada</dt>
                <dd>{record.registeredAt}</dd>
              </div>
              <div>
                <dt>Destino</dt>
                <dd>{record.destination}</dd>
              </div>
              <div>
                <dt>Canal</dt>
                <dd>{record.channel}</dd>
              </div>
              <div className="read-grid__wide">
                <dt>Referencia del intercambio</dt>
                <dd>{record.externalReference}</dd>
              </div>
            </dl>
          </Panel>

          <Panel className="attempts-panel">
            <PanelHeader
              action={
                <Badge tone="neutral">
                  {record.attempts.length}{" "}
                  {record.attempts.length === 1 ? "intento" : "intentos"}
                </Badge>
              }
              description="Cada intento conserva identidad, fecha y resultado reportado."
              eyebrow="Trazabilidad"
              title="Historial de intentos"
            />
            <div className="attempt-list">
              {record.attempts.map((attempt, index) => (
                <div key={attempt.id}>
                  <span className="attempt-marker">
                    {attempt.result === "Confirmado" ? (
                      <CheckCircle2 size={16} />
                    ) : attempt.result === "Fallido" ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <History size={16} />
                    )}
                  </span>
                  <div className="attempt-content">
                    <div>
                      <strong>{attempt.id}</strong>
                      <Badge tone={statusTone(attempt.result)}>
                        {attempt.result}
                      </Badge>
                    </div>
                    <p>{attempt.message}</p>
                    {attempt.technicalReference && (
                      <small>
                        Referencia técnica: {attempt.technicalReference}
                      </small>
                    )}
                  </div>
                  <time>{attempt.date}</time>
                  <span className="attempt-number">Intento {index + 1}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="detail-side">
          <Panel className="detail-section">
            <PanelHeader
              eyebrow="Evidencia disponible"
              title="Constancia o referencia"
            />
            <div className="exchange-evidence">
              {record.evidence ? (
                <>
                  <FileText size={20} />
                  <div>
                    <strong>{record.evidence}</strong>
                    <span>Archivo demostrativo vinculado</span>
                  </div>
                </>
              ) : (
                <Alert title="Sin constancia disponible">
                  No se inventa evidencia ni confirmación para este registro.
                </Alert>
              )}
            </div>
          </Panel>

          <Panel className="exchange-actions-panel">
            <PanelHeader eyebrow="Acciones autorizadas" title="Continuar" />
            <div className="exchange-detail-actions">
              <Button onClick={onOpenExpedient} variant="secondary">
                Ver expediente relacionado
              </Button>
              {canTreat && (
                <Button icon={<RotateCcw size={16} />} onClick={onTreatFailure}>
                  Tratar fallo o resultado incierto
                </Button>
              )}
              {actor === "support" && (
                <Badge tone="neutral">STK-08 no habilitado</Badge>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </>
  )
}
