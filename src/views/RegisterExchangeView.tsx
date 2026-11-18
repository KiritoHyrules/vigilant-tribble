import { ArrowLeft, FilePlus2, Send, Upload } from "lucide-react"
import { useMemo, useState } from "react"
import type { ExpedientDocument } from "../data/documents"
import type { Expedient } from "../data/expedients"
import {
  Alert,
  Breadcrumbs,
  Button,
  Dialog,
  Heading,
  Panel,
  PanelHeader,
  SelectField,
  TextField,
} from "../components/system"

export type ExchangeDraft = {
  expedientReference: string
  relatedItem: string
  actionType: string
  channel: string
  destination: string
  date: string
  externalReference: string
  evidence?: string
}

export function RegisterExchangeView({
  records,
  documents,
  initialReference,
  onCancel,
  onConfirm,
}: {
  records: Expedient[]
  documents: ExpedientDocument[]
  initialReference?: string
  onCancel: () => void
  onConfirm: (draft: ExchangeDraft) => void
}) {
  const [expedientReference, setExpedientReference] = useState(
    initialReference ?? "",
  )
  const [relatedItem, setRelatedItem] = useState("")
  const [actionType, setActionType] = useState("")
  const [channel, setChannel] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("18/06/2025 · 15:00")
  const [externalReference, setExternalReference] = useState("")
  const [evidence, setEvidence] = useState("")
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const relatedOptions = useMemo(
    () =>
      documents
        .filter(
          (document) => document.expedientReference === expedientReference,
        )
        .flatMap((document) =>
          document.versions.map((version) => ({
            value: version.id,
            label: `${document.id} · ${version.id}`,
          })),
        ),
    [documents, expedientReference],
  )

  const review = () => {
    if (
      !expedientReference ||
      !relatedItem ||
      !actionType ||
      !channel ||
      !destination ||
      !date ||
      !externalReference
    ) {
      setError("Completa todos los datos obligatorios antes de continuar.")
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
          initialReference ?? "Intercambios registrados",
          "Registrar salida",
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
          <span className="eyebrow">STK-06 habilitado · registro local</span>
          <Heading level={1}>Registrar salida o intercambio</Heading>
          <p>
            Registra la salida interna. Esta acción no demuestra recepción ni
            éxito de un sistema externo.
          </p>
        </div>
      </div>
      <div className="form-layout">
        <Panel className="form-panel">
          <PanelHeader
            description="Todos los valores son ficticios y se conservan solo durante esta sesión."
            eyebrow="Información obligatoria"
            title="Datos de la salida"
          />
          <div className="form-body exchange-form-grid">
            <SelectField
              label="Expediente asociado"
              onChange={(event) => {
                setExpedientReference(event.target.value)
                setRelatedItem("")
                setError("")
              }}
              options={[
                { value: "", label: "Seleccionar expediente" },
                ...records.map((record) => ({
                  value: record.reference,
                  label: record.reference,
                })),
              ]}
              value={expedientReference}
            />
            <SelectField
              label="Actuación o documento"
              onChange={(event) => {
                setRelatedItem(event.target.value)
                setError("")
              }}
              options={[
                { value: "", label: "Seleccionar elemento" },
                ...relatedOptions,
                {
                  value: `Actuación ${expedientReference || "demostrativa"}`,
                  label: "Actuación operativa del expediente",
                },
              ]}
              value={relatedItem}
            />
            <TextField
              label="Tipo de actuación"
              onChange={(event) => setActionType(event.target.value)}
              placeholder="Ejemplo: Salida documental demostrativa"
              value={actionType}
            />
            <SelectField
              label="Canal conocido"
              onChange={(event) => setChannel(event.target.value)}
              options={[
                { value: "", label: "Seleccionar canal" },
                {
                  value: "Canal externo DEMO-A",
                  label: "Canal externo DEMO-A",
                },
                {
                  value: "Canal externo DEMO-B",
                  label: "Canal externo DEMO-B",
                },
              ]}
              value={channel}
            />
            <TextField
              label="Destino externo conocido"
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Destino externo DEMO"
              value={destination}
            />
            <TextField
              label="Fecha y hora registradas"
              onChange={(event) => setDate(event.target.value)}
              value={date}
            />
            <TextField
              label="Referencia del intercambio"
              onChange={(event) => setExternalReference(event.target.value)}
              placeholder="REF-EXT-DEMO"
              value={externalReference}
            />
            <div className="demo-file-field">
              <span>Evidencia demostrativa opcional</span>
              <strong>{evidence || "Sin archivo seleccionado"}</strong>
              <Button
                icon={<Upload size={15} />}
                onClick={() => setEvidence("CONST-SALIDA-DEMO.pdf")}
                variant="secondary"
              >
                Incorporar evidencia
              </Button>
            </div>
            {error && (
              <div className="form-grid-wide">
                <Alert tone="error" title="Faltan datos obligatorios">
                  {error}
                </Alert>
              </div>
            )}
          </div>
          <div className="form-footer">
            <Button onClick={onCancel} variant="secondary">
              Cancelar
            </Button>
            <Button icon={<FilePlus2 size={16} />} onClick={review}>
              Revisar registro
            </Button>
          </div>
        </Panel>
        <Panel className="form-context">
          <PanelHeader eyebrow="Alcance" title="Resultado del registro" />
          <div className="form-body">
            <Alert title="No equivale a confirmación externa">
              El nuevo intercambio iniciará en estado «Registrado». Cualquier
              resultado posterior requiere evidencia separada.
            </Alert>
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
              icon={<Send size={16} />}
              onClick={() =>
                onConfirm({
                  expedientReference,
                  relatedItem,
                  actionType,
                  channel,
                  destination,
                  date,
                  externalReference,
                  evidence: evidence || undefined,
                })
              }
            >
              Confirmar registro interno
            </Button>
          </>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Confirmar registro de salida"
      >
        <div className="confirmation-copy">
          <p>
            Se registrará una salida asociada a{" "}
            <strong>{expedientReference}</strong>.
          </p>
          <p>
            No se ejecutará una llamada ni se afirmará confirmación externa.
          </p>
        </div>
      </Dialog>
    </>
  )
}
