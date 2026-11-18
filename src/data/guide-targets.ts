import type { ScreenId } from "./help-context"

// Only points to existing UI. Locating a target must never activate it.
export const guideTargets: Partial<Record<ScreenId, { selector: string; label: string; hint: string }>> = {
  pending: { selector: '[data-guide="open-record"]', label: "Ver expediente", hint: "Elige la fila que necesitas y abre su expediente." },
  locate: { selector: '.locator-filters input', label: "Buscar expediente", hint: "Prepara un criterio y consulta los resultados." },
  detail: { selector: '[data-guide="record-context"]', label: "Resumen del expediente", hint: "Comprueba referencia y responsable antes de elegir una acción." },
  documents: { selector: '[data-guide="document-versions"] .document-row', label: "Versiones disponibles", hint: "Selecciona una versión y comprueba su identidad en el inspector." },
  request: { selector: 'textarea', label: "Motivo de la solicitud", hint: "Escribe el motivo. Enviar registra la petición, no cambia al responsable." },
  assign: { selector: '.form-body select', label: "Responsable habilitado", hint: "Elige al responsable y revisa la propuesta antes de confirmar." },
  evaluation: { selector: '.decision-panel select', label: "Decisión de responsabilidad", hint: "Para aprobar elige responsable; para rechazar, justifica la decisión." },
  reviewWorkspace: { selector: 'textarea', label: "Fundamentación de observaciones", hint: "Contrasta la versión exacta y prepara el resultado de tu revisión." },
  subsanate: { selector: 'textarea', label: "Atención de observaciones", hint: "Documenta la atención de cada observación sin sobrescribir la versión anterior." },
  registerExchange: { selector: '.exchange-form-grid select', label: "Datos de la salida", hint: "Prepara la salida local y comprueba su destino antes de confirmar." },
  treatExchange: { selector: 'textarea', label: "Tratamiento del intercambio", hint: "Describe el nuevo intento; el historial anterior se conserva." },
  specialDerivation: { selector: 'textarea', label: "Datos de la derivación", hint: "Registra el motivo y destino de la derivación interna." },
  technicalAction: { selector: 'textarea', label: "Actuación técnica", hint: "Describe lo realizado y distingue lo registrado de lo comprobado." },
}

export function targetForScreen(screen: ScreenId, guideId?: string, stepIndex?: number) {
  if (screen === "detail" && (guideId === "documentos" || (guideId === "expediente" && stepIndex === 2))) {
    return { selector: '[data-guide="open-documents"]', label: "Abrir documentos y versiones", hint: "Abre los documentos si esa es tu tarea; no necesitas recorrer todas las secciones." }
  }
  if (screen === "detail" && guideId === "expediente" && stepIndex === 3) {
    return { selector: '[data-guide="back-to-list"]', label: "Volver al listado", hint: "Regresa con el botón que identifica tu listado de origen." }
  }
  return guideTargets[screen] ?? { selector: '.page-title h1', label: "Contexto de esta pantalla", hint: "Comprueba la identidad y el estado antes de continuar." }
}
