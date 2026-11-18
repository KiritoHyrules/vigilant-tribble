import {
  ArrowLeftRight,
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileText,
  History,
  Link2,
  LockKeyhole,
  RefreshCw,
  Route,
  UserPlus,
  UserRound,
} from "lucide-react"
import type { Actor } from "../components/AppShell"
import type { ExpedientDocument, ReviewTask } from "../data/documents"
import type { ExchangeRecord, SpecialDerivation } from "../data/exchanges"
import type { Expedient } from "../data/expedients"
import type { ReassignmentRequest } from "../data/reassignment"
import type { TraceRecord } from "../data/traceability"
import { StatusBadge } from "../components/StatusBadge"
import { TrackingPanel } from "./TrackingPanel"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Heading,
  Panel,
  PanelHeader,
} from "../components/system"

type LatestDocumentVersion = {
  id: string
  status: string
}

export function ExpedientDetail({
  record,
  origin,
  actor,
  documents,
  exchanges,
  derivations,
  reviews,
  requests,
  traces,
  trackingFocus,
  documentCount,
  latestDocumentVersion,
  notice,
  pendingRequest,
  onAssignInitial,
  onBack,
  onOpenRequests,
  onOpenDocuments,
  onOpenExchange,
  onRegisterExchange,
  onSpecialDerivation,
  onOpenTrackingDocument,
  onOpenTrace,
  onRequestReassignment,
}: {
  record: Expedient
  origin: "pending" | "locate" | "evidence" | "exchanges"
  actor: Actor
  documents: ExpedientDocument[]
  exchanges: ExchangeRecord[]
  derivations: SpecialDerivation[]
  reviews: ReviewTask[]
  requests: ReassignmentRequest[]
  traces: TraceRecord[]
  trackingFocus?: boolean
  documentCount: number
  latestDocumentVersion?: LatestDocumentVersion
  notice?: string
  pendingRequest?: ReassignmentRequest
  onAssignInitial: () => void
  onBack: () => void
  onOpenRequests: () => void
  onOpenDocuments: () => void
  onOpenExchange: (exchange: ExchangeRecord) => void
  onRegisterExchange: () => void
  onSpecialDerivation: () => void
  onOpenTrackingDocument: (versionId?: string) => void
  onOpenTrace: (trace: TraceRecord) => void
  onRequestReassignment: () => void
}) {
  const originLabel =
    origin === "pending"
      ? "Pendientes y seguimiento"
      : origin === "locate"
        ? "Localizar expedientes"
        : origin === "evidence"
          ? "Evidencia y trazabilidad"
          : "Intercambios registrados"
  const canViewExchanges = actor === "exchange" || actor === "analyst"
  const canDerive = actor === "exchange" || actor === "analyst"

  return (
    <>
      <Breadcrumbs items={["TRASU", originLabel, record.reference]} />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onBack}
        data-guide="back-to-list"
        variant="quiet"
      >
        Volver a {originLabel.toLocaleLowerCase("es")}
      </Button>

      <div className="detail-heading">
        <div>
          <Heading level={1}>{record.reference}</Heading>
          <p>
            Detalle operativo de lectura. Consultar esta vista no modifica
            datos, responsabilidad ni seguimiento.
          </p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <section aria-label="Resumen del expediente" className="detail-summary" data-guide="record-context">
        <div>
          <UserRound size={18} />
          <span>Responsable vigente</span>
          <strong>{record.responsible ?? "Por asignar"}</strong>
        </div>
        <div>
          <ClipboardList size={18} />
          <span>Situación operacional</span>
          <strong>{record.status}</strong>
        </div>
        <div>
          <CalendarClock size={18} />
          <span>Última actuación</span>
          <strong>{record.updated}</strong>
        </div>
      </section>

      <Panel className="responsibility-action">
        <div>
          <span className="responsibility-action__icon">
            {record.responsible ? (
              <RefreshCw size={19} />
            ) : (
              <UserPlus size={19} />
            )}
          </span>
          <div>
            <strong>Gestión de responsabilidad</strong>
            {!record.responsible ? (
              <p>
                El expediente todavía no tiene responsable. La asignación
                inicial no equivale a su incorporación al circuito.
              </p>
            ) : pendingRequest ? (
              <p>
                Existe la solicitud {pendingRequest.id} pendiente de evaluación.
                La responsabilidad vigente no ha cambiado.
              </p>
            ) : (
              <p>
                Los cambios de responsable se tramitan mediante una solicitud de
                reasignación; no como una nueva asignación inicial.
              </p>
            )}
          </div>
        </div>
        <div className="responsibility-action__controls">
          {actor === "supervisor" && !record.responsible && (
            <Button icon={<UserPlus size={17} />} onClick={onAssignInitial}>
              Asignar responsable inicial
            </Button>
          )}
          {actor === "analyst" &&
            record.responsible === "Usuario DEMO-014" &&
            !pendingRequest && (
              <Button
                icon={<RefreshCw size={17} />}
                onClick={onRequestReassignment}
              >
                Solicitar reasignación
              </Button>
            )}
          {pendingRequest && (
            <Badge tone="amber">Pendiente de evaluación</Badge>
          )}
          {actor === "supervisor" && record.responsible && (
            <Button onClick={onOpenRequests} variant="secondary">
              Ver solicitudes pendientes
            </Button>
          )}
          {actor === "analyst" && record.responsible !== "Usuario DEMO-014" && (
            <Badge tone="neutral">Acción no autorizada</Badge>
          )}
        </div>
      </Panel>

      {notice && (
        <Alert tone="success" title="Cambio registrado en el prototipo">
          {notice}
        </Alert>
      )}

      <Alert title="Alcance de la información">
        Los datos son demostrativos. No se muestran resultados legales,
        resoluciones ni confirmaciones de sistemas externos.
      </Alert>

      <TrackingPanel
        actor={actor}
        documents={documents}
        exchanges={exchanges}
        focus={trackingFocus}
        onOpenDocument={onOpenTrackingDocument}
        onOpenRequests={onOpenRequests}
        record={record}
        requests={requests}
        reviews={reviews}
      />

      <div className="detail-layout">
        <div className="detail-main">
          <Panel className="detail-section">
            <PanelHeader
              description="Información institucional disponible en la muestra."
              eyebrow="Lectura"
              title="Contexto institucional"
            />
            <div className="detail-section__body">
              <dl className="read-grid">
                <div>
                  <dt>Referencia</dt>
                  <dd>{record.reference}</dd>
                </div>
                <div>
                  <dt>Tipo de actuación</dt>
                  <dd>{record.type}</dd>
                </div>
                <div className="read-grid__wide">
                  <dt>Contexto disponible</dt>
                  <dd>{record.context}</dd>
                </div>
              </dl>
            </div>
          </Panel>

          <Panel className="detail-section">
            <PanelHeader
              description="Responsabilidad actual y registros anteriores disponibles."
              eyebrow="Trazabilidad operativa"
              title="Responsabilidad y antecedentes de asignación"
            />
            <div className="assignment-list">
              {record.assignments.length > 0 ? (
                record.assignments.map((assignment, index) => (
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
                ))
              ) : (
                <div className="assignment-empty">
                  <span className="timeline-marker">
                    <History size={15} />
                  </span>
                  <div>
                    <strong>Sin antecedentes de asignación</strong>
                    <p>No se ha registrado una asignación inicial.</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel className="detail-section">
            <PanelHeader
              action={<Badge tone="neutral">{documentCount} documentos</Badge>}
              description="Consulta documentos y versiones exactas sin sobrescribir antecedentes."
              eyebrow="Ciclo documental interno"
              title="Documentos y versiones"
            />
            <div className="document-summary-entry">
              <span className="document-icon">
                <FileText size={18} />
              </span>
              <div>
                <strong>
                  {latestDocumentVersion?.id ?? "Sin versiones disponibles"}
                </strong>
                <span>
                  {latestDocumentVersion?.status ??
                    "No hay documentos en esta demostración"}
                </span>
              </div>
              <Button data-guide="open-documents" onClick={onOpenDocuments} variant="secondary">
                Abrir documentos y versiones
              </Button>
            </div>
          </Panel>
        </div>

        <aside className="detail-side">
          <Panel className="detail-section">
            <PanelHeader
              action={
                <Badge tone="neutral">{exchanges.length} registros</Badge>
              }
              eyebrow="Circuito externo condicionado"
              title="Intercambios relacionados"
            />
            {canViewExchanges ? (
              <>
                <div className="related-exchanges">
                  {exchanges.length > 0 ? (
                    exchanges.map((exchange) => (
                      <button
                        key={exchange.id}
                        onClick={() => onOpenExchange(exchange)}
                        type="button"
                      >
                        <ArrowLeftRight size={16} />
                        <span>
                          <strong>{exchange.id}</strong>
                          <small>{exchange.status}</small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p>No hay intercambios relacionados en la demostración.</p>
                  )}
                </div>
                <div className="exchange-context-actions">
                  {actor === "exchange" && (
                    <Button onClick={onRegisterExchange} variant="secondary">
                      Registrar salida
                    </Button>
                  )}
                  {canDerive && (
                    <Button
                      icon={<Route size={15} />}
                      note="Registra una derivación interna. No resuelve el procedimiento externo ni cambia al responsable."
                      onClick={onSpecialDerivation}
                      variant="secondary"
                    >
                      Derivación especial
                    </Button>
                  )}
                </div>
                {derivations.length > 0 && (
                  <div className="related-derivations">
                    {derivations.map((derivation) => (
                      <div key={derivation.id}>
                        <Route size={15} />
                        <span>
                          <strong>{derivation.id}</strong>
                          <small>
                            Registro interno · {derivation.destination}
                          </small>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="restricted-inline">
                <LockKeyhole size={18} />
                <p>
                  Los intercambios están restringidos a atribuciones
                  habilitadas.
                </p>
              </div>
            )}
          </Panel>

          <Panel className="detail-section">
            <PanelHeader eyebrow="Resumen disponible" title="Evidencias" />
            {actor === "auditor" ? (
              <div className="related-traces">
                {traces.length > 0 ? (
                  traces.map((trace) => (
                    <button
                      key={trace.id}
                      onClick={() => onOpenTrace(trace)}
                      type="button"
                    >
                      <Link2 size={15} />
                      <span>
                        <strong>{trace.id}</strong>
                        <small>{trace.action}</small>
                      </span>
                      <Badge
                        tone={
                          trace.evidenceAvailability === "Disponible"
                            ? "green"
                            : "neutral"
                        }
                      >
                        {trace.evidenceAvailability}
                      </Badge>
                    </button>
                  ))
                ) : (
                  <p>Sin trazas autorizadas asociadas al expediente.</p>
                )}
              </div>
            ) : (
              <div className="evidence-list">
                {record.evidence.map((item) => (
                  <div key={item}>
                    <Link2 size={16} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="future-access">
            <div className="future-access__heading">
              <LockKeyhole size={18} />
              <div>
                <strong>Otros puntos de acceso</strong>
                <span>Disponibles en otra iteración</span>
              </div>
            </div>
            <div className="future-actions">
              <Button disabled variant="restricted">
                Auditoría
              </Button>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  )
}
