import {
  CalendarClock,
  FileText,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react"
import { useMemo, useState } from "react"
import type { Actor } from "../components/AppShell"
import type { ExpedientDocument, ReviewTask } from "../data/documents"
import type { ExchangeRecord } from "../data/exchanges"
import type { Expedient } from "../data/expedients"
import type { ReassignmentRequest } from "../data/reassignment"
import {
  Alert,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Heading,
  Panel,
  PanelHeader,
} from "../components/system"

type OperationalEvent = {
  id: string
  title: string
  date: string
  actor: string
  source: string
  reference?: string
  relatedType?: "document" | "request"
}

export function TrackingPanel({
  actor,
  record,
  documents,
  exchanges,
  reviews,
  requests,
  focus,
  onOpenDocument,
  onOpenRequests,
}: {
  actor: Actor
  record: Expedient
  documents: ExpedientDocument[]
  exchanges: ExchangeRecord[]
  reviews: ReviewTask[]
  requests: ReassignmentRequest[]
  focus?: boolean
  onOpenDocument: (versionId?: string) => void
  onOpenRequests: () => void
}) {
  const [selectedEvent, setSelectedEvent] = useState<OperationalEvent | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const events = useMemo<OperationalEvent[]>(() => {
    const versionEvents = documents.flatMap((document) =>
      document.versions.map((version) => ({
        id: `EV-${version.id}`,
        title: `Versión documental registrada: ${version.id}`,
        date: version.createdAt,
        actor: version.author,
        source: `Documento ${document.id}`,
        reference: version.id,
        relatedType: "document" as const,
      })),
    )
    const reviewEvents = reviews.map((review) => ({
      id: `EV-${review.id}`,
      title: `Revisión interna: ${review.status}`,
      date: review.receivedAt,
      actor: review.assignedTo,
      source: `Revisión ${review.id}`,
      reference: review.versionId,
      relatedType: "document" as const,
    }))
    const requestEvents =
      actor === "supervisor" || actor === "analyst"
        ? requests.map((request) => ({
            id: `EV-${request.id}`,
            title: `Solicitud de reasignación: ${request.status}`,
            date: request.date,
            actor: request.requester,
            source: `Solicitud ${request.id}`,
            reference: request.id,
            relatedType: "request" as const,
          }))
        : []
    const assignmentEvents =
      actor === "supervisor" || actor === "analyst"
        ? record.assignments.map((assignment, index) => ({
            id: `EV-ASG-${record.reference}-${index}`,
            title: assignment.label,
            date: assignment.date,
            actor: assignment.responsible,
            source: "Historial de responsabilidad",
          }))
        : []
    const exchangeEvents =
      actor === "supervisor" || actor === "analyst"
        ? exchanges.map((exchange) => ({
            id: `EV-${exchange.id}`,
            title: `Intercambio registrado: ${exchange.status}`,
            date: exchange.registeredAt,
            actor: "Personal documentario DEMO-006 · STK-06",
            source: `Intercambio ${exchange.id}`,
            reference: exchange.id,
          }))
        : []

    return [
      {
        id: `EV-OP-${record.reference}`,
        title: record.action,
        date: record.updated,
        actor: "Actor no consignado en el dato demostrativo",
        source: "Registro operativo del expediente",
      },
      ...reviewEvents,
      ...versionEvents,
      ...requestEvents,
      ...assignmentEvents,
      ...exchangeEvents,
    ]
  }, [actor, documents, exchanges, record, requests, reviews])

  const pendingActions =
    actor === "reviewer"
      ? reviews
          .filter((review) => review.status === "Pendiente de revisión")
          .map((review) => `${review.versionId} · Revisión interna asignada`)
      : actor === "analyst" && record.responsible !== "Usuario DEMO-014"
        ? []
        : [record.action]

  const dates = [
    {
      value: record.updated,
      source: "Última actuación registrada en el expediente",
    },
    ...documents
      .flatMap((document) => document.versions)
      .slice(-1)
      .map((version) => ({
        value: version.createdAt,
        source: `Registro de ${version.id}`,
      })),
    ...reviews.slice(0, 1).map((review) => ({
      value: review.receivedAt,
      source: `Recepción de ${review.id}`,
    })),
  ]

  const refresh = () => {
    setError(false)
    setLoading(true)
    window.setTimeout(() => setLoading(false), 450)
  }

  if (actor !== "supervisor" && actor !== "analyst" && actor !== "reviewer") {
    return (
      <Panel className="tracking-panel tracking-panel--restricted">
        <Alert tone="error" title="Seguimiento no autorizado">
          La atribución de seguimiento CU-08 no está habilitada para este actor
          en la demostración. No se exponen eventos ni fechas.
        </Alert>
        <EmptyState
          description="El acceso requiere una atribución expresa para este ámbito."
          icon={<ShieldAlert size={24} />}
          title="Sin autorización para consultar seguimiento"
        />
      </Panel>
    )
  }

  return (
    <section
      aria-label="Seguimiento y situación temporal"
      className={`tracking-section ${focus ? "tracking-section--focus" : ""}`}
    >
      <div className="tracking-section__heading">
        <div>
          <span className="eyebrow">Consulta operacional · CU-08</span>
          <Heading level={2}>Seguimiento y situación temporal</Heading>
          <p>
            Eventos y fechas registradas para {record.reference}, sin derivar
            consecuencias jurídicas.
          </p>
        </div>
        <div className="page-actions">
          <Button onClick={() => setError(true)} variant="quiet">
            Probar error
          </Button>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={refresh}
            variant="secondary"
          >
            Actualizar consulta
          </Button>
        </div>
      </div>

      {loading ? (
        <Panel className="tracking-state">
          <LoaderCircle className="spin" size={24} />
          <span>Cargando seguimiento operacional…</span>
        </Panel>
      ) : error ? (
        <Panel className="tracking-state">
          <Alert tone="error" title="No fue posible cargar el seguimiento">
            Estado demostrativo. La consulta no modificó el expediente.
          </Alert>
          <Button onClick={refresh} variant="secondary">
            Reintentar
          </Button>
        </Panel>
      ) : (
        <>
          <div className="tracking-overview">
            <Panel className="tracking-card">
              <span className="tracking-card__label">Situación operativa</span>
              <strong>{record.status}</strong>
              <p>{record.reference}</p>
            </Panel>
            <Panel className="tracking-card">
              <span className="tracking-card__label">Responsable vigente</span>
              <strong>{record.responsible ?? "Por asignar"}</strong>
              <p>Según el registro demostrativo actual</p>
            </Panel>
            <Panel className="tracking-card">
              <span className="tracking-card__label">Última actuación</span>
              <strong>{record.action}</strong>
              <p>{record.updated} · actor no consignado</p>
            </Panel>
          </div>

          <div className="tracking-layout">
            <Panel className="timeline-panel">
              <PanelHeader
                action={<Badge tone="neutral">{events.length} eventos</Badge>}
                description="Selecciona un evento para consultar su referencia disponible."
                eyebrow="Registro trazable"
                title="Línea temporal operacional"
              />
              <div className="operational-timeline">
                {events.map((event) => (
                  <button
                    className="timeline-event"
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    type="button"
                  >
                    <span className="timeline-event__marker">
                      <History size={15} />
                    </span>
                    <span className="timeline-event__content">
                      <strong>{event.title}</strong>
                      <small>{event.source}</small>
                    </span>
                    <span className="timeline-event__meta">
                      <time>{event.date}</time>
                      <small>{event.actor}</small>
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            <aside className="tracking-side">
              <Panel className="pending-visible-panel">
                <PanelHeader
                  eyebrow="Ámbito autorizado"
                  title="Actuaciones pendientes visibles"
                />
                {pendingActions.length > 0 ? (
                  <div className="pending-visible-list">
                    {pendingActions.map((item) => (
                      <div key={item}>
                        <Search size={15} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    description="No existen actuaciones pendientes visibles para este perfil y expediente."
                    title="Sin pendientes en este ámbito"
                  />
                )}
              </Panel>

              <Panel className="temporal-panel">
                <PanelHeader
                  eyebrow="Separación obligatoria"
                  title="Situación temporal"
                />
                <div className="temporal-definition">
                  <div>
                    <span>Fecha registrada</span>
                    <strong>Disponible</strong>
                  </div>
                  <div>
                    <span>Plazo computado</span>
                    <strong>No disponible</strong>
                  </div>
                  <div>
                    <span>Situación jurídica</span>
                    <strong>No determinada</strong>
                  </div>
                </div>
                <Alert title="Cómputo temporal no disponible o no validado">
                  Faltan evento inicial validado, calendario o regla normativa
                  aplicable y validación de la regla.
                </Alert>
                <div className="registered-dates">
                  {dates.map((date) => (
                    <div key={`${date.value}-${date.source}`}>
                      <CalendarClock size={15} />
                      <div>
                        <strong>{date.value}</strong>
                        <span>{date.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </aside>
          </div>
        </>
      )}

      <Dialog
        footer={
          <>
            <Button onClick={() => setSelectedEvent(null)} variant="secondary">
              Cerrar
            </Button>
            {selectedEvent?.relatedType === "document" &&
              selectedEvent.reference && (
                <Button
                  icon={<FileText size={16} />}
                  onClick={() => {
                    const reference = selectedEvent.reference
                    setSelectedEvent(null)
                    onOpenDocument(reference)
                  }}
                >
                  Ver registro documental
                </Button>
              )}
            {selectedEvent?.relatedType === "request" &&
              actor === "supervisor" && (
                <Button
                  onClick={() => {
                    setSelectedEvent(null)
                    onOpenRequests()
                  }}
                >
                  Ver solicitudes
                </Button>
              )}
          </>
        }
        onClose={() => setSelectedEvent(null)}
        open={Boolean(selectedEvent)}
        title={selectedEvent?.title ?? "Evento operacional"}
      >
        {selectedEvent && (
          <dl className="event-details">
            <div>
              <dt>Referencia</dt>
              <dd>{selectedEvent.reference ?? "Sin referencia adicional"}</dd>
            </div>
            <div>
              <dt>Fecha registrada</dt>
              <dd>{selectedEvent.date}</dd>
            </div>
            <div>
              <dt>Actor registrado</dt>
              <dd>{selectedEvent.actor}</dd>
            </div>
            <div>
              <dt>Origen</dt>
              <dd>{selectedEvent.source}</dd>
            </div>
            {!selectedEvent.reference && (
              <div>
                <dt>Detalle adicional</dt>
                <dd>No disponible en el dato demostrativo.</dd>
              </div>
            )}
          </dl>
        )}
      </Dialog>
    </section>
  )
}
