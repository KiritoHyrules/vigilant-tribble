import { ArrowRight, Inbox, LockKeyhole, RotateCcw } from "lucide-react"
import type { Actor } from "../components/AppShell"
import type { ReassignmentRequest, RequestStatus } from "../data/reassignment"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  DataTable,
  EmptyState,
  Heading,
  Panel,
  PanelHeader,
  SearchField,
  SelectField,
} from "../components/system"

export type RequestFilters = {
  query: string
  status: string
}

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const tone =
    status === "Aprobada"
      ? "green"
      : status === "Rechazada"
        ? "neutral"
        : "amber"
  return <Badge tone={tone}>{status}</Badge>
}

export function ReassignmentQueue({
  actor,
  requests,
  filters,
  onFiltersChange,
  onEvaluate,
}: {
  actor: Actor
  requests: ReassignmentRequest[]
  filters: RequestFilters
  onFiltersChange: (filters: RequestFilters) => void
  onEvaluate: (request: ReassignmentRequest) => void
}) {
  const filtered = requests.filter((request) => {
    const query = filters.query.trim().toLocaleLowerCase("es")
    return (
      (!query ||
        request.id.toLocaleLowerCase("es").includes(query) ||
        request.expedientReference.toLocaleLowerCase("es").includes(query)) &&
      (filters.status === "all" || request.status === filters.status)
    )
  })

  if (actor !== "supervisor") {
    return (
      <>
        <Breadcrumbs items={["TRASU", "Solicitudes de reasignación"]} />
        <div className="page-title">
          <div>
            <span className="eyebrow">Acceso condicionado</span>
            <Heading level={1}>Solicitudes de reasignación</Heading>
          </div>
        </div>
        <Panel className="restricted-panel">
          <Alert tone="error" title="Acceso no autorizado">
            La evaluación corresponde al supervisor STK-01. No se muestran
            solicitudes ni datos protegidos.
          </Alert>
          <EmptyState
            description="Cambia al actor de demostración autorizado para probar esta bandeja."
            icon={<LockKeyhole size={25} />}
            title="No tienes atribución para evaluar solicitudes"
          />
        </Panel>
      </>
    )
  }

  const rows = filtered.map((request) => [
    <strong key={`${request.id}-id`}>{request.id}</strong>,
    request.expedientReference,
    request.requester,
    request.currentResponsible,
    request.date,
    <RequestStatusBadge key={`${request.id}-status`} status={request.status} />,
    <Button
      icon={<ArrowRight size={15} />}
      key={`${request.id}-evaluate`}
      onClick={() => onEvaluate(request)}
      variant="quiet"
    >
      {request.status === "Pendiente de evaluación"
        ? "Evaluar solicitud"
        : "Ver resultado"}
    </Button>,
  ])

  return (
    <>
      <Breadcrumbs items={["TRASU", "Solicitudes de reasignación"]} />
      <div className="page-title pending-title">
        <div>
          <span className="eyebrow">Supervisor STK-01 · datos ficticios</span>
          <Heading level={1}>Solicitudes de reasignación</Heading>
          <p>
            Consulta y evalúa solicitudes sin alterar responsabilidades antes de
            una confirmación.
          </p>
        </div>
      </div>
      <div className="demo-notice" role="note">
        <span>DEMO</span>
        <p>
          Las decisiones y transiciones se conservan únicamente durante esta
          sesión local del prototipo.
        </p>
      </div>
      <Panel className="worklist-panel">
        <PanelHeader
          action={
            <span className="result-count">{filtered.length} solicitudes</span>
          }
          description="Los filtros y la selección se conservan al regresar de una evaluación."
          eyebrow="Bandeja autorizada"
          title="Solicitudes registradas"
        />
        <div className="filters" role="search">
          <SearchField
            label="Buscar por solicitud o expediente"
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="Buscar solicitud o expediente"
            value={filters.query}
          />
          <SelectField
            label="Situación"
            onChange={(event) =>
              onFiltersChange({ ...filters, status: event.target.value })
            }
            options={[
              { value: "all", label: "Todas las situaciones" },
              {
                value: "Pendiente de evaluación",
                label: "Pendiente de evaluación",
              },
              { value: "Aprobada", label: "Aprobada" },
              { value: "Rechazada", label: "Rechazada" },
            ]}
            value={filters.status}
          />
          <Button
            icon={<RotateCcw size={16} />}
            onClick={() => onFiltersChange({ query: "", status: "all" })}
            variant="quiet"
          >
            Restablecer
          </Button>
        </div>
        {filtered.length > 0 ? (
          <div className="request-table">
            <DataTable
              columns={[
                "Solicitud",
                "Expediente",
                "Solicitante",
                "Responsable vigente",
                "Fecha",
                "Situación",
                "Acción",
              ]}
              rows={rows}
            />
          </div>
        ) : (
          <div className="worklist-empty">
            <EmptyState
              action={
                <Button
                  onClick={() => onFiltersChange({ query: "", status: "all" })}
                  variant="secondary"
                >
                  Limpiar filtros
                </Button>
              }
              description="No hay solicitudes que coincidan con los criterios actuales."
              icon={<Inbox size={25} />}
              title="Sin solicitudes para mostrar"
            />
          </div>
        )}
      </Panel>
    </>
  )
}
