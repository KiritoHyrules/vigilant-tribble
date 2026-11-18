export type InterventionStatus = "Intervención registrada" | "Verificación pendiente" | "Recuperación parcial" | "Recuperación comprobada" | "Resultado desconocido"

export type TechnicalAction = {
  id: string
  date: string
  stage: string
  description: string
  result: InterventionStatus
  evidence?: string
  registeredBy: string
}

export type InterventionRecord = {
  id: string
  component: string
  date: string
  condition: string
  responsible: string
  result: string
  status: InterventionStatus
  actions: TechnicalAction[]
}

export const initialInterventions: InterventionRecord[] = [
  {
    id: "TEC-DEMO-001",
    component: "Servicio de intercambio demostrativo",
    date: "18/06/2025 · 10:10",
    condition: "Respuesta intermitente reportada",
    responsible: "Soporte DEMO-008 · STK-08",
    result: "Revisión técnica registrada; verificación aún pendiente.",
    status: "Verificación pendiente",
    actions: [
      {
        id: "ACT-TEC-DEMO-001-01",
        date: "18/06/2025 · 10:10",
        stage: "Inicio de intervención",
        description: "Se registró la condición reportada para análisis local.",
        result: "Verificación pendiente",
        registeredBy: "Soporte DEMO-008 · STK-08",
      },
    ],
  },
  {
    id: "TEC-DEMO-002",
    component: "Procesamiento documental demostrativo",
    date: "17/06/2025 · 16:20",
    condition: "Procesamiento incompleto reportado",
    responsible: "Soporte DEMO-008 · STK-08",
    result:
      "Parte de la operación fue verificada; quedan comprobaciones pendientes.",
    status: "Recuperación parcial",
    actions: [
      {
        id: "ACT-TEC-DEMO-002-01",
        date: "17/06/2025 · 16:20",
        stage: "Actuación ejecutada",
        description: "Ajuste local demostrativo registrado.",
        result: "Recuperación parcial",
        registeredBy: "Soporte DEMO-008 · STK-08",
      },
    ],
  },
  {
    id: "TEC-DEMO-003",
    component: "Consulta de expedientes demostrativa",
    date: "17/06/2025 · 11:45",
    condition: "Indisponibilidad temporal reportada",
    responsible: "Soporte DEMO-008 · STK-08",
    result: "Verificación demostrativa registrada con evidencia.",
    status: "Recuperación comprobada",
    actions: [
      {
        id: "ACT-TEC-DEMO-003-01",
        date: "17/06/2025 · 12:15",
        stage: "Verificación",
        description: "Comprobación demostrativa posterior a la actuación.",
        result: "Recuperación comprobada",
        evidence: "VERIF-TEC-DEMO-003.pdf",
        registeredBy: "Soporte DEMO-008 · STK-08",
      },
    ],
  },
  {
    id: "TEC-DEMO-004",
    component: "Componente no identificado",
    date: "16/06/2025 · 14:05",
    condition: "Reporte técnico sin datos suficientes",
    responsible: "Soporte DEMO-008 · STK-08",
    result: "No fue posible establecer el resultado.",
    status: "Resultado desconocido",
    actions: [],
  },
]
