export type ExchangeStatus = "Registrado" | "Pendiente de confirmación" | "Fallido" | "Confirmado" | "Resultado desconocido"

export type ExchangeAttempt = {
  id: string
  date: string
  result: ExchangeStatus
  message: string
  technicalReference?: string
}

export type ExchangeRecord = {
  id: string
  expedientReference: string
  actionType: string
  relatedItem: string
  channel: string
  destination: string
  registeredAt: string
  externalReference: string
  evidence?: string
  status: ExchangeStatus
  attempts: ExchangeAttempt[]
}

export type SpecialDerivation = {
  id: string
  expedientReference: string
  reason: string
  destination: string
  relatedAction: string
  evidence: string
  registeredAt: string
  registeredBy: string
}

export const initialExchanges: ExchangeRecord[] = [
  {
    id: "INT-DEMO-001",
    expedientReference: "DEMO-TRASU-001",
    actionType: "Salida documental demostrativa",
    relatedItem: "DOC-021 · v1",
    channel: "Canal externo DEMO-A",
    destination: "Destino externo DEMO-01",
    registeredAt: "18/06/2025 · 08:45",
    externalReference: "REF-EXT-DEMO-001",
    evidence: "CONST-DEMO-001.pdf",
    status: "Confirmado",
    attempts: [
      {
        id: "INTENTO-DEMO-001-01",
        date: "18/06/2025 · 08:45",
        result: "Confirmado",
        message: "Confirmación ficticia sustentada por CONST-DEMO-001.",
        technicalReference: "CONF-DEMO-001",
      },
    ],
  },
  {
    id: "INT-DEMO-002",
    expedientReference: "DEMO-TRASU-003",
    actionType: "Remisión de antecedente demostrativo",
    relatedItem: "DOC-034 · v1",
    channel: "Canal externo DEMO-B",
    destination: "Destino externo DEMO-02",
    registeredAt: "18/06/2025 · 09:20",
    externalReference: "REF-EXT-DEMO-002",
    status: "Pendiente de confirmación",
    attempts: [
      {
        id: "INTENTO-DEMO-002-01",
        date: "18/06/2025 · 09:20",
        result: "Pendiente de confirmación",
        message:
          "Salida registrada; no existe confirmación externa disponible.",
      },
    ],
  },
  {
    id: "INT-DEMO-003",
    expedientReference: "DEMO-TRASU-004",
    actionType: "Salida de actuación demostrativa",
    relatedItem: "Actuación operativa DEMO-04",
    channel: "Canal externo DEMO-A",
    destination: "Destino externo DEMO-03",
    registeredAt: "17/06/2025 · 16:10",
    externalReference: "REF-EXT-DEMO-003",
    status: "Fallido",
    attempts: [
      {
        id: "INTENTO-DEMO-003-01",
        date: "17/06/2025 · 16:10",
        result: "Fallido",
        message: "Error técnico ficticio reportado por el canal.",
        technicalReference: "ERR-DEMO-503-A",
      },
      {
        id: "INTENTO-DEMO-003-02",
        date: "17/06/2025 · 16:35",
        result: "Fallido",
        message: "Segundo intento local registrado sin entrega confirmada.",
        technicalReference: "ERR-DEMO-503-B",
      },
    ],
  },
  {
    id: "INT-DEMO-004",
    expedientReference: "DEMO-TRASU-005",
    actionType: "Intercambio de evidencia demostrativa",
    relatedItem: "Evidencia DEMO-05",
    channel: "Canal externo DEMO-C",
    destination: "Destino externo DEMO-04",
    registeredAt: "17/06/2025 · 11:40",
    externalReference: "REF-EXT-DEMO-004",
    status: "Resultado desconocido",
    attempts: [
      {
        id: "INTENTO-DEMO-004-01",
        date: "17/06/2025 · 11:40",
        result: "Resultado desconocido",
        message: "No existe información suficiente para afirmar un resultado.",
      },
    ],
  },
]
