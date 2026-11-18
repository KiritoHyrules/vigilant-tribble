import type { ScreenId } from "./help-context"
import { screenHelp } from "./help-context"

export type ScreenStop = { id: string; selector: string; title: string; text: string }
const stop = (id: string, selector: string, title: string, text: string): ScreenStop => ({ id, selector, title, text })
const context = (screen: ScreenId) => stop("context", "h1", screenHelp[screen].title, screenHelp[screen].purpose)
const back = (screen: ScreenId) => stop("return", ".back-button", "Volver sin perder el contexto", screenHelp[screen].exit)
const results = stop("results", ".table-wrap", "Consulta la fila antes de abrirla", "Comprueba la referencia y el estado. Abrir un detalle no modifica el registro.")
const form = (screen: ScreenId) => [
  context(screen),
  stop("prepare", ".form-body, .attention-list", "Prepara los datos", screenHelp[screen].next),
  stop("review", ".form-footer", "Revisa antes de registrar", "Este es el cierre del formulario. Comprueba los datos y el alcance de la acción; la guía no pulsa ni confirma por ti."),
  back(screen),
]

// Exhaustive screen coverage. At runtime only stops with visible, available targets are offered.
export const screenTours: Record<ScreenId, ScreenStop[]> = {
  pending: [
    stop("open", '[data-guide="open-record"]', "¿Para qué sirve Ver expediente?", "Abre el detalle de esa fila: responsable, situación y documentos. Solo consultas; no atiende el pendiente ni cambia datos."),
    stop("filters", ".filters", "Encuentra la actuación que necesitas", "Busca o filtra antes de abrir una fila. Restablecer recupera los criterios iniciales, no borra expedientes."),
    results,
  ],
  locate: [context("locate"), stop("criteria", ".locator-filters", "Prepara y ejecuta la búsqueda", "Escribe la referencia y pulsa Buscar. Si no aparece, ajusta los criterios o limpia los filtros."), results],
  detail: [
    stop("summary", '[data-guide="record-context"]', "Ya estás dentro del expediente", "Comprueba la referencia, el responsable y la situación. Haber abierto el expediente no modifica sus datos."),
    stop("documents", '[data-guide="open-documents"]', "Documentos y versiones", "Este botón abre los archivos y sus versiones. Allí puedes consultar la versión exacta y las acciones habilitadas para tu perfil."),
    stop("tracking", ".tracking-section", "Seguimiento y antecedentes", "Selecciona un evento para consultar su fecha, actor y origen. Las fechas registradas no son plazos calculados."),
    stop("responsibility", ".responsibility-action", "Gestión de responsabilidad", "Aquí se muestra la acción permitida por tu perfil y por la situación del expediente. Una solicitud pendiente no es un cambio de responsable."),
    back("detail"),
  ],
  assign: form("assign"),
  request: [context("request"), stop("reason", "textarea", "Explica el motivo", "Escribe el sustento de la petición. Aquí no eliges un nuevo responsable."), stop("send", ".form-footer", "Enviar registra la solicitud", "Enviar solicitud la registra de inmediato, sin otro diálogo. El responsable no cambia hasta la decisión del Supervisor."), back("request")],
  requests: [context("requests"), stop("filters", ".filters", "Localiza la solicitud", "Combina expediente o solicitud con su situación. Una pendiente permite evaluar; una resuelta se consulta."), results],
  evaluation: [context("evaluation"), stop("decision", ".decision-panel", "Decide con el contexto completo", "Aprobar exige nuevo responsable; rechazar exige justificación. Ambas decisiones se revisan en un diálogo antes de confirmar."), back("evaluation")],
  documents: [context("documents"), stop("versions", ".document-row", "Selecciona la versión exacta", "Cada fila representa una versión. Seleccionarla cambia el inspector, no crea otra versión ni modifica su estado."), stop("inspector", ".version-inspector", "Identidad, estado y opciones", "Comprueba archivo, versión y estado antes de usar una acción habilitada. Si hay observaciones, consulta su contenido antes de subsanar."), back("documents")],
  submitReview: [context("submitReview"), stop("identity", ".review-identity", "Confirma la identidad de la versión", "Comprueba documento, archivo y estado. No se envía el documento completo ni otra versión."), stop("review", ".form-footer", "Preparar no es confirmar", "Revisar y confirmar envío abre el diálogo. Solo la confirmación final crea la revisión interna."), back("submitReview")],
  reviews: [context("reviews"), stop("filters", ".filters", "Localiza la revisión asignada", "Busca expediente, documento o versión. El resultado corresponde a esa versión exacta."), results],
  reviewWorkspace: [context("reviewWorkspace"), stop("read", ".simulated-viewer", "Consulta la versión asignada", "El visor es simulado. Contrasta su identidad antes de preparar observaciones o conformidad interna."), stop("decision", ".review-result-panel", "Prepara el resultado", "Fundamenta las observaciones o propone conformidad interna. Comprueba el diálogo antes de confirmar; la guía no registra resultados."), back("reviewWorkspace")],
  subsanate: [context("subsanate"), stop("chain", ".subsanation-chain", "Conserva la cadena de versiones", "La versión observada no se sobrescribe. La nueva quedará enlazada a su antecedente."), stop("attention", ".attention-list", "Atiende cada observación", "Indica tipo de atención y descripción para cada observación."), stop("file", ".upload-box", "Prepara el archivo de ejemplo", "Incorpora el archivo demostrativo y revisa la nueva versión antes de confirmar. No se carga un archivo real."), back("subsanate")],
  exchanges: [context("exchanges"), stop("filters", ".exchange-filters", "Localiza el intercambio", "Contrasta referencia y estado. Registrado no significa entregado ni confirmado externamente."), results],
  exchangeDetail: [context("exchangeDetail"), stop("attempts", ".attempts-panel", "Comprueba los intentos", "El historial distingue cada intento y su resultado. No conviertas un resultado desconocido en una entrega confirmada."), stop("actions", ".exchange-actions-panel", "Acciones disponibles", "El tratamiento depende del perfil y del estado. Registrar un tratamiento añade un antecedente, no realiza una llamada externa."), back("exchangeDetail")],
  registerExchange: form("registerExchange"),
  treatExchange: form("treatExchange"),
  specialDerivation: form("specialDerivation"),
  evidence: [context("evidence"), stop("filters", ".evidence-filters", "Filtra la evidencia disponible", "Combina expediente, fecha, actor y disponibilidad. La ausencia de evidencia se mantiene explícita."), results],
  evidenceDetail: [context("evidenceDetail"), stop("record", ".read-grid", "Contrasta la actuación", "Comprueba fecha, actor, origen y versión. La referencia es demostrativa, no certifica integridad ni validez oficial."), stop("evidence", ".evidence-file-card", "Comprueba si existe evidencia", "Si no está disponible, conserva esa ausencia. Consultar el expediente no habilita permisos adicionales."), back("evidenceDetail")],
  interventions: [context("interventions"), stop("filters", ".filters", "Localiza el antecedente técnico", "Busca por intervención o componente y contrasta el estado antes de abrir el detalle."), results],
  interventionDetail: [context("interventionDetail"), stop("history", ".technical-action-list", "Revisa las actuaciones previas", "Distingue lo descrito, el resultado registrado y la evidencia disponible. Consultar no inicia una reparación."), stop("prepare", ".detail-side .form-body", "Preparar otra actuación", "Registrar actuación técnica abre un formulario local; no reinicia servicios ni modifica infraestructura."), back("interventionDetail")],
  technicalAction: form("technicalAction"),
}
