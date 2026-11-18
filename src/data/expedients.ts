export type OperationalStatus = "Pendiente de atención" | "En revisión" | "Con observaciones"

export type Expedient = {
  reference: string
  action: string
  type: string
  responsibility: string
  responsible: string | null
  updated: string
  status: OperationalStatus
  context: string
  assignments: {
    label: string
    responsible: string
    date: string
  }[]
  versions: {
    id: string
    status: string
    date: string
  }[]
  evidence: string[]
}

export const expedients: Expedient[] = [
  {
    reference: "DEMO-TRASU-001",
    action: "Revisar documentación disponible",
    type: "Revisión documental",
    responsibility: "Asignación individual · DEMO-014",
    responsible: "Usuario DEMO-014",
    updated: "18/06/2025 · 10:42",
    status: "Pendiente de atención",
    context:
      "Expediente incorporado al circuito interno TRASU para seguimiento demostrativo. No corresponde al registro de un reclamo ante una operadora.",
    assignments: [
      {
        label: "Responsabilidad vigente",
        responsible: "Usuario DEMO-014",
        date: "17/06/2025 · 15:20",
      },
      {
        label: "Registro anterior",
        responsible: "Usuario DEMO-021",
        date: "16/06/2025 · 09:10",
      },
    ],
    versions: [
      {
        id: "V-DEMO-001-02",
        status: "Disponible para consulta interna",
        date: "18/06/2025",
      },
      {
        id: "V-DEMO-001-01",
        status: "Versión anterior",
        date: "16/06/2025",
      },
    ],
    evidence: [
      "Un registro de evidencia incorporada para consulta interna.",
      "Sin confirmaciones externas representadas en esta demostración.",
    ],
  },
  {
    reference: "DEMO-TRASU-002",
    action: "Dar seguimiento a actuación asignada",
    type: "Seguimiento",
    responsibility: "Asignación individual · DEMO-021",
    responsible: "Usuario DEMO-021",
    updated: "18/06/2025 · 09:15",
    status: "En revisión",
    context:
      "Registro operativo ficticio disponible para seguimiento dentro del circuito interno TRASU.",
    assignments: [
      {
        label: "Reasignación aprobada · SOL-DEMO-002",
        responsible: "Usuario DEMO-021",
        date: "17/06/2025 · 16:05 · Supervisor DEMO-001",
      },
      {
        label: "Registro anterior",
        responsible: "Usuario DEMO-014",
        date: "17/06/2025 · 15:40",
      },
    ],
    versions: [
      {
        id: "V-DEMO-002-01",
        status: "Disponible para consulta interna",
        date: "17/06/2025",
      },
    ],
    evidence: [
      "No se registran intercambios externos en los datos de ejemplo.",
    ],
  },
  {
    reference: "DEMO-TRASU-003",
    action: "Revisar observaciones registradas",
    type: "Observaciones",
    responsibility: "Asignación individual · DEMO-014",
    responsible: "Usuario DEMO-014",
    updated: "17/06/2025 · 16:28",
    status: "Con observaciones",
    context:
      "Expediente ficticio con observaciones operacionales disponibles para consulta.",
    assignments: [
      {
        label: "Responsabilidad vigente",
        responsible: "Usuario DEMO-014",
        date: "17/06/2025 · 12:05",
      },
    ],
    versions: [
      {
        id: "V-DEMO-003-03",
        status: "Con observaciones internas",
        date: "17/06/2025",
      },
      {
        id: "V-DEMO-003-02",
        status: "Versión anterior",
        date: "15/06/2025",
      },
    ],
    evidence: [
      "Dos referencias de evidencia listadas sin validación externa simulada.",
    ],
  },
  {
    reference: "DEMO-TRASU-004",
    action: "Revisar versión documental",
    type: "Revisión documental",
    responsibility: "Asignación individual · DEMO-014",
    responsible: "Usuario DEMO-014",
    updated: "17/06/2025 · 14:06",
    status: "En revisión",
    context:
      "Registro demostrativo con versiones documentales disponibles para lectura.",
    assignments: [
      {
        label: "Responsabilidad vigente",
        responsible: "Usuario DEMO-014",
        date: "17/06/2025 · 10:40",
      },
    ],
    versions: [
      {
        id: "V-DEMO-004-02",
        status: "En revisión interna",
        date: "17/06/2025",
      },
      {
        id: "V-DEMO-004-01",
        status: "Versión anterior",
        date: "14/06/2025",
      },
    ],
    evidence: ["Sin intercambios externos en esta muestra."],
  },
  {
    reference: "DEMO-TRASU-005",
    action: "Consultar evidencia incorporada",
    type: "Seguimiento",
    responsibility: "Asignación individual · DEMO-014",
    responsible: "Usuario DEMO-014",
    updated: "16/06/2025 · 11:37",
    status: "Pendiente de atención",
    context:
      "Expediente ficticio con evidencia incorporada al contexto operativo interno.",
    assignments: [
      {
        label: "Responsabilidad vigente",
        responsible: "Usuario DEMO-014",
        date: "16/06/2025 · 10:55",
      },
    ],
    versions: [
      {
        id: "V-DEMO-005-01",
        status: "Disponible para consulta interna",
        date: "16/06/2025",
      },
    ],
    evidence: [
      "Un elemento de evidencia disponible para consulta.",
      "La recepción o confirmación externa no está representada.",
    ],
  },
  {
    reference: "DEMO-TRASU-006",
    action: "Pendiente de asignación inicial",
    type: "Seguimiento",
    responsibility: "Por asignar",
    responsible: null,
    updated: "16/06/2025 · 08:25",
    status: "Pendiente de atención",
    context:
      "Expediente ficticio incorporado al circuito interno y todavía sin responsable asignado.",
    assignments: [],
    versions: [
      {
        id: "V-DEMO-006-01",
        status: "Disponible para consulta interna",
        date: "16/06/2025",
      },
    ],
    evidence: ["Sin intercambios externos en esta muestra."],
  },
]
