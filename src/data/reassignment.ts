export type RequestStatus = "Pendiente de evaluación" | "Aprobada" | "Rechazada"

export type ReassignmentRequest = {
  id: string
  expedientReference: string
  requester: string
  currentResponsible: string
  date: string
  reason: string
  status: RequestStatus
  resolutionJustification?: string
  newResponsible?: string
}

export const initialRequests: ReassignmentRequest[] = [
  {
    id: "SOL-DEMO-001",
    expedientReference: "DEMO-TRASU-003",
    requester: "Usuario DEMO-014 · STK-02",
    currentResponsible: "Usuario DEMO-014",
    date: "18/06/2025 · 11:05",
    reason:
      "Solicitud demostrativa por necesidad de redistribuir el seguimiento operativo.",
    status: "Pendiente de evaluación",
  },
  {
    id: "SOL-DEMO-002",
    expedientReference: "DEMO-TRASU-002",
    requester: "Usuario DEMO-014 · STK-02",
    currentResponsible: "Usuario DEMO-014",
    date: "17/06/2025 · 15:40",
    reason: "Solicitud demostrativa previamente evaluada.",
    status: "Aprobada",
    resolutionJustification: "Cambio confirmado en la demostración.",
    newResponsible: "Usuario DEMO-021",
  },
  {
    id: "SOL-DEMO-003",
    expedientReference: "DEMO-TRASU-004",
    requester: "Usuario DEMO-014 · STK-02",
    currentResponsible: "Usuario DEMO-014",
    date: "16/06/2025 · 13:20",
    reason: "Solicitud demostrativa previamente evaluada.",
    status: "Rechazada",
    resolutionJustification:
      "Se conserva la responsabilidad vigente en esta demostración.",
  },
]
