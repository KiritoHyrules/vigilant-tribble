import {
  ArrowRight,
  FileSearch,
  ListFilter,
  LockKeyhole,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react"
import type { Expedient } from "../data/expedients"
import { StatusBadge } from "../components/StatusBadge"
import {
  Alert,
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

export type LocateFilters = {
  query: string
  status: string
  responsible: string
  hasSearched: boolean
  restricted: boolean
}

export function LocateView({
  records,
  filters,
  onFiltersChange,
  onOpen,
}: {
  records: Expedient[]
  filters: LocateFilters
  onFiltersChange: (filters: LocateFilters) => void
  onOpen: (record: Expedient) => void
}) {
  const results = records.filter((record) => {
    const term = filters.query.trim().toLocaleLowerCase("es")
    const matchesQuery =
      !term || record.reference.toLocaleLowerCase("es").includes(term)
    const matchesStatus =
      filters.status === "all" || record.status === filters.status
    const matchesResponsible =
      filters.responsible === "all" ||
      record.responsible === filters.responsible ||
      (filters.responsible === "unassigned" && !record.responsible)
    return matchesQuery && matchesStatus && matchesResponsible
  })

  const reset = () =>
    onFiltersChange({
      query: "",
      status: "all",
      responsible: "all",
      hasSearched: false,
      restricted: false,
    })

  const rows = results.map((record) => [
    <div className="reference-cell" key={`${record.reference}-reference`}>
      <strong>{record.reference}</strong>
      <span>Expediente ficticio</span>
    </div>,
    record.type,
    <StatusBadge key={`${record.reference}-status`} status={record.status} />,
    record.responsible ?? "Por asignar",
    record.updated,
    <Button
      icon={<ArrowRight size={15} />}
      key={`${record.reference}-open`}
      onClick={() => onOpen(record)}
      variant="quiet"
    >
      Ver expediente
    </Button>,
  ])

  return (
    <>
      <Breadcrumbs items={["TRASU", "Localizar expedientes"]} />
      <div className="page-title pending-title">
        <div>
          <span className="eyebrow">Consulta autorizada · datos ficticios</span>
          <Heading level={1}>Localizar expedientes</Heading>
          <p>
            Consulta referencias incorporadas al circuito interno sin modificar
            sus datos ni su situación operativa.
          </p>
        </div>
        <Button
          icon={<ShieldAlert size={17} />}
          onClick={() =>
            onFiltersChange({ ...filters, restricted: !filters.restricted })
          }
          variant="secondary"
        >
          {filters.restricted
            ? "Restaurar acceso de demostración"
            : "Probar acceso restringido"}
        </Button>
      </div>

      <div className="demo-notice" role="note">
        <span>DEMO</span>
        <p>
          La búsqueda opera únicamente sobre expedientes ficticios y no
          consulta sistemas institucionales externos.
        </p>
      </div>

      <Panel className="locator-panel">
        <PanelHeader
          description="Los filtros disponibles corresponden únicamente a los datos de esta demostración."
          eyebrow="Búsqueda reutilizable"
          title="Criterios de localización"
        />
        <div className="locator-filters" role="search">
          <SearchField
            label="Identificador de expediente"
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="Ejemplo: DEMO-TRASU-003"
            value={filters.query}
          />
          <SelectField
            label="Responsable vigente"
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                responsible: event.target.value,
                hasSearched: true,
              })
            }
            options={[
              { value: "all", label: "Todos los responsables" },
              { value: "Usuario DEMO-014", label: "Usuario DEMO-014" },
              { value: "Usuario DEMO-021", label: "Usuario DEMO-021" },
              { value: "unassigned", label: "Por asignar" },
            ]}
            value={filters.responsible}
          />
          <SelectField
            label="Situación operativa"
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value,
                hasSearched: true,
              })
            }
            options={[
              { value: "all", label: "Todas las situaciones" },
              {
                value: "Pendiente de atención",
                label: "Pendiente de atención",
              },
              { value: "En revisión", label: "En revisión" },
              { value: "Con observaciones", label: "Con observaciones" },
            ]}
            value={filters.status}
          />
          <Button
            icon={<Search size={16} />}
            onClick={() => onFiltersChange({ ...filters, hasSearched: true })}
          >
            Buscar
          </Button>
          <Button
            icon={<RotateCcw size={16} />}
            onClick={reset}
            variant="quiet"
          >
            Limpiar
          </Button>
        </div>

        {filters.restricted ? (
          <div className="locator-state">
            <Alert tone="error" title="Acceso restringido">
              Las atribuciones de esta sesión de prueba no permiten consultar
              los datos protegidos de expedientes.
            </Alert>
            <EmptyState
              description="No se muestran referencias, responsables ni documentos mientras el acceso permanezca restringido."
              icon={<LockKeyhole size={25} />}
              title="No tienes autorización para consultar este ámbito"
            />
          </div>
        ) : !filters.hasSearched ? (
          <div className="locator-state">
            <EmptyState
              action={
                <Button
                  icon={<FileSearch size={16} />}
                  onClick={() =>
                    onFiltersChange({ ...filters, hasSearched: true })
                  }
                  variant="secondary"
                >
                  Mostrar expedientes de ejemplo
                </Button>
              }
              description="Ingresa un identificador o utiliza los filtros disponibles para iniciar una consulta."
              icon={<FileSearch size={25} />}
              title="Aún no has realizado una búsqueda"
            />
          </div>
        ) : results.length === 0 ? (
          <div className="locator-state">
            <EmptyState
              action={
                <Button
                  icon={<RotateCcw size={16} />}
                  onClick={reset}
                  variant="secondary"
                >
                  Limpiar criterios
                </Button>
              }
              description="Revisa el identificador o cambia los filtros de la consulta."
              icon={<Search size={25} />}
              title="No se encontraron expedientes"
            />
          </div>
        ) : (
          <div className="locator-results">
            <div className="results-heading">
              <span>
                {results.length}{" "}
                {results.length === 1 ? "resultado" : "resultados"}
              </span>
              <small>Datos ficticios de demostración</small>
            </div>
            <DataTable
              columns={[
                "Referencia",
                "Tipo de actuación",
                "Situación operativa",
                "Responsable vigente",
                "Última actuación",
                "Acción",
              ]}
              rows={rows}
            />
            <div className="table-footnote">
              <ListFilter size={15} />
              <span>La consulta no modifica los datos del expediente.</span>
            </div>
          </div>
        )}
      </Panel>
    </>
  )
}
