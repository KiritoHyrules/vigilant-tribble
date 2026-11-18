import {
  AlertTriangle,
  ArrowRight,
  Inbox,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react"
import { useState } from "react"
import type { Actor } from "../components/AppShell"
import type {
  InterventionRecord,
  InterventionStatus,
} from "../data/interventions"
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

export type InterventionFilters = {
  query: string
  status: string
}

export function interventionTone(status: InterventionStatus) {
  return status === "Recuperación comprobada"
    ? "green" as const
    : status === "Recuperación parcial"
      ? "blue" as const
      : status === "Verificación pendiente"
        ? "amber" as const
        : "neutral" as const
}

export function InterventionList({
  actor,
  records,
  filters,
  onFiltersChange,
  onOpen,
}: {
  actor: Actor
  records: InterventionRecord[]
  filters: InterventionFilters
  onFiltersChange: (filters: InterventionFilters) => void
  onOpen: (record: InterventionRecord) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const authorized = actor === "support"
  const filtered = records.filter((record) => {
    const query = filters.query.trim().toLocaleLowerCase("es")
    return (
      (!query ||
        record.id.toLocaleLowerCase("es").includes(query) ||
        record.component.toLocaleLowerCase("es").includes(query)) &&
      (filters.status === "all" || record.status === filters.status)
    )
  })
  const refresh = () => {
    setError(false)
    setLoading(true)
    window.setTimeout(() => setLoading(false), 450)
  }

  if (!authorized) {
    return (
      <>
        <Breadcrumbs items={["TRASU", "Intervenciones técnicas"]} />
        <div className="page-title">
          <div>
            <span className="eyebrow">Ámbito técnico protegido</span>
            <Heading level={1}>Intervenciones técnicas</Heading>
          </div>
        </div>
        <Panel className="restricted-panel">
          <Alert tone="error" title="Acceso restringido">
            Esta vista corresponde exclusivamente a Soporte STK-08.
          </Alert>
          <EmptyState
            description="No se muestran condiciones ni actuaciones técnicas a otros perfiles."
            icon={<ShieldAlert size={25} />}
            title="Sin autorización técnica"
          />
        </Panel>
      </>
    )
  }

  const rows = filtered.map((record) => [
    <strong key={`${record.id}-id`}>{record.id}</strong>,
    record.component,
    record.date,
    record.condition,
    record.responsible,
    <div className="action-cell" key={`${record.id}-result`}>
      <Badge tone={interventionTone(record.status)}>{record.status}</Badge>
      <span>{record.result}</span>
    </div>,
    <Button
      icon={<ArrowRight size={15} />}
      key={`${record.id}-open`}
      onClick={() => onOpen(record)}
      variant="quiet"
    >
      Ver intervención
    </Button>,
  ])

  return (
    <>
      <Breadcrumbs items={["TRASU", "Intervenciones técnicas"]} />
      <div className="page-title pending-title">
        <div>
          <span className="eyebrow">Soporte STK-08 · modo demostrativo</span>
          <Heading level={1}>Intervenciones y estado operacional</Heading>
          <p>
            Registros técnicos aislados de las decisiones y permisos del
            expediente.
          </p>
        </div>
        <div className="page-actions">
          <Button
            icon={<AlertTriangle size={16} />}
            onClick={() => setError(true)}
            variant="quiet"
          >
            Probar error
          </Button>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={refresh}
            variant="secondary"
          >
            Actualizar
          </Button>
        </div>
      </div>
      <Panel className="worklist-panel">
        <PanelHeader
          action={
            <span className="result-count">
              {filtered.length} intervenciones
            </span>
          }
          description="Los resultados son estados locales sujetos a especificación final."
          eyebrow="Registro técnico"
          title="Intervenciones autorizadas"
        />
        <div className="filters" role="search">
          <SearchField
            label="Buscar intervención"
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="Identificador o componente"
            value={filters.query}
          />
          <SelectField
            label="Estado operacional"
            onChange={(event) =>
              onFiltersChange({ ...filters, status: event.target.value })
            }
            options={[
              { value: "all", label: "Todos los estados" },
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
            value={filters.status}
          />
          <Button
            onClick={() => onFiltersChange({ query: "", status: "all" })}
            variant="quiet"
          >
            Limpiar
          </Button>
        </div>
        {loading ? (
          <div className="worklist-system-state">
            <LoaderCircle className="spin" size={24} />
            <span>Cargando intervenciones…</span>
          </div>
        ) : error ? (
          <div className="worklist-system-state">
            <Alert tone="error" title="No fue posible cargar intervenciones">
              Estado demostrativo; no se ejecutó ninguna actuación técnica.
            </Alert>
            <Button onClick={refresh} variant="secondary">
              Reintentar
            </Button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="request-table intervention-table">
            <DataTable
              columns={[
                "Intervención",
                "Componente o servicio",
                "Fecha y hora",
                "Condición reportada",
                "Responsable técnico",
                "Resultado",
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
              description="No existen intervenciones para los criterios seleccionados."
              icon={<Inbox size={25} />}
              title="Sin intervenciones para mostrar"
            />
          </div>
        )}
      </Panel>
    </>
  )
}
