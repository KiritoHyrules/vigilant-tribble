import { ArrowLeft, FileQuestion, History, Wrench } from "lucide-react"
import type { InterventionRecord } from "../data/interventions"
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Heading,
  Panel,
  PanelHeader,
} from "../components/system"
import { interventionTone } from "./InterventionList"

export function InterventionDetail({
  record,
  notice,
  onBack,
  onRegisterAction,
}: {
  record: InterventionRecord
  notice?: string
  onBack: () => void
  onRegisterAction: () => void
}) {
  return (
    <>
      <Breadcrumbs items={["TRASU", "Intervenciones técnicas", record.id]} />
      <Button
        className="back-button"
        icon={<ArrowLeft size={17} />}
        onClick={onBack}
        variant="quiet"
      >
        Volver a intervenciones
      </Button>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Soporte STK-08 · registro técnico</span>
          <Heading level={1}>{record.id}</Heading>
          <p>
            Detalle demostrativo sin acceso a servidores, permisos o decisiones
            del expediente.
          </p>
        </div>
        <Badge tone={interventionTone(record.status)}>{record.status}</Badge>
      </div>
      {notice && (
        <Alert tone="success" title="Actuación técnica registrada">
          {notice}
        </Alert>
      )}
      <div className="intervention-detail-layout">
        <div className="detail-main">
          <Panel className="detail-section">
            <PanelHeader
              eyebrow="Condición reportada"
              title={record.component}
            />
            <dl className="read-grid">
              <div>
                <dt>Fecha y hora</dt>
                <dd>{record.date}</dd>
              </div>
              <div>
                <dt>Responsable técnico</dt>
                <dd>{record.responsible}</dd>
              </div>
              <div className="read-grid__wide">
                <dt>Condición</dt>
                <dd>{record.condition}</dd>
              </div>
              <div className="read-grid__wide">
                <dt>Resultado registrado</dt>
                <dd>{record.result}</dd>
              </div>
            </dl>
          </Panel>
          <Panel className="detail-section">
            <PanelHeader
              action={
                <Badge tone="neutral">
                  {record.actions.length} actuaciones
                </Badge>
              }
              description="Secuencia demostrativa; no representa una reparación institucional real."
              eyebrow="Historial técnico"
              title="Actuaciones registradas"
            />
            <div className="technical-action-list">
              {record.actions.length > 0 ? (
                record.actions.map((action) => (
                  <div key={action.id}>
                    <span className="timeline-marker">
                      <History size={15} />
                    </span>
                    <div>
                      <strong>{action.stage}</strong>
                      <p>{action.description}</p>
                      <small>
                        {action.id} · {action.registeredBy}
                      </small>
                    </div>
                    <time>{action.date}</time>
                    <Badge tone={interventionTone(action.result)}>
                      {action.result}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="technical-empty">
                  <FileQuestion size={22} />
                  <span>No existen actuaciones técnicas registradas.</span>
                </div>
              )}
            </div>
          </Panel>
        </div>
        <aside className="detail-side">
          <Panel className="detail-section">
            <PanelHeader eyebrow="Acción autorizada" title="Registro técnico" />
            <div className="form-body">
              <Alert title="Modo demostrativo">
                Registrar una actuación no ejecuta reinicios, desbloqueos ni
                accesos a infraestructura.
              </Alert>
              <Button note="Abre un formulario de registro. No reinicia servicios ni modifica infraestructura." icon={<Wrench size={16} />} onClick={onRegisterAction}>
                Registrar actuación técnica
              </Button>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  )
}
