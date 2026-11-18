import type { Actor, NavigationId } from "../types/navigation"

import { guides } from "./task-guides"
export { guides, type Guide } from "./task-guides"

export const roles: Record<Actor, { name: string; code: string; username: string; purpose: string }> = {
  analyst: { name: "Analista", code: "STK-02", username: "demo.analista", purpose: "Consulta tus pendientes y prepara las versiones documentales que requieren revisión." },
  supervisor: { name: "Supervisor", code: "STK-01", username: "demo.supervisor", purpose: "Revisa la responsabilidad de los expedientes y evalúa las solicitudes de reasignación." },
  reviewer: { name: "Revisor", code: "STK-03", username: "demo.revisor", purpose: "Revisa la versión documental exacta y registra conformidad interna u observaciones." },
  vocal: { name: "Vocal", code: "STK-04", username: "demo.vocal", purpose: "Reconoce el espacio de revisión. Las actuaciones de este perfil están condicionadas en el prototipo." },
  exchange: { name: "Personal documentario", code: "STK-06", username: "demo.documentario", purpose: "Registra salidas e intercambios sin confundir el registro interno con una confirmación externa." },
  support: { name: "Soporte", code: "STK-08", username: "demo.soporte", purpose: "Consulta intervenciones y documenta acciones técnicas, sus resultados y la evidencia disponible." },
  auditor: { name: "Auditor", code: "STK-09", username: "demo.auditor", purpose: "Consulta la secuencia de actuaciones y verifica la disponibilidad de su evidencia." },
}

export const demoPassword = "trasu-demo"

export const viewHelp: Record<NavigationId, { title: string; text: string }> = {
  pending: { title: "Prioriza antes de abrir", text: "Utiliza búsqueda, estado y orden para ubicar tu trabajo. Abre un expediente antes de realizar acciones o revisar sus documentos." },
  locate: { title: "Busca con un criterio concreto", text: "Empieza por la referencia. Si no encuentras resultados, revisa los filtros. La consulta no cambia la responsabilidad del expediente." },
  requests: { title: "Evalúa sin perder el antecedente", text: "Una solicitud pendiente no modifica al responsable. Comprueba el motivo y justifica cualquier decisión." },
  reviews: { title: "Revisa la versión correcta", text: "El resultado se vincula a una versión documental exacta. Una conformidad interna no representa una aprobación externa." },
  exchanges: { title: "Registro no es confirmación", text: "Distingue la salida registrada de la recepción externa. Conserva los intentos anteriores ante fallos o resultados desconocidos." },
  evidence: { title: "Contrasta la secuencia", text: "Revisa actor, fecha, origen y evidencia. La ausencia de evidencia debe mantenerse explícita." },
  interventions: { title: "Documenta lo comprobable", text: "Conserva el historial y aporta evidencia cuando declares una recuperación comprobada. El prototipo no ejecuta reparaciones reales." },
}

export function guidesForRole(actor: Actor) {
  return guides.filter((guide) => guide.roles.includes(actor))
}
