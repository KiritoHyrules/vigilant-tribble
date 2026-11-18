import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  FileSearch,
  Inbox,
  ListFilter,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react"
import { useState } from "react"
import type { Actor } from "../components/AppShell"
import type { Expedient } from "../data/expedients"
import {
  Breadcrumbs,
  Button,
  DataTable,
  EmptyState,
  Heading,
  Alert,
  Panel,
  PanelHeader,
  SearchField,
  SelectField,
} from "../components/system"
import { StatusBadge } from "../components/StatusBadge"

export type PendingFilters = {
  search: string
  type: string
  status: string
  forceEmpty: boolean
  sort: string
}

export function PendingView({
  records,
  actor,
  filters,
  onFiltersChange,
  onOpen,
  onOpenTracking,
  onLocate,
}: {
  records: Expedient[]
  actor: Actor
  filters: PendingFilters
  onFiltersChange: (filters: PendingFilters) => void
  onOpen: (record: Expedient) => void
  onOpenTracking: (record: Expedient) => void
  onLocate: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const filteredRecords = (
    filters.forceEmpty
      ? []
      : records.filter((record) => {
          const term = filters.search.trim().toLocaleLowerCase("es")
          const matchesSearch =
            !term ||
            record.reference.toLocaleLowerCase("es").includes(term) ||
            record.action.toLocaleLowerCase("es").includes(term)
          const matchesType =
            filters.type === "all" || record.type === filters.type
          const matchesStatus =
            filters.status === "all" || record.status === filters.status
          return matchesSearch && matchesType && matchesStatus
        })
  )
    .slice()
    .sort((a, b) =>
      filters.sort === "reference"
        ? a.reference.localeCompare(b.reference)
        : b.updated.localeCompare(a.updated),
    )

  const clearFilters = () =>
    onFiltersChange({
      search: "",
      type: "all",
      status: "all",
      forceEmpty: false,
      sort: "updated",
    })

  const rows = filteredRecords.map((record) => [
    <div className="reference-cell" key={`${record.reference}-reference`}>
      <strong>{record.reference}</strong>
      <span>Dato ficticio de ejemplo</span>
    </div>,
    <div className="action-cell" key={`${record.reference}-action`}>
      <strong>{record.action}</strong>
      <span>{record.type}</span>
    </div>,
    record.responsibility,
    record.updated,
    <StatusBadge key={`${record.reference}-status`} status={record.status} />,
    <div className="row-actions" key={`${record.reference}-actions`}>
      <Button
        data-guide="open-record"
        icon={<ArrowRight size={15} />}
        onClick={() => onOpen(record)}
        variant="quiet"
      >
        Ver expediente
      </Button>
      <Button
        icon={<CalendarClock size={15} />}
        onClick={() => onOpenTracking(record)}
        variant="quiet"
      >
        Ver seguimiento
      </Button>
    </div>,
  ])

  const refresh = () => {
    setError(false)
    setLoading(true)
    window.setTimeout(() => setLoading(false), 450)
  }

  if (actor !== "supervisor" && actor !== "analyst" && actor !== "reviewer") {
    return (
      <>
        <Breadcrumbs items={["TRASU", "Pendientes y seguimiento"]} />
        <div className="page-title">
          <div>
            <span className="eyebrow">Acceso condicionado</span>
            <Heading level={1}>Pendientes y seguimiento</Heading>
          </div>
        </div>
        <Panel className="restricted-panel">
          <Alert tone="error" title="Acceso no autorizado">
            La atribución de seguimiento CU-08 no está habilitada para este
            actor en la demostración.
          </Alert>
          <EmptyState
            description="No se muestran expedientes, actuaciones ni fechas fuera del ámbito autorizado."
            icon={<ShieldAlert size={25} />}
            title="Sin acceso a esta bandeja"
          />
        </Panel>
      </>
    )
  }

  return (
    <>
      <Breadcrumbs items={["TRASU", "Pendientes y seguimiento"]} />
      <div className="page-title pending-title">
        <div>
          <Heading level={1}>Pendientes y seguimiento</Heading>
          <p>
            Actuaciones asignadas que requieren consulta o seguimiento por el
            usuario activo.
          </p>
        </div>
        <div className="page-actions">
          <details className="demo-tools">
            <summary>Simular estados</summary>
            <div>
          <Button
            icon={<AlertTriangle size={16} />}
            onClick={() => setError(true)}
            variant="quiet"
          >
            Probar error
          </Button>
          <Button
            icon={filters.forceEmpty ? <RotateCcw size={17} /> : <Inbox size={17} />}
            onClick={() => onFiltersChange({ ...filters, forceEmpty: !filters.forceEmpty })}
            variant="quiet"
          >
            {filters.forceEmpty ? "Restaurar datos de ejemplo" : "Probar estado vacío"}
          </Button>
            </div>
          </details>
          <Button
            icon={<RotateCcw size={16} />}
            onClick={refresh}
            variant="secondary"
          >
            Actualizar
          </Button>
          <Button
            icon={<FileSearch size={17} />}
            onClick={onLocate}
            variant="primary"
          >
            Localizar expediente
          </Button>
        </div>
      </div>

      <div className="demo-notice" role="note">
        <span>DEMO</span>
        <p>
          Referencias y actuaciones ficticias. Los estados son operacionales y
          no representan decisiones jurídicas.
        </p>
      </div>

      <Panel className="worklist-panel">
        <PanelHeader
          action={
            <span className="result-count">
              {filteredRecords.length} de {records.length} actuaciones de
              ejemplo
            </span>
          }
          eyebrow={
            actor === "supervisor"
              ? "Ámbito supervisor · STK-01"
              : actor === "reviewer"
                ? "Ámbito revisor · STK-03"
                : "Asignación actual · Usuario DEMO-014"
          }
          title="Actuaciones asignadas"
        />
        <div className="filters" role="search" data-guide="pending-filters">
          <SearchField
            label="Buscar dentro de pendientes"
            onChange={(event) =>
              onFiltersChange({ ...filters, search: event.target.value })
            }
            placeholder="Buscar por referencia o actuación"
            value={filters.search}
          />
          <SelectField
            label="Tipo de actuación"
            onChange={(event) =>
              onFiltersChange({ ...filters, type: event.target.value })
            }
            options={[
              { value: "all", label: "Todos los tipos" },
              { value: "Revisión documental", label: "Revisión documental" },
              { value: "Seguimiento", label: "Seguimiento" },
              { value: "Observaciones", label: "Observaciones" },
            ]}
            value={filters.type}
          />
          <SelectField
            label="Estado operacional"
            onChange={(event) =>
              onFiltersChange({ ...filters, status: event.target.value })
            }
            options={[
              { value: "all", label: "Todos los estados" },
              {
                value: "Pendiente de atención",
                label: "Pendiente de atención",
              },
              { value: "En revisión", label: "En revisión" },
              { value: "Con observaciones", label: "Con observaciones" },
            ]}
            value={filters.status}
          />
          <SelectField
            label="Orden"
            onChange={(event) =>
              onFiltersChange({ ...filters, sort: event.target.value })
            }
            options={[
              { value: "updated", label: "Actualización más reciente" },
              { value: "reference", label: "Referencia ascendente" },
            ]}
            value={filters.sort}
          />
          <Button
            icon={<RotateCcw size={16} />}
            onClick={clearFilters}
            variant="quiet"
          >
            Restablecer
          </Button>
        </div>
        {loading ? (
          <div className="worklist-system-state">
            <LoaderCircle className="spin" size={24} />
            <span>Cargando pendientes visibles…</span>
          </div>
        ) : error ? (
          <div className="worklist-system-state">
            <Alert tone="error" title="No fue posible cargar la bandeja">
              Estado demostrativo. La consulta no modificó expedientes ni
              fechas.
            </Alert>
            <Button onClick={refresh} variant="secondary">
              Reintentar
            </Button>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="worklist-table">
            <DataTable
              columns={[
                "Referencia ficticia",
                "Actuación pendiente",
                "Asignación / responsabilidad",
                "Actualización",
                "Estado operacional",
                "Acción",
              ]}
              rows={rows}
            />
            <div className="table-footnote">
              <ListFilter size={15} />
              <span>
                Resultados limitados a accesos y asignaciones de demostración.
              </span>
              <span className="table-page">Página 1 de 1</span>
            </div>
          </div>
        ) : (
          <div className="worklist-empty">
            <EmptyState
              action={
                <Button icon={<RotateCcw size={16} />} onClick={clearFilters}>
                  Volver a consultar
                </Button>
              }
              description={
                filters.forceEmpty
                  ? "Puedes volver a consultar la bandeja o localizar un expediente mediante el acceso autorizado."
                  : "Ajusta los criterios o restablece los filtros para volver a consultar la bandeja."
              }
              icon={<Inbox size={25} />}
              title={
                filters.forceEmpty
                  ? "No tienes actuaciones pendientes en este ámbito"
                  : "No se encontraron actuaciones con estos filtros"
              }
            />
          </div>
        )}
      </Panel>
    </>
  )
}
