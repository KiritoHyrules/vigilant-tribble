import {
  AlertTriangle,
  ArrowRight,
  Inbox,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react"
import { useState } from "react"
import type { Actor } from "../components/AppShell"
import type { ExchangeRecord, ExchangeStatus } from "../data/exchanges"
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

export type ExchangeFilters = {
  query: string
  status: string
  date: string
}

function ExchangeStatusBadge({ status }: { status: ExchangeStatus }) {
  const tone =
    status === "Confirmado"
      ? "green"
      : status === "Fallido"
        ? "amber"
        : status === "Pendiente de confirmación"
          ? "blue"
          : "neutral"
  return <Badge tone={tone}>{status}</Badge>
}

export function ExchangeList({
  actor,
  records,
  filters,
  onFiltersChange,
  onOpen,
  onRegister,
}: {
  actor: Actor
  records: ExchangeRecord[]
  filters: ExchangeFilters
  onFiltersChange: (filters: ExchangeFilters) => void
  onOpen: (record: ExchangeRecord) => void
  onRegister: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const authorized = actor === "exchange"
  const filtered = records.filter((record) => {
    const query = filters.query.trim().toLocaleLowerCase("es")
    return (
      (!query ||
        record.id.toLocaleLowerCase("es").includes(query) ||
        record.expedientReference.toLocaleLowerCase("es").includes(query)) &&
      (filters.status === "all" || record.status === filters.status) &&
      (!filters.date || record.registeredAt.startsWith(filters.date))
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
        <Breadcrumbs items={["TRASU", "Intercambios registrados"]} />
        <div className="page-title">
          <div>
            <span className="eyebrow">Atribución condicionada</span>
            <Heading level={1}>Intercambios registrados</Heading>
          </div>
        </div>
        <Panel className="restricted-panel">
          <Alert tone="error" title="Acceso no autorizado">
            La atribución para STK-08 no está habilitada en esta demostración.
            No se exponen destinos, referencias ni intentos.
          </Alert>
          <EmptyState
            description="Selecciona el actor STK-06 habilitado para probar este circuito."
            icon={<ShieldAlert size={25} />}
            title="Sin acceso a intercambios"
          />
        </Panel>
      </>
    )
  }

  const rows = filtered.map((record) => [
    <div className="reference-cell" key={`${record.id}-reference`}>
      <strong>{record.expedientReference}</strong>
      <span>{record.id}</span>
    </div>,
    record.actionType,
    <div className="action-cell" key={`${record.id}-channel`}>
      <strong>{record.destination}</strong>
      <span>{record.channel}</span>
    </div>,
    record.registeredAt,
    <ExchangeStatusBadge key={`${record.id}-status`} status={record.status} />,
    `${record.attempts.length} ${
      record.attempts.length === 1 ? "intento" : "intentos"
    }`,
    <Button
      icon={<ArrowRight size={15} />}
      key={`${record.id}-open`}
      onClick={() => onOpen(record)}
      variant="quiet"
    >
      Ver intercambio
    </Button>,
  ])

  return (
    <>
      <Breadcrumbs items={["TRASU", "Intercambios registrados"]} />
      <div className="page-title pending-title">
        <div>
          <span className="eyebrow">STK-06 habilitado · datos ficticios</span>
          <Heading level={1}>Intercambios registrados</Heading>
          <p>
            Consulta salidas e intentos registrados sin interpretar el registro
            como confirmación de un sistema externo.
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
          <Button icon={<Plus size={16} />} onClick={onRegister}>
            Registrar salida
          </Button>
        </div>
      </div>
      <div className="demo-notice" role="note">
        <span>DEMO</span>
        <p>
          Los estados son ilustrativos. Solo «Confirmado» se muestra cuando
          existe una referencia demostrativa que lo sustenta.
        </p>
      </div>
      <Panel className="worklist-panel">
        <PanelHeader
          action={
            <span className="result-count">{filtered.length} intercambios</span>
          }
          description="Los filtros se conservan al abrir y cerrar el historial."
          eyebrow="Consulta autorizada"
          title="Salidas e intercambios"
        />
        <div className="exchange-filters" role="search">
          <SearchField
            label="Buscar expediente o intercambio"
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="Buscar expediente o INT-DEMO"
            value={filters.query}
          />
          <SelectField
            label="Situación"
            onChange={(event) =>
              onFiltersChange({ ...filters, status: event.target.value })
            }
            options={[
              { value: "all", label: "Todas las situaciones" },
              { value: "Registrado", label: "Registrado" },
              {
                value: "Pendiente de confirmación",
                label: "Pendiente de confirmación",
              },
              { value: "Fallido", label: "Fallido" },
              { value: "Confirmado", label: "Confirmado" },
              {
                value: "Resultado desconocido",
                label: "Resultado desconocido",
              },
            ]}
            value={filters.status}
          />
          <TextField
            label="Fecha registrada"
            onChange={(event) =>
              onFiltersChange({ ...filters, date: event.target.value })
            }
            placeholder="dd/mm/aaaa"
            value={filters.date}
          />
          <Button
            onClick={() =>
              onFiltersChange({ query: "", status: "all", date: "" })
            }
            variant="quiet"
          >
            Limpiar
          </Button>
        </div>
        {loading ? (
          <div className="worklist-system-state">
            <LoaderCircle className="spin" size={24} />
            <span>Cargando intercambios registrados…</span>
          </div>
        ) : error ? (
          <div className="worklist-system-state">
            <Alert tone="error" title="No fue posible cargar los intercambios">
              Estado demostrativo; no se ejecutó ninguna operación externa.
            </Alert>
            <Button onClick={refresh} variant="secondary">
              Reintentar
            </Button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="request-table exchange-table">
            <DataTable
              columns={[
                "Expediente / intercambio",
                "Tipo de actuación",
                "Destino / canal",
                "Fecha y hora",
                "Situación",
                "Intentos",
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
                  onClick={() =>
                    onFiltersChange({ query: "", status: "all", date: "" })
                  }
                  variant="secondary"
                >
                  Limpiar filtros
                </Button>
              }
              description="No existen intercambios que coincidan con los criterios."
              icon={<Inbox size={25} />}
              title="Sin intercambios para mostrar"
            />
          </div>
        )}
      </Panel>
    </>
  )
}
