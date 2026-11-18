import {
  AlertTriangle,
  ArrowLeft,
  FileSearch,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
  Wrench,
} from "lucide-react"
import { useMemo, useState } from "react"
import type { Actor } from "../components/AppShell"
import type {
  DocumentVersion,
  ExpedientDocument,
  ReviewTask,
} from "../data/documents"
import type { Expedient } from "../data/expedients"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  Heading,
  Panel,
  PanelHeader,
  SearchField,
  SelectField,
} from "../components/system"

export function DocumentWorkspace({
  actor,
  record,
  documents,
  reviews,
  activeVersionId,
  notice,
  onBack,
  onSelectVersion,
  onSubmitReview,
  onSubsanate,
}: {
  actor: Actor
  record: Expedient
  documents: ExpedientDocument[]
  reviews: ReviewTask[]
  activeVersionId: string | null
  notice?: string
  onBack: () => void
  onSelectVersion: (versionId: string) => void
  onSubmitReview: (
    document: ExpedientDocument,
    version: DocumentVersion,
  ) => void
  onSubsanate: (document: ExpedientDocument, version: DocumentVersion) => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const versions = useMemo(
    () =>
      documents.flatMap((document) =>
        document.versions.map((version) => ({ document, version })),
      ),
    [documents],
  )
  const filtered = versions.filter(({ document, version }) => {
    const term = query.trim().toLocaleLowerCase("es")
    return (
      (!term ||
        document.id.toLocaleLowerCase("es").includes(term) ||
        document.name.toLocaleLowerCase("es").includes(term) ||
        version.id.toLocaleLowerCase("es").includes(term)) &&
      (status === "all" || version.status === status)
    )
  })
  const active =
    versions.find(({ version }) => version.id === activeVersionId) ??
    versions.at(-1)
  const activeReview = reviews.find(
    (review) =>
      review.documentId === active?.document.id &&
      review.versionId === active?.version.id,
  )

  const refresh = () => {
    setError(false)
    setLoading(true)
    window.setTimeout(() => setLoading(false), 450)
  }

  return (
    <>
      <Breadcrumbs
        items={["TRASU", record.reference, "Documentos y versiones"]}
      />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onBack}
        variant="quiet"
      >
        Volver al detalle del expediente
      </Button>
      <div className="page-title">
        <div>
          <span className="eyebrow">Ciclo documental interno · prototipo</span>
          <Heading level={1}>Documentos y versiones</Heading>
          <p>
            Consulta cada versión exacta de {record.reference} sin sobrescribir
            ni eliminar versiones anteriores.
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

      {notice && (
        <Alert tone="success" title="Actualización documental registrada">
          {notice}
        </Alert>
      )}

      <div className="documents-layout" data-guide="document-versions">
        <Panel className="documents-list">
          <PanelHeader
            action={<Badge tone="neutral">{versions.length} versiones</Badge>}
            description="Documento y versión se presentan como entidades distintas."
            eyebrow="Expediente ficticio"
            title="Listado documental"
          />
          <div className="document-filters">
            <SearchField
              label="Buscar documento o versión"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar DOC-021 o v1"
              value={query}
            />
            <SelectField
              label="Situación interna"
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { value: "all", label: "Todas las situaciones" },
                { value: "Apta para envío", label: "Apta para envío" },
                {
                  value: "En revisión interna",
                  label: "En revisión interna",
                },
                { value: "Observada", label: "Observada" },
                {
                  value: "Conformidad interna",
                  label: "Conformidad interna",
                },
                {
                  value: "Nueva versión · requiere revisión",
                  label: "Requiere revisión",
                },
              ]}
              value={status}
            />
          </div>

          {loading ? (
            <div className="document-state" aria-live="polite">
              <LoaderCircle className="spin" size={24} />
              <span>Cargando documentos y versiones…</span>
            </div>
          ) : error ? (
            <div className="document-state">
              <Alert tone="error" title="No fue posible cargar los documentos">
                Estado de error demostrativo. No se modificó información.
              </Alert>
              <Button onClick={refresh} variant="secondary">
                Reintentar
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              description="Este expediente no tiene documentos disponibles en la demostración."
              icon={<FileText size={24} />}
              title="Sin documentos registrados"
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setQuery("")
                    setStatus("all")
                  }}
                  variant="secondary"
                >
                  Limpiar filtros
                </Button>
              }
              description="Ajusta los criterios para volver a consultar."
              icon={<Search size={24} />}
              title="No se encontraron versiones"
            />
          ) : (
            <div className="document-rows">
              {filtered.map(({ document, version }) => (
                <button
                  aria-current={active?.version.id === version.id}
                  className="document-row"
                  key={version.id}
                  onClick={() => onSelectVersion(version.id)}
                  type="button"
                >
                  <span className="document-icon">
                    <FileText size={18} />
                  </span>
                  <span className="document-row__identity">
                    <strong>{document.name}</strong>
                    <small>
                      Documento {document.id} · Versión exacta {version.id}
                    </small>
                  </span>
                  <span className="document-row__meta">
                    <small>{version.author}</small>
                    <time>{version.createdAt}</time>
                  </span>
                  <Badge
                    tone={
                      version.status === "Observada"
                        ? "amber"
                        : version.status === "Conformidad interna"
                          ? "green"
                          : "blue"
                    }
                  >
                    {version.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="version-inspector">
          {active ? (
            <>
              <PanelHeader
                description={active.document.type}
                eyebrow="Versión seleccionada"
                title={active.version.id}
              />
              <div className="version-preview">
                <div className="version-preview__page">
                  <FileSearch size={34} />
                  <strong>{active.document.name}</strong>
                  <span>Vista simulada del contenido</span>
                  <small>{active.version.fileName}</small>
                </div>
              </div>
              <dl className="compact-details">
                <div>
                  <dt>Documento</dt>
                  <dd>{active.document.id}</dd>
                </div>
                <div>
                  <dt>Versión exacta</dt>
                  <dd>{active.version.id}</dd>
                </div>
                <div>
                  <dt>Autor o responsable</dt>
                  <dd>{active.version.author}</dd>
                </div>
                <div>
                  <dt>Situación interna</dt>
                  <dd>{active.version.status}</dd>
                </div>
                {active.version.previousVersionId && (
                  <div>
                    <dt>Versión anterior enlazada</dt>
                    <dd>{active.version.previousVersionId}</dd>
                  </div>
                )}
              </dl>
              {active.version.observations.length > 0 && (
                <div className="version-trace">
                  <strong>Observaciones vinculadas a esta versión</strong>
                  {active.version.observations.map((observation) => (
                    <div key={observation.id}>
                      <Badge tone="amber">{observation.id}</Badge>
                      <span>{observation.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {active.version.attention &&
                active.version.attention.length > 0 && (
                  <div className="version-trace">
                    <strong>
                      Atención registrada desde{" "}
                      {active.version.previousVersionId}
                    </strong>
                    {active.version.attention.map((item) => (
                      <div key={item.observationId}>
                        <Badge tone="blue">{item.status}</Badge>
                        <span>{item.note}</span>
                      </div>
                    ))}
                  </div>
                )}
              <div className="version-actions">
                {actor === "analyst" &&
                  (active.version.status === "Apta para envío" ||
                    active.version.status ===
                      "Nueva versión · requiere revisión") &&
                  !activeReview && (
                    <Button
                      icon={<Send size={16} />}
                      onClick={() =>
                        onSubmitReview(active.document, active.version)
                      }
                    >
                      Someter esta versión a revisión
                    </Button>
                  )}
                {actor === "analyst" &&
                  active.version.status === "Observada" && (
                    <Button
                      icon={<Wrench size={16} />}
                      onClick={() =>
                        onSubsanate(active.document, active.version)
                      }
                    >
                      Subsanar observaciones
                    </Button>
                  )}
                {activeReview && (
                  <Badge tone="neutral">
                    Revisión {activeReview.id} · {activeReview.status}
                  </Badge>
                )}
                {actor !== "analyst" && (
                  <Badge tone="neutral">Acción no autorizada</Badge>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              description="Selecciona una versión para consultar su identidad exacta."
              icon={<FileText size={24} />}
              title="Ninguna versión seleccionada"
            />
          )}
        </Panel>
      </div>
    </>
  )
}
