export type EvidenceAvailability = "Disponible" | "No disponible"

export type TraceRecord = {
  id: string
  date: string
  action: string
  actionType: string
  expedientReference: string
  actor: string
  source: string
  evidenceAvailability: EvidenceAvailability
  evidenceReference?: string
  documentId?: string
  versionId?: string
  description: string
}

export const initialTraces: TraceRecord[] = [
  {
    id: "TRAZA-DEMO-001",
    date: "18/06/2025 · 09:30",
    action: "Registro de versión documental",
    actionType: "Documento",
    expedientReference: "DEMO-TRASU-001",
    actor: "Usuario DEMO-014 · STK-02",
    source: "Ciclo documental interno",
    evidenceAvailability: "Disponible",
    evidenceReference: "DOC-021_v1_DEMO.pdf",
    documentId: "DOC-021",
    versionId: "DOC-021 · v1",
    description:
      "Registro demostrativo de una versión documental exacta incorporada al expediente.",
  },
  {
    id: "TRAZA-DEMO-002",
    date: "18/06/2025 · 08:45",
    action: "Confirmación reportada de intercambio",
    actionType: "Intercambio",
    expedientReference: "DEMO-TRASU-001",
    actor: "Personal documentario DEMO-006 · STK-06",
    source: "INT-DEMO-001",
    evidenceAvailability: "Disponible",
    evidenceReference: "CONST-DEMO-001.pdf",
    description:
      "Confirmación ficticia sustentada por la constancia demostrativa asociada.",
  },
  {
    id: "TRAZA-DEMO-003",
    date: "18/06/2025 · 11:05",
    action: "Solicitud de reasignación registrada",
    actionType: "Responsabilidad",
    expedientReference: "DEMO-TRASU-003",
    actor: "Usuario DEMO-014 · STK-02",
    source: "SOL-DEMO-001",
    evidenceAvailability: "No disponible",
    description:
      "La fuente registra la actuación, pero no existe un archivo de evidencia asociado.",
  },
  {
    id: "TRAZA-DEMO-004",
    date: "17/06/2025 · 16:35",
    action: "Intento de intercambio fallido",
    actionType: "Intercambio",
    expedientReference: "DEMO-TRASU-004",
    actor: "Personal documentario DEMO-006 · STK-06",
    source: "INTENTO-DEMO-003-02",
    evidenceAvailability: "No disponible",
    description:
      "Intento técnico ficticio sin constancia suficiente para afirmar entrega externa.",
  },
  {
    id: "TRAZA-DEMO-005",
    date: "17/06/2025 · 15:20",
    action: "Asignación de responsabilidad registrada",
    actionType: "Responsabilidad",
    expedientReference: "DEMO-TRASU-001",
    actor: "Supervisor DEMO-001 · STK-01",
    source: "Historial de responsabilidad",
    evidenceAvailability: "Disponible",
    evidenceReference: "REG-ASG-DEMO-001",
    description: "Registro interno demostrativo de la responsabilidad vigente.",
  },
]
