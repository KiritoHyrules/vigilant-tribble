import { ArrowLeft, FilePlus2, Link2, Upload } from "lucide-react"
import { useMemo, useState } from "react"
import type { DocumentVersion, ExpedientDocument } from "../data/documents"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Dialog,
  Heading,
  Panel,
  PanelHeader,
  SelectField,
  TextareaField,
} from "../components/system"

export type ObservationAttention = {
  observationId: string
  status: string
  note: string
}

export function SubsanationView({
  document,
  version,
  onCancel,
  onConfirm,
}: {
  document: ExpedientDocument
  version: DocumentVersion
  onCancel: () => void
  onConfirm: (fileName: string, attention: ObservationAttention[]) => void
}) {
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [attention, setAttention] =
    useState<Record<string, ObservationAttention>>(() =>
      Object.fromEntries(
        version.observations.map((observation) => [
          observation.id,
          { observationId: observation.id, status: "", note: "" },
        ]),
      ),
    )
  const nextVersion = `${document.id} · v${
    Math.max(...document.versions.map((item) => item.number)) + 1
  }`
  const values = useMemo(() => Object.values(attention), [attention])

  const review = () => {
    if (!fileName) {
      setError("Incorpora el archivo demostrativo de la nueva versión.")
      return
    }
    if (values.some((item) => !item.status || !item.note.trim())) {
      setError("Registra el tipo de atención y una nota para cada observación.")
      return
    }
    setError("")
    setConfirmOpen(true)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          "TRASU",
          document.expedientReference,
          version.id,
          "Subsanar observaciones",
        ]}
      />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onCancel}
        variant="quiet"
      >
        Cancelar y volver sin cambios
      </Button>
      <div className="page-title">
        <div>
          <span className="eyebrow">Analista STK-02 · nueva versión</span>
          <Heading level={1}>Subsanar observaciones</Heading>
          <p>
            Atiende las observaciones de {version.id} creando {nextVersion}. La
            versión observada seguirá disponible.
          </p>
        </div>
      </div>

      <div className="subsanation-chain" aria-label="Trazabilidad de versiones">
        <div>
          <span>Versión observada</span>
          <strong>{version.id}</strong>
          <Badge tone="amber">Observada</Badge>
        </div>
        <Link2 size={20} />
        <div>
          <span>Atención de observaciones</span>
          <strong>{version.observations.length} registros</strong>
          <Badge tone="neutral">En preparación</Badge>
        </div>
        <Link2 size={20} />
        <div>
          <span>Nueva versión</span>
          <strong>{nextVersion}</strong>
          <Badge tone="blue">Requiere revisión</Badge>
        </div>
      </div>

      <div className="form-layout subsanation-layout">
        <Panel className="form-panel">
          <PanelHeader
            description="Cada atención queda enlazada a la observación de la versión exacta."
            eyebrow="Observaciones"
            title={`Atención de ${version.id}`}
          />
          <div className="attention-list">
            {version.observations.map((observation, index) => {
              const value = attention[observation.id]
              return (
                <div key={observation.id}>
                  <div className="attention-heading">
                    <Badge tone="amber">OBS-{index + 1}</Badge>
                    <p>{observation.text}</p>
                  </div>
                  <SelectField
                    label="Tipo de atención"
                    onChange={(event) =>
                      setAttention((current) => ({
                        ...current,
                        [observation.id]: {
                          ...current[observation.id],
                          status: event.target.value,
                        },
                      }))
                    }
                    options={[
                      { value: "", label: "Seleccionar atención" },
                      { value: "Atendida", label: "Atendida" },
                      {
                        value: "Atención parcial",
                        label: "Atención parcial",
                      },
                    ]}
                    value={value.status}
                  />
                  <TextareaField
                    label="Descripción de la atención"
                    onChange={(event) =>
                      setAttention((current) => ({
                        ...current,
                        [observation.id]: {
                          ...current[observation.id],
                          note: event.target.value,
                        },
                      }))
                    }
                    placeholder="Explica cómo se atendió esta observación"
                    rows={3}
                    value={value.note}
                  />
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel className="form-context">
          <PanelHeader eyebrow="Archivo demostrativo" title={nextVersion} />
          <div className="upload-box">
            <Upload size={24} />
            {fileName ? (
              <>
                <strong>{fileName}</strong>
                <span>Archivo seleccionado para el prototipo</span>
              </>
            ) : (
              <>
                <strong>Ningún archivo seleccionado</strong>
                <span>No se realiza una carga real.</span>
              </>
            )}
            <Button
              onClick={() => {
                setFileName(
                  `${document.id}_v${document.versions.length + 1}_DEMO.pdf`,
                )
                setError("")
              }}
              variant="secondary"
            >
              Incorporar archivo demostrativo
            </Button>
          </div>
          {error && (
            <div className="inline-form-error">
              <Alert tone="error" title="No es posible crear la versión">
                {error}
              </Alert>
            </div>
          )}
          <div className="form-footer">
            <Button onClick={onCancel} variant="secondary">
              Cancelar
            </Button>
            <Button icon={<FilePlus2 size={17} />} onClick={review}>
              Revisar nueva versión
            </Button>
          </div>
        </Panel>
      </div>

      <Dialog
        footer={
          <>
            <Button onClick={() => setConfirmOpen(false)} variant="secondary">
              Volver
            </Button>
            <Button
              icon={<FilePlus2 size={17} />}
              onClick={() => onConfirm(fileName, values)}
            >
              Crear {nextVersion}
            </Button>
          </>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Confirmar nueva versión"
      >
        <div className="confirmation-copy">
          <p>
            Se creará <strong>{nextVersion}</strong> enlazada a{" "}
            <strong>{version.id}</strong>.
          </p>
          <p>
            La nueva versión requerirá revisión y no marcará automáticamente las
            observaciones como conformes.
          </p>
        </div>
      </Dialog>
    </>
  )
}
