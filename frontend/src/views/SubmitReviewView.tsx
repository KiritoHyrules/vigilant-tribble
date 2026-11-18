import { ArrowLeft, Send } from "lucide-react"
import { useState } from "react"
import type { DocumentVersion, ExpedientDocument } from "../data/documents"
import {
  Alert,
  Breadcrumbs,
  Button,
  Dialog,
  Heading,
  Panel,
  PanelHeader,
} from "../components/system"

export function SubmitReviewView({
  document,
  version,
  onCancel,
  onConfirm,
}: {
  document: ExpedientDocument
  version: DocumentVersion
  onCancel: () => void
  onConfirm: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const eligible =
    version.status === "Apta para envío" ||
    version.status === "Nueva versión · requiere revisión"

  return (
    <>
      <Breadcrumbs
        items={[
          "TRASU",
          document.expedientReference,
          "Documentos y versiones",
          version.id,
          "Someter a revisión",
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
          <span className="eyebrow">Analista STK-02 · revisión interna</span>
          <Heading level={1}>Someter versión a revisión</Heading>
          <p>
            Comprueba la identidad exacta antes de incorporarla al circuito
            interno de revisión.
          </p>
        </div>
      </div>
      <div className="form-layout">
        <Panel className="form-panel">
          <PanelHeader
            description="El envío no implica conformidad interna ni una decisión legal."
            eyebrow="Versión seleccionada"
            title={version.id}
          />
          <div className="review-identity">
            <div>
              <span>Documento</span>
              <strong>
                {document.id} · {document.name}
              </strong>
            </div>
            <div>
              <span>Archivo demostrativo</span>
              <strong>{version.fileName}</strong>
            </div>
            <div>
              <span>Autor</span>
              <strong>{version.author}</strong>
            </div>
            <div>
              <span>Situación actual</span>
              <strong>{version.status}</strong>
            </div>
          </div>
          <div className="form-body">
            {eligible ? (
              <Alert title="Asignación de revisión condicionada">
                Para este prototipo, la versión se asignará a Revisor DEMO-003 ·
                STK-03. No se presenta un selector libre de destinatarios.
              </Alert>
            ) : (
              <Alert tone="error" title="Versión no apta para envío">
                La situación actual no permite crear otra solicitud de revisión.
              </Alert>
            )}
          </div>
          <div className="form-footer">
            <Button onClick={onCancel} variant="secondary">
              Cancelar
            </Button>
            <Button
              disabled={!eligible}
              icon={<Send size={17} />}
              onClick={() => setConfirmOpen(true)}
            >
              Revisar y confirmar envío
            </Button>
          </div>
        </Panel>
        <Panel className="form-context">
          <PanelHeader eyebrow="Trazabilidad" title="Qué se registrará" />
          <dl className="compact-details">
            <div>
              <dt>Expediente</dt>
              <dd>{document.expedientReference}</dd>
            </div>
            <div>
              <dt>Documento</dt>
              <dd>{document.id}</dd>
            </div>
            <div>
              <dt>Versión exacta</dt>
              <dd>{version.id}</dd>
            </div>
            <div>
              <dt>Asignación demostrativa</dt>
              <dd>Revisor DEMO-003 · STK-03</dd>
            </div>
          </dl>
        </Panel>
      </div>
      <Dialog
        footer={
          <>
            <Button onClick={() => setConfirmOpen(false)} variant="secondary">
              Volver
            </Button>
            <Button icon={<Send size={17} />} onClick={onConfirm}>
              Confirmar envío de {version.id}
            </Button>
          </>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Confirmar envío a revisión"
      >
        <div className="confirmation-copy">
          <p>
            Se creará una solicitud interna referenciada exclusivamente a{" "}
            <strong>{version.id}</strong>.
          </p>
          <p>Las versiones existentes no serán modificadas ni sobrescritas.</p>
        </div>
      </Dialog>
    </>
  )
}
