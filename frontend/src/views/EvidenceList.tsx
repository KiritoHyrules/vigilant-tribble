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
import type { TraceRecord } from "../data/traceability"
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
  TextField,
} from "../components/system"

export type EvidenceFilters = {
  query: string
  actionType: string
  date: string
  actor: string
  evidence: string
}

export function EvidenceList({
  actor,
  records,
  filters,
  onFiltersChange,
  onOpen,
}: {
  actor: Actor
  records: TraceRecord[]
  filters: EvidenceFilters
  onFiltersChange: (filters: EvidenceFilters) => void
  onOpen: (record: TraceRecord) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const authorized = actor === "auditor"
  const filtered = records.filter((record) => {
    const query = filters.query.trim().toLocaleLowerCase("es")
    const actorQuery = filters.actor.trim().toLocaleLowerCase("es")
    return (
      (!query ||
        record.expedientReference.toLocaleLowerCase("es").includes(query) ||
        record.action.toLocaleLowerCase("es").includes(query) ||
        record.id.toLocaleLowerCase("es").includes(query)) &&
      (filters.actionType === "all" ||
        record.actionType === filters.actionType) &&
      (!filters.date || record.date.startsWith(filters.date)) &&
      (!actorQuery ||
        record.actor.toLocaleLowerCase("es").includes(actorQuery)) &&
      (filters.evidence === "all" ||
        record.evidenceAvailability === filters.evidence)
    )
  })

  const reset = () =>
    onFiltersChange({
      query: "",
      actionType: "all",
      date: "",
      actor: "",
      evidence: "all",
    })

  const refresh = () => {
    setError(false)
    setLoading(true)
    window.setTimeout(() => setLoading(false), 450)
  }

  if (!authorized) {
    return (
      <>
        <Breadcrumbs items={["TRASU", "Evidencia y trazabilidad"]} />
        <div className="page-title">
          <div>
            <span className="eyebrow">Ámbito protegido</span>
            <Heading level={1}>Evidencia y trazabilidad</Heading>
          </div>
        </div>
        <Panel className="restricted-panel">
          <Alert tone="error" title="Acceso restringido">
            La consulta especializada corresponde al Auditor STK-09. No se
            revelan actuaciones ni referencias.
          </Alert>
          <EmptyState
            description="Selecciona el perfil auditor de demostración para consultar este ámbito."
            icon={<ShieldAlert size={25} />}
            title="Sin autorización para consultar trazas"
          />
        </Panel>
      </>
    )
  }

  const rows = filtered.map((record) => [
    record.date,
    <div className="action-cell" key={`${record.id}-action`}>
      <strong>{record.action}</strong>
      <span>{record.actionType}</span>
    </div>,
    record.expedientReference,
    <div className="action-cell" key={`${record.id}-actor`}>
      <strong>{record.actor}</strong>
      <span>{record.source}</span>
    </div>,
    <Badge
      key={`${record.id}-evidence`}
      tone={record.evidenceAvailability === "Disponible" ? "green" : "neutral"}
    >
      {record.evidenceAvailability}
    </Badge>,
    <Button
      icon={<ArrowRight size={15} />}
      key={`${record.id}-open`}
      onClick={() => onOpen(record)}
      variant="quiet"
    >
      Consultar detalle
    </Button>,
  ])

  return (
    <>
      <Breadcrumbs items={["TRASU", "Evidencia y trazabilidad"]} />
      <div className="page-title pending-title">
        <div>
          <span className="eyebrow">Auditor STK-09 · solo lectura</span>
          <Heading level={1}>Evidencia y trazabilidad</Heading>
          <p>
            Consulta actuaciones dentro del ámbito autorizado sin modificar
            expedientes, documentos ni historial.
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
            <span className="result-count">{filtered.length} trazas</span>
          }
          description="No se infieren firmas, sellos de tiempo ni integridad criptográfica."
          eyebrow="Consulta autorizada"
          title="Actuaciones registradas"
        />
        <div className="evidence-filters" role="search">
          <SearchField
            label="Buscar traza"
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="Expediente, actuación o traza"
            value={filters.query}
          />
          <SelectField
            label="Tipo de actuación"
            onChange={(event) =>
              onFiltersChange({ ...filters, actionType: event.target.value })
            }
            options={[
              { value: "all", label: "Todos los tipos" },
              { value: "Documento", label: "Documento" },
              { value: "Intercambio", label: "Intercambio" },
              { value: "Responsabilidad", label: "Responsabilidad" },
            ]}
            value={filters.actionType}
          />
          <TextField
            label="Fecha registrada"
            onChange={(event) =>
              onFiltersChange({ ...filters, date: event.target.value })
            }
            placeholder="dd/mm/aaaa"
            value={filters.date}
          />
          <TextField
            label="Actor o fuente"
            onChange={(event) =>
              onFiltersChange({ ...filters, actor: event.target.value })
            }
            placeholder="Actor registrado"
            value={filters.actor}
          />
          <SelectField
            label="Evidencia"
            onChange={(event) =>
              onFiltersChange({ ...filters, evidence: event.target.value })
            }
            options={[
              { value: "all", label: "Toda disponibilidad" },
              { value: "Disponible", label: "Disponible" },
              { value: "No disponible", label: "No disponible" },
            ]}
            value={filters.evidence}
          />
          <Button onClick={reset} variant="quiet">
            Limpiar
          </Button>
        </div>
        {loading ? (
          <div className="worklist-system-state">
            <LoaderCircle className="spin" size={24} />
            <span>Cargando trazas autorizadas…</span>
          </div>
        ) : error ? (
          <div className="worklist-system-state">
            <Alert tone="error" title="No fue posible cargar la trazabilidad">
              Estado demostrativo; ningún registro fue modificado.
            </Alert>
            <Button onClick={refresh} variant="secondary">
              Reintentar
            </Button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="request-table evidence-table">
            <DataTable
              columns={[
                "Fecha y hora",
                "Actuación",
                "Expediente",
                "Actor o fuente",
                "Evidencia",
                "Acción",
              ]}
              rows={rows}
            />
          </div>
        ) : (
          <div className="worklist-empty">
            <EmptyState
              action={
                <Button onClick={reset} variant="secondary">
                  Limpiar filtros
                </Button>
              }
              description="No existen registros que coincidan con los criterios actuales."
              icon={<Inbox size={25} />}
              title="Sin trazas para mostrar"
            />
          </div>
        )}
      </Panel>
    </>
  )
}
