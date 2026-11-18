export type VersionStatus = "Apta para envío" | "En revisión interna" | "Observada" | "Conformidad interna" | "Nueva versión · requiere revisión"

export type VersionObservation = {
  id: string
  text: string
}

export type VersionAttention = {
  observationId: string
  status: string
  note: string
}

export type DocumentVersion = {
  id: string
  number: number
  author: string
  createdAt: string
  fileName: string
  status: VersionStatus
  previousVersionId?: string
  observations: VersionObservation[]
  attention?: VersionAttention[]
}

export type ExpedientDocument = {
  id: string
  expedientReference: string
  name: string
  type: string
  versions: DocumentVersion[]
}

export type ReviewStatus = "Pendiente de revisión" | "Observada" | "Conformidad interna"

export type ReviewTask = {
  id: string
  expedientReference: string
  documentId: string
  versionId: string
  assignedTo: string
  receivedAt: string
  status: ReviewStatus
  resultNote?: string
  observations: VersionObservation[]
}

export const initialDocuments: ExpedientDocument[] = [
  {
    id: "DOC-021",
    expedientReference: "DEMO-TRASU-001",
    name: "Informe de análisis demostrativo",
    type: "Documento de trabajo interno",
    versions: [
      {
        id: "DOC-021 · v1",
        number: 1,
        author: "Usuario DEMO-014 · STK-02",
        createdAt: "18/06/2025 · 09:30",
        fileName: "DOC-021_v1_DEMO.pdf",
        status: "Apta para envío",
        observations: [],
      },
    ],
  },
  {
    id: "DOC-034",
    expedientReference: "DEMO-TRASU-003",
    name: "Resumen de antecedentes demostrativo",
    type: "Documento de soporte interno",
    versions: [
      {
        id: "DOC-034 · v1",
        number: 1,
        author: "Usuario DEMO-014 · STK-02",
        createdAt: "17/06/2025 · 13:10",
        fileName: "DOC-034_v1_DEMO.pdf",
        status: "Conformidad interna",
        observations: [],
      },
    ],
  },
]

export const initialReviewTasks: ReviewTask[] = []
