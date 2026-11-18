import { ArrowRight, FileCheck2, LockKeyhole, RotateCcw } from "lucide-react"
import type { Actor } from "../components/AppShell"
import type { ExpedientDocument, ReviewTask } from "../data/documents"
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

export type ReviewFilters = {
  query: string
  status: string
}

export function ReviewQueue({
  actor,
  documents,
  tasks,
  filters,
  onFiltersChange,
  onOpen,
}: {
  actor: Actor
  documents: ExpedientDocument[]
  tasks: ReviewTask[]
  filters: ReviewFilters
  onFiltersChange: (filters: ReviewFilters) => void
  onOpen: (task: ReviewTask) => void
}) {
  const authorized = actor === "reviewer"
  const filtered = tasks.filter((task) => {
    const query = filters.query.trim().toLocaleLowerCase("es")
    return (
      (!query ||
        task.expedientReference.toLocaleLowerCase("es").includes(query) ||
        task.documentId.toLocaleLowerCase("es").includes(query) ||
        task.versionId.toLocaleLowerCase("es").includes(query)) &&
      (filters.status === "all" || task.status === filters.status)
    )
  })

  if (!authorized) {
    return (
      <>
        <Breadcrumbs items={["TRASU", "Revisiones pendientes"]} />
        <div className="page-title">
          <div>
            <span className="eyebrow">Atribución condicionada</span>
            <Heading level={1}>Revisiones pendientes</Heading>
          </div>
        </div>
        <Panel className="restricted-panel">
          <Alert tone="error" title="Acceso no autorizado">
            {actor === "vocal"
              ? "La atribución de revisión para Vocal STK-04 no está habilitada en esta demostración."
              : "Esta bandeja está asignada al Revisor STK-03."}
          </Alert>
          <EmptyState
            description="No se muestran versiones, documentos ni expedientes sin la atribución correspondiente."
            icon={<LockKeyhole size={25} />}
            title="No tienes acceso a las revisiones asignadas"
          />
        </Panel>
      </>
    )
  }

  const rows = filtered.map((task) => {
    const document = documents.find((item) => item.id === task.documentId)
    return [
      task.expedientReference,
      document?.name ?? task.documentId,
      <strong key={`${task.id}-version`}>{task.versionId}</strong>,
      task.assignedTo,
      task.receivedAt,
      <Badge
        key={`${task.id}-status`}
        tone={
          task.status === "Observada"
            ? "amber"
            : task.status === "Conformidad interna"
              ? "green"
              : "blue"
        }
      >
        {task.status}
      </Badge>,
      <Button
        icon={<ArrowRight size={15} />}
        key={`${task.id}-open`}
        onClick={() => onOpen(task)}
        variant="quiet"
      >
        {task.status === "Pendiente de revisión" ? "Abrir revisión" : "Ver resultado"}
      </Button>,
    ]
  })

  return (
    <>
      <Breadcrumbs items={["TRASU", "Revisiones pendientes"]} />
      <div className="page-title pending-title">
        <div>
          <span className="eyebrow">Revisor STK-03 · circuito interno</span>
          <Heading level={1}>Revisiones pendientes</Heading>
          <p>
            Versiones exactas asignadas al revisor autorizado. No es un listado
            general de expedientes.
          </p>
        </div>
      </div>
      <Panel className="worklist-panel">
        <PanelHeader
          action={
            <span className="result-count">{filtered.length} revisiones</span>
          }
          description="Los filtros se conservan al regresar de una revisión."
          eyebrow="Asignación demostrativa"
          title="Versiones asignadas"
        />
        <div className="filters" role="search">
          <SearchField
            label="Buscar revisión"
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="Buscar expediente, documento o versión"
            value={filters.query}
          />
          <SelectField
            label="Estado interno"
            onChange={(event) =>
              onFiltersChange({ ...filters, status: event.target.value })
            }
            options={[
              { value: "all", label: "Todos los estados" },
              {
                value: "Pendiente de revisión",
                label: "Pendiente de revisión",
              },
              { value: "Observada", label: "Observada" },
              {
                value: "Conformidad interna",
                label: "Conformidad interna",
              },
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
          <div className="request-table review-table">
            <DataTable
              columns={[
                "Expediente",
                "Documento",
                "Versión exacta",
                "Asignación",
                "Recepción",
                "Estado interno",
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
              description="No hay versiones asignadas que coincidan con los criterios."
              icon={<FileCheck2 size={25} />}
              title="Sin revisiones para mostrar"
            />
          </div>
        )}
      </Panel>
    </>
  )
}
