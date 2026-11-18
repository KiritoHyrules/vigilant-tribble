import { useEffect, useState } from "react"
import type { FlowId } from "./data/help-context"
import { AppShell, type Actor, type NavigationId } from "./components/AppShell"
import { Assistance } from "./components/Assistance"
import {
  initialDocuments,
  initialReviewTasks,
  type DocumentVersion,
  type ExpedientDocument,
  type ReviewTask,
} from "./data/documents"
import {
  initialExchanges,
  type ExchangeRecord,
  type SpecialDerivation,
} from "./data/exchanges"
import {
  initialInterventions,
  type InterventionRecord,
} from "./data/interventions"
import {
  expedients as initialExpedients,
  type Expedient,
} from "./data/expedients"
import { initialRequests, type ReassignmentRequest } from "./data/reassignment"
import { initialTraces, type TraceRecord } from "./data/traceability"
import { DocumentWorkspace } from "./views/DocumentWorkspace"
import { EvidenceDetail } from "./views/EvidenceDetail"
import { EvidenceList, type EvidenceFilters } from "./views/EvidenceList"
import { ExchangeDetail } from "./views/ExchangeDetail"
import { ExchangeList, type ExchangeFilters } from "./views/ExchangeList"
import {
  ExchangeTreatmentView,
  type TreatmentDraft,
} from "./views/ExchangeTreatmentView"
import { ExpedientDetail } from "./views/ExpedientDetail"
import { InitialAssignmentView } from "./views/InitialAssignmentView"
import { InterventionDetail } from "./views/InterventionDetail"
import {
  InterventionList,
  type InterventionFilters,
} from "./views/InterventionList"
import { LocateView, type LocateFilters } from "./views/LocateView"
import { PendingView, type PendingFilters } from "./views/PendingView"
import { ReassignmentEvaluation } from "./views/ReassignmentEvaluation"
import {
  ReassignmentQueue,
  type RequestFilters,
} from "./views/ReassignmentQueue"
import { ReassignmentRequestView } from "./views/ReassignmentRequestView"
import {
  RegisterExchangeView,
  type ExchangeDraft,
} from "./views/RegisterExchangeView"
import { ReviewQueue, type ReviewFilters } from "./views/ReviewQueue"
import { ReviewWorkspace } from "./views/ReviewWorkspace"
import { SubmitReviewView } from "./views/SubmitReviewView"
import {
  SubsanationView,
  type ObservationAttention,
} from "./views/SubsanationView"
import {
  SpecialDerivationView,
  type DerivationDraft,
} from "./views/SpecialDerivationView"
import {
  TechnicalActionView,
  type TechnicalActionDraft,
} from "./views/TechnicalActionView"

type ListView = NavigationId
type DetailOrigin = "pending" | "locate" | "evidence" | "exchanges"
type Flow = FlowId | null

const initialPendingFilters: PendingFilters = {
  search: "",
  type: "all",
  status: "all",
  forceEmpty: false,
  sort: "updated",
}

const initialLocateFilters: LocateFilters = {
  query: "",
  status: "all",
  responsible: "all",
  hasSearched: false,
  restricted: false,
}

export default function App({ initialActor = "analyst", onLogout }: { initialActor?: Actor; onLogout?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [actor, setActor] = useState<Actor>(initialActor)
  const [view, setView] = useState<ListView>(initialActor === "reviewer" || initialActor === "vocal" ? "reviews" : initialActor === "supervisor" ? "requests" : initialActor === "exchange" ? "exchanges" : initialActor === "support" ? "interventions" : initialActor === "auditor" ? "evidence" : "pending")
  const [helpOpen, setHelpOpen] = useState(false)
  const [tourRequest, setTourRequest] = useState(0)
  const [flow, setFlow] = useState<Flow>(null)
  const [detailOrigin, setDetailOrigin] = useState<DetailOrigin>("pending")
  const [selectedReference, setSelectedReference] = useState<string | null>(
    null,
  )
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  )
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  )
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  )
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>(
    null,
  )
  const [exchangeOrigin, setExchangeOrigin] = useState<"list" | "expedient">(
    "list",
  )
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [traceOrigin, setTraceOrigin] = useState<"list" | "expedient">("list")
  const [selectedInterventionId, setSelectedInterventionId] =
    useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [trackingFocus, setTrackingFocus] = useState(false)
  const [records, setRecords] = useState<Expedient[]>(() =>
    initialExpedients.map((record) => ({
      ...record,
      assignments: record.assignments.map((assignment) => ({ ...assignment })),
    })),
  )
  const [requests, setRequests] = useState<ReassignmentRequest[]>(() =>
    initialRequests.map((request) => ({ ...request })),
  )
  const [documents, setDocuments] = useState<ExpedientDocument[]>(() =>
    initialDocuments.map((document) => ({
      ...document,
      versions: document.versions.map((version) => ({
        ...version,
        observations: version.observations.map((item) => ({ ...item })),
      })),
    })),
  )
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>(() =>
    initialReviewTasks.map((task) => ({ ...task })),
  )
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>(() =>
    initialExchanges.map((exchange) => ({
      ...exchange,
      attempts: exchange.attempts.map((attempt) => ({ ...attempt })),
    })),
  )
  const [derivations, setDerivations] = useState<SpecialDerivation[]>([])
  const [interventions, setInterventions] = useState<InterventionRecord[]>(() =>
    initialInterventions.map((intervention) => ({
      ...intervention,
      actions: intervention.actions.map((action) => ({ ...action })),
    })),
  )
  const [traces, setTraces] = useState<TraceRecord[]>(() =>
    initialTraces.map((trace) => ({ ...trace })),
  )
  const [pendingFilters, setPendingFilters] = useState(initialPendingFilters)
  const [locateFilters, setLocateFilters] = useState(initialLocateFilters)
  const [requestFilters, setRequestFilters] = useState<RequestFilters>({
    query: "",
    status: "all",
  })
  const [reviewFilters, setReviewFilters] = useState<ReviewFilters>({
    query: "",
    status: "all",
  })
  const [exchangeFilters, setExchangeFilters] = useState<ExchangeFilters>({
    query: "",
    status: "all",
    date: "",
  })
  const [evidenceFilters, setEvidenceFilters] = useState<EvidenceFilters>({
    query: "",
    actionType: "all",
    date: "",
    actor: "",
    evidence: "all",
  })
  const [interventionFilters, setInterventionFilters] =
    useState<InterventionFilters>({
      query: "",
      status: "all",
    })

  const selectedRecord = records.find(
    (record) => record.reference === selectedReference,
  )
  const selectedRequest = requests.find(
    (request) => request.id === selectedRequestId,
  )
  const selectedDocument = documents.find(
    (document) => document.id === selectedDocumentId,
  )
  const selectedVersion = selectedDocument?.versions.find(
    (version) => version.id === selectedVersionId,
  )
  const selectedReview = reviewTasks.find(
    (review) => review.id === selectedReviewId,
  )
  const selectedExchange = exchanges.find(
    (exchange) => exchange.id === selectedExchangeId,
  )
  const selectedTrace = traces.find((trace) => trace.id === selectedTraceId)
  const selectedIntervention = interventions.find(
    (intervention) => intervention.id === selectedInterventionId,
  )

  const appendTrace = (trace: Omit<TraceRecord, "id">) => {
    setTraces((current) => [
      {
        id: `TRAZA-DEMO-${String(current.length + 1).padStart(3, "0")}`,
        ...trace,
      },
      ...current,
    ])
  }

  const clearSelections = () => {
    setSelectedReference(null)
    setSelectedRequestId(null)
    setSelectedDocumentId(null)
    setSelectedVersionId(null)
    setSelectedReviewId(null)
    setSelectedExchangeId(null)
    setSelectedTraceId(null)
    setSelectedInterventionId(null)
    setFlow(null)
    setNotice("")
    setTrackingFocus(false)
  }

  const navigate = (destination: NavigationId) => {
    clearSelections()
    setView(destination)
    setMenuOpen(false)
  }

  const changeActor = (nextActor: Actor) => {
    setHelpOpen(false)
    setActor(nextActor)
    clearSelections()
    setView(
      nextActor === "reviewer" || nextActor === "vocal"
        ? "reviews"
        : nextActor === "support"
          ? "interventions"
          : nextActor === "auditor"
            ? "evidence"
            : nextActor === "exchange"
              ? "exchanges"
              : nextActor === "supervisor"
                ? "requests"
                : "pending",
    )
  }

  const openRecord = (
    record: Expedient,
    origin: DetailOrigin,
    focusTracking = false,
  ) => {
    setDetailOrigin(origin)
    setSelectedReference(record.reference)
    setSelectedRequestId(null)
    setNotice("")
    setTrackingFocus(focusTracking)
    setFlow("detail")
  }

  const pendingForSelected = requests.find(
    (request) =>
      request.expedientReference === selectedReference &&
      request.status === "Pendiente de evaluación",
  )
  const documentsForSelected = documents.filter(
    (document) => document.expedientReference === selectedReference,
  )
  const allSelectedVersions = documentsForSelected.flatMap(
    (document) => document.versions,
  )
  const latestSelectedVersion = allSelectedVersions.at(-1)
  const exchangesForSelected = exchanges.filter(
    (exchange) => exchange.expedientReference === selectedReference,
  )

  const assignInitial = (responsible: string) => {
    if (
      actor !== "supervisor" ||
      !selectedRecord ||
      selectedRecord.responsible
    ) {
      setNotice(
        "La asignación no fue aplicada por falta de autorización o condición válida.",
      )
      setFlow("detail")
      return
    }
    setRecords((current) =>
      current.map((record) =>
        record.reference === selectedRecord.reference
          ? {
              ...record,
              responsible,
              responsibility: `Asignación individual · ${responsible.replace("Usuario ", "")}`,
              updated: "18/06/2025 · 12:20",
              assignments: [
                {
                  label: "Responsabilidad vigente",
                  responsible,
                  date: "18/06/2025 · 12:20 · Supervisor DEMO-001",
                },
                ...record.assignments,
              ],
            }
          : record,
      ),
    )
    appendTrace({
      date: "18/06/2025 · 12:20",
      action: "Asignación inicial registrada",
      actionType: "Responsabilidad",
      expedientReference: selectedRecord.reference,
      actor: "Supervisor DEMO-001 · STK-01",
      source: "Historial de responsabilidad",
      evidenceAvailability: "Disponible",
      evidenceReference: `REG-ASG-${selectedRecord.reference}`,
      description:
        "Registro demostrativo de asignación inicial confirmado en el prototipo.",
    })
    setNotice(`Se registró la asignación inicial a ${responsible}.`)
    setFlow("detail")
  }

  const submitRequest = (reason: string) => {
    if (
      actor !== "analyst" ||
      !selectedRecord ||
      selectedRecord.responsible !== "Usuario DEMO-014" ||
      pendingForSelected
    ) {
      setNotice(
        "La solicitud no fue registrada porque la condición de acceso no es válida.",
      )
      setFlow("detail")
      return
    }
    const id = `SOL-DEMO-${String(requests.length + 1).padStart(3, "0")}`
    setRequests((current) => [
      {
        id,
        expedientReference: selectedRecord.reference,
        requester: "Usuario DEMO-014 · STK-02",
        currentResponsible: selectedRecord.responsible ?? "Por asignar",
        date: "18/06/2025 · 12:25",
        reason,
        status: "Pendiente de evaluación",
      },
      ...current,
    ])
    appendTrace({
      date: "18/06/2025 · 12:25",
      action: "Solicitud de reasignación registrada",
      actionType: "Responsabilidad",
      expedientReference: selectedRecord.reference,
      actor: "Usuario DEMO-014 · STK-02",
      source: id,
      evidenceAvailability: "No disponible",
      description:
        "Solicitud motivada registrada sin modificar la responsabilidad vigente.",
    })
    setNotice(
      `Se creó la solicitud ${id}. La responsabilidad vigente permanece sin cambios.`,
    )
    setFlow("detail")
  }

  const decideRequest = (
    decision: "approve" | "reject",
    justification: string,
    newResponsible?: string,
  ) => {
    if (
      actor !== "supervisor" ||
      !selectedRequest ||
      selectedRequest.status !== "Pendiente de evaluación" ||
      (decision === "approve" && !newResponsible)
    ) {
      return
    }
    setRequests((current) =>
      current.map((request) =>
        request.id === selectedRequest.id
          ? {
              ...request,
              status: decision === "approve" ? "Aprobada" : "Rechazada",
              resolutionJustification: justification,
              newResponsible:
                decision === "approve" ? newResponsible : undefined,
            }
          : request,
      ),
    )
    if (decision === "approve" && newResponsible) {
      setRecords((current) =>
        current.map((record) =>
          record.reference === selectedRequest.expedientReference
            ? {
                ...record,
                responsible: newResponsible,
                responsibility: `Asignación individual · ${newResponsible.replace("Usuario ", "")}`,
                updated: "18/06/2025 · 12:35",
                assignments: [
                  {
                    label: `Reasignación aprobada · ${selectedRequest.id}`,
                    responsible: newResponsible,
                    date: "18/06/2025 · 12:35 · Supervisor DEMO-001",
                  },
                  ...record.assignments,
                ],
              }
            : record,
        ),
      )
    }
    appendTrace({
      date: "18/06/2025 · 12:35",
      action:
        decision === "approve"
          ? "Solicitud de reasignación aprobada"
          : "Solicitud de reasignación rechazada",
      actionType: "Responsabilidad",
      expedientReference: selectedRequest.expedientReference,
      actor: "Supervisor DEMO-001 · STK-01",
      source: selectedRequest.id,
      evidenceAvailability: "Disponible",
      evidenceReference: `RESULTADO-${selectedRequest.id}`,
      description:
        decision === "approve"
          ? `Reasignación demostrativa confirmada a ${newResponsible}.`
          : "Rechazo demostrativo; se conserva la responsabilidad anterior.",
    })
  }

  const openDocuments = (versionId?: string) => {
    const relatedDocument = versionId
      ? documentsForSelected.find((document) =>
          document.versions.some((version) => version.id === versionId),
        )
      : undefined
    const document = relatedDocument ?? documentsForSelected.at(-1)
    const version =
      document?.versions.find((item) => item.id === versionId) ??
      document?.versions.at(-1)
    setSelectedDocumentId(document?.id ?? null)
    setSelectedVersionId(version?.id ?? null)
    setNotice("")
    setFlow("documents")
  }

  const submitVersionReview = () => {
    if (
      actor !== "analyst" ||
      !selectedDocument ||
      !selectedVersion ||
      !["Apta para envío", "Nueva versión · requiere revisión"].includes(
        selectedVersion.status,
      ) ||
      reviewTasks.some(
        (task) =>
          task.documentId === selectedDocument.id &&
          task.versionId === selectedVersion.id,
      )
    ) {
      setNotice(
        "No fue posible crear la revisión por una condición de acceso o estado.",
      )
      setFlow("documents")
      return
    }
    const reviewId = `REV-DEMO-${String(reviewTasks.length + 1).padStart(3, "0")}`
    const task: ReviewTask = {
      id: reviewId,
      expedientReference: selectedDocument.expedientReference,
      documentId: selectedDocument.id,
      versionId: selectedVersion.id,
      assignedTo: "Revisor DEMO-003 · STK-03",
      receivedAt: "18/06/2025 · 13:00",
      status: "Pendiente de revisión",
      observations: [],
    }
    setReviewTasks((current) => [task, ...current])
    setDocuments((current) =>
      current.map((document) =>
        document.id === selectedDocument.id
          ? {
              ...document,
              versions: document.versions.map((version) =>
                version.id === selectedVersion.id
                  ? { ...version, status: "En revisión interna" }
                  : version,
              ),
            }
          : document,
      ),
    )
    appendTrace({
      date: "18/06/2025 · 13:00",
      action: "Versión sometida a revisión interna",
      actionType: "Documento",
      expedientReference: selectedDocument.expedientReference,
      actor: "Usuario DEMO-014 · STK-02",
      source: reviewId,
      evidenceAvailability: "Disponible",
      evidenceReference: selectedVersion.fileName,
      documentId: selectedDocument.id,
      versionId: selectedVersion.id,
      description:
        "Solicitud interna de revisión vinculada a una versión documental exacta.",
    })
    setNotice(
      `Se creó ${reviewId} para ${selectedVersion.id}. No se modificaron versiones anteriores.`,
    )
    setFlow("documents")
  }

  const decideReview = (decision: "conform" | "observe", note: string) => {
    if (
      actor !== "reviewer" ||
      !selectedReview ||
      selectedReview.status !== "Pendiente de revisión" ||
      (decision === "observe" && !note.trim())
    ) {
      return
    }
    const observations =
      decision === "observe"
        ? [{ id: `OBS-${selectedReview.id}-01`, text: note.trim() }]
        : []
    const status = decision === "observe" ? "Observada" : "Conformidad interna"
    setReviewTasks((current) =>
      current.map((task) =>
        task.id === selectedReview.id
          ? { ...task, status, resultNote: note, observations }
          : task,
      ),
    )
    setDocuments((current) =>
      current.map((document) =>
        document.id === selectedReview.documentId
          ? {
              ...document,
              versions: document.versions.map((version) =>
                version.id === selectedReview.versionId
                  ? { ...version, status, observations }
                  : version,
              ),
            }
          : document,
      ),
    )
    const reviewedDocument = documents.find(
      (document) => document.id === selectedReview.documentId,
    )
    const reviewedVersion = reviewedDocument?.versions.find(
      (version) => version.id === selectedReview.versionId,
    )
    appendTrace({
      date: "18/06/2025 · 13:30",
      action:
        decision === "observe"
          ? "Observaciones de revisión registradas"
          : "Conformidad interna registrada",
      actionType: "Documento",
      expedientReference: selectedReview.expedientReference,
      actor: "Revisor DEMO-003 · STK-03",
      source: selectedReview.id,
      evidenceAvailability: reviewedVersion ? "Disponible" : "No disponible",
      evidenceReference: reviewedVersion?.fileName,
      documentId: selectedReview.documentId,
      versionId: selectedReview.versionId,
      description:
        decision === "observe"
          ? "Resultado interno con observaciones; no implica conformidad."
          : "Conformidad exclusivamente interna vinculada a la versión exacta.",
    })
  }

  const createSubsanatedVersion = (
    fileName: string,
    attention: ObservationAttention[],
  ) => {
    if (
      actor !== "analyst" ||
      !selectedDocument ||
      !selectedVersion ||
      selectedVersion.status !== "Observada" ||
      !fileName
    ) {
      return
    }
    const number =
      Math.max(...selectedDocument.versions.map((item) => item.number)) + 1
    const newVersion: DocumentVersion = {
      id: `${selectedDocument.id} · v${number}`,
      number,
      author: "Usuario DEMO-014 · STK-02",
      createdAt: "18/06/2025 · 14:10",
      fileName,
      status: "Nueva versión · requiere revisión",
      previousVersionId: selectedVersion.id,
      observations: [],
      attention,
    }
    setDocuments((current) =>
      current.map((document) =>
        document.id === selectedDocument.id
          ? { ...document, versions: [...document.versions, newVersion] }
          : document,
      ),
    )
    appendTrace({
      date: newVersion.createdAt,
      action: "Nueva versión por subsanación registrada",
      actionType: "Documento",
      expedientReference: selectedDocument.expedientReference,
      actor: newVersion.author,
      source: `Subsanación de ${selectedVersion.id}`,
      evidenceAvailability: "Disponible",
      evidenceReference: newVersion.fileName,
      documentId: selectedDocument.id,
      versionId: newVersion.id,
      description:
        "Nueva versión enlazada a la observada; la versión anterior permanece disponible.",
    })
    setSelectedVersionId(newVersion.id)
    setNotice(
      `Se creó ${newVersion.id} enlazada a ${selectedVersion.id}. La versión anterior sigue consultable.`,
    )
    setFlow("documents")
  }

  const openExchange = (
    exchange: ExchangeRecord,
    origin: "list" | "expedient",
  ) => {
    setSelectedExchangeId(exchange.id)
    setSelectedReference(exchange.expedientReference)
    setExchangeOrigin(origin)
    setNotice("")
    setFlow("exchangeDetail")
  }

  const registerExchange = (draft: ExchangeDraft) => {
    if (actor !== "exchange") return
    const id = `INT-DEMO-${String(exchanges.length + 1).padStart(3, "0")}`
    const newExchange: ExchangeRecord = {
      id,
      expedientReference: draft.expedientReference,
      actionType: draft.actionType,
      relatedItem: draft.relatedItem,
      channel: draft.channel,
      destination: draft.destination,
      registeredAt: draft.date,
      externalReference: draft.externalReference,
      evidence: draft.evidence,
      status: "Registrado",
      attempts: [
        {
          id: `INTENTO-${id}-01`,
          date: draft.date,
          result: "Registrado",
          message:
            "Salida registrada localmente; no existe confirmación externa.",
        },
      ],
    }
    setExchanges((current) => [newExchange, ...current])
    appendTrace({
      date: draft.date,
      action: "Salida o intercambio registrado",
      actionType: "Intercambio",
      expedientReference: draft.expedientReference,
      actor: "Personal documentario DEMO-006 · STK-06",
      source: id,
      evidenceAvailability: draft.evidence ? "Disponible" : "No disponible",
      evidenceReference: draft.evidence,
      description:
        "Registro interno de salida; no constituye confirmación externa.",
    })
    setSelectedExchangeId(id)
    setSelectedReference(draft.expedientReference)
    setNotice(
      `Se registró ${id}. El registro no demuestra confirmación externa.`,
    )
    setFlow("exchangeDetail")
  }

  const treatExchange = (draft: TreatmentDraft) => {
    if (
      actor !== "exchange" ||
      !selectedExchange ||
      !["Fallido", "Resultado desconocido"].includes(selectedExchange.status)
    ) {
      return
    }
    const attemptNumber = selectedExchange.attempts.length + 1
    const attemptId = `INTENTO-${selectedExchange.id}-${String(
      attemptNumber,
    ).padStart(2, "0")}`
    setExchanges((current) =>
      current.map((exchange) =>
        exchange.id === selectedExchange.id
          ? {
              ...exchange,
              status: "Resultado desconocido",
              attempts: [
                ...exchange.attempts,
                {
                  id: attemptId,
                  date: "18/06/2025 · 15:20",
                  result: "Resultado desconocido",
                  message:
                    draft.action === "retry"
                      ? `Reintento registrado: ${draft.note}`
                      : `Escalamiento técnico registrado: ${draft.note}`,
                  technicalReference:
                    draft.action === "escalate"
                      ? `ESC-DEMO-${attemptNumber}`
                      : undefined,
                },
              ],
            }
          : exchange,
      ),
    )
    appendTrace({
      date: "18/06/2025 · 15:20",
      action:
        draft.action === "retry"
          ? "Reintento de intercambio registrado"
          : "Escalamiento técnico de intercambio registrado",
      actionType: "Intercambio",
      expedientReference: selectedExchange.expedientReference,
      actor: "Personal documentario DEMO-006 · STK-06",
      source: attemptId,
      evidenceAvailability: "No disponible",
      description:
        "Nuevo intento añadido sin eliminar antecedentes; resultado externo desconocido.",
    })
    setNotice(
      `Se añadió ${attemptId}; los ${selectedExchange.attempts.length} intentos anteriores se conservaron.`,
    )
    setFlow("exchangeDetail")
  }

  const registerDerivation = (draft: DerivationDraft) => {
    if ((actor !== "analyst" && actor !== "exchange") || !selectedRecord) {
      return
    }
    const id = `DER-DEMO-${String(derivations.length + 1).padStart(3, "0")}`
    setDerivations((current) => [
      {
        id,
        expedientReference: selectedRecord.reference,
        reason: draft.reason,
        destination: draft.destination,
        relatedAction: draft.relatedAction,
        evidence: draft.evidence,
        registeredAt: "18/06/2025 · 15:35",
        registeredBy:
          actor === "analyst"
            ? "Usuario DEMO-014 · STK-02"
            : "Personal documentario DEMO-006 · STK-06",
      },
      ...current,
    ])
    appendTrace({
      date: "18/06/2025 · 15:35",
      action: "Derivación especial registrada",
      actionType: "Intercambio",
      expedientReference: selectedRecord.reference,
      actor:
        actor === "analyst"
          ? "Usuario DEMO-014 · STK-02"
          : "Personal documentario DEMO-006 · STK-06",
      source: id,
      evidenceAvailability: "Disponible",
      evidenceReference: draft.evidence,
      description:
        "Constancia interna de derivación; no ejecuta ni resuelve el procedimiento externo.",
    })
    setNotice(
      `Se registró ${id} como derivación interna. No se ejecutó ni resolvió el procedimiento externo.`,
    )
    setFlow("detail")
  }

  const openTrace = (trace: TraceRecord, origin: "list" | "expedient") => {
    if (actor !== "auditor") return
    setSelectedTraceId(trace.id)
    setSelectedReference(trace.expedientReference)
    setTraceOrigin(origin)
    setFlow("evidenceDetail")
  }

  const registerTechnicalAction = (draft: TechnicalActionDraft) => {
    if (
      actor !== "support" ||
      !selectedIntervention ||
      (draft.result === "Recuperación comprobada" && !draft.evidence)
    ) {
      return
    }
    const actionId = `ACT-${selectedIntervention.id}-${String(
      selectedIntervention.actions.length + 1,
    ).padStart(2, "0")}`
    setInterventions((current) =>
      current.map((intervention) =>
        intervention.id === selectedIntervention.id
          ? {
              ...intervention,
              date: "18/06/2025 · 16:00",
              status: draft.result,
              result:
                draft.result === "Recuperación comprobada"
                  ? "Verificación demostrativa registrada con evidencia."
                  : draft.description,
              actions: [
                ...intervention.actions,
                {
                  id: actionId,
                  date: "18/06/2025 · 16:00",
                  stage: draft.stage,
                  description: draft.description,
                  result: draft.result,
                  evidence: draft.evidence,
                  registeredBy: "Soporte DEMO-008 · STK-08",
                },
              ],
            }
          : intervention,
      ),
    )
    setNotice(
      `${actionId} fue registrado localmente; no se ejecutó una reparación institucional.`,
    )
    setFlow("interventionDetail")
  }

  const activeItem: NavigationId =
    flow === "evaluation"
      ? "requests"
      : flow === "reviewWorkspace"
        ? "reviews"
        : flow === "exchangeDetail" ||
            flow === "registerExchange" ||
            flow === "treatExchange"
          ? "exchanges"
          : flow === "evidenceDetail"
            ? "evidence"
            : flow === "interventionDetail" || flow === "technicalAction"
              ? "interventions"
              : flow && selectedRecord
                ? detailOrigin
                : view
  const workspaceName =
    flow === "evaluation"
      ? `Evaluación ${selectedRequestId}`
      : flow === "reviewWorkspace"
        ? `Revisión ${selectedReviewId}`
        : flow === "exchangeDetail" || flow === "treatExchange"
          ? `Intercambio ${selectedExchangeId}`
          : flow === "registerExchange"
            ? "Registrar salida"
            : flow === "evidenceDetail"
              ? `Traza ${selectedTraceId}`
              : flow === "interventionDetail" || flow === "technicalAction"
                ? `Intervención ${selectedInterventionId}`
                : selectedRecord
                  ? `Expediente ${selectedRecord.reference}`
                  : view === "pending"
                    ? "Pendientes y seguimiento"
                    : view === "locate"
                      ? "Localizar expedientes"
                      : view === "requests"
                        ? "Solicitudes de reasignación"
                        : view === "reviews"
                          ? "Revisiones pendientes"
                          : view === "exchanges"
                            ? "Intercambios registrados"
                            : view === "evidence"
                              ? "Evidencia y trazabilidad"
                               : "Intervenciones técnicas"

  useEffect(() => {
    document.title = `TRASU · ${workspaceName}`
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>(".workspace h1")
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
      document.querySelector(".workspace")?.scrollTo(0, 0)
    })
    return () => cancelAnimationFrame(frame)
  }, [actor, flow, view, selectedReference, selectedRequestId, selectedReviewId, selectedExchangeId, selectedTraceId, selectedInterventionId])

  let content
  if (flow === "technicalAction" && selectedIntervention) {
    content = (
      <TechnicalActionView
        onCancel={() => setFlow("interventionDetail")}
        onConfirm={registerTechnicalAction}
        record={selectedIntervention}
      />
    )
  } else if (flow === "interventionDetail" && selectedIntervention) {
    content = (
      <InterventionDetail
        notice={notice}
        onBack={() => {
          setFlow(null)
          setView("interventions")
          setNotice("")
        }}
        onRegisterAction={() => {
          if (actor === "support") setFlow("technicalAction")
        }}
        record={selectedIntervention}
      />
    )
  } else if (flow === "evidenceDetail" && selectedTrace) {
    content = (
      <EvidenceDetail
        onBack={() => {
          if (traceOrigin === "expedient") {
            setFlow("detail")
          } else {
            setFlow(null)
            setView("evidence")
            setSelectedReference(null)
          }
        }}
        onOpenExpedient={() => {
          const record = records.find(
            (item) => item.reference === selectedTrace.expedientReference,
          )
          if (record) {
            setDetailOrigin("evidence")
            setSelectedReference(record.reference)
            setFlow("detail")
          }
        }}
        origin={traceOrigin}
        record={selectedTrace}
        sequence={traces.filter(
          (trace) =>
            trace.expedientReference === selectedTrace.expedientReference,
        )}
      />
    )
  } else if (flow === "treatExchange" && selectedExchange) {
    content = (
      <ExchangeTreatmentView
        onCancel={() => setFlow("exchangeDetail")}
        onConfirm={treatExchange}
        record={selectedExchange}
      />
    )
  } else if (flow === "exchangeDetail" && selectedExchange) {
    content = (
      <ExchangeDetail
        actor={actor}
        notice={notice}
        onBack={() => {
          if (exchangeOrigin === "expedient") {
            setFlow("detail")
          } else {
            setFlow(null)
            setView("exchanges")
            setSelectedReference(null)
          }
          setNotice("")
        }}
        onOpenExpedient={() => {
          const record = records.find(
            (item) => item.reference === selectedExchange.expedientReference,
          )
          if (record) {
            setDetailOrigin("exchanges")
            setSelectedReference(record.reference)
            setFlow("detail")
          }
        }}
        onTreatFailure={() => {
          if (actor === "exchange") setFlow("treatExchange")
        }}
        origin={exchangeOrigin}
        record={selectedExchange}
      />
    )
  } else if (flow === "registerExchange") {
    content = (
      <RegisterExchangeView
        documents={documents}
        initialReference={selectedReference ?? undefined}
        onCancel={() => {
          if (exchangeOrigin === "expedient" && selectedRecord) {
            setFlow("detail")
          } else {
            setFlow(null)
            setView("exchanges")
          }
        }}
        onConfirm={registerExchange}
        records={records}
      />
    )
  } else if (flow === "specialDerivation" && selectedRecord) {
    content = (
      <SpecialDerivationView
        onCancel={() => setFlow("detail")}
        onConfirm={registerDerivation}
        record={selectedRecord}
      />
    )
  } else if (flow === "reviewWorkspace" && selectedReview) {
    const document = documents.find(
      (item) => item.id === selectedReview.documentId,
    )
    const version = document?.versions.find(
      (item) => item.id === selectedReview.versionId,
    )
    content =
      document && version ? (
        <ReviewWorkspace
          document={document}
          onBack={() => {
            setFlow(null)
            setView("reviews")
          }}
          onDecide={decideReview}
          task={selectedReview}
          version={version}
        />
      ) : null
  } else if (flow === "evaluation" && selectedRequest) {
    const record = records.find(
      (item) => item.reference === selectedRequest.expedientReference,
    )
    content = record ? (
      <ReassignmentEvaluation
        onBack={() => {
          setFlow(null)
          setView("requests")
        }}
        onDecide={decideRequest}
        record={record}
        request={selectedRequest}
      />
    ) : null
  } else if (
    selectedRecord &&
    selectedDocument &&
    selectedVersion &&
    flow === "submitReview"
  ) {
    content = (
      <SubmitReviewView
        document={selectedDocument}
        onCancel={() => setFlow("documents")}
        onConfirm={submitVersionReview}
        version={selectedVersion}
      />
    )
  } else if (
    selectedRecord &&
    selectedDocument &&
    selectedVersion &&
    flow === "subsanate"
  ) {
    content = (
      <SubsanationView
        document={selectedDocument}
        onCancel={() => setFlow("documents")}
        onConfirm={createSubsanatedVersion}
        version={selectedVersion}
      />
    )
  } else if (selectedRecord && flow === "documents") {
    content = (
      <DocumentWorkspace
        activeVersionId={selectedVersionId}
        actor={actor}
        documents={documentsForSelected}
        notice={notice}
        onBack={() => setFlow("detail")}
        onSelectVersion={(versionId) => {
          const document = documentsForSelected.find((item) =>
            item.versions.some((version) => version.id === versionId),
          )
          setSelectedDocumentId(document?.id ?? null)
          setSelectedVersionId(versionId)
          setNotice("")
        }}
        onSubmitReview={(document, version) => {
          if (actor !== "analyst") return
          setSelectedDocumentId(document.id)
          setSelectedVersionId(version.id)
          setFlow("submitReview")
        }}
        onSubsanate={(document, version) => {
          if (actor !== "analyst") return
          setSelectedDocumentId(document.id)
          setSelectedVersionId(version.id)
          setFlow("subsanate")
        }}
        record={selectedRecord}
        reviews={reviewTasks}
      />
    )
  } else if (selectedRecord && flow === "assign") {
    content = (
      <InitialAssignmentView
        onCancel={() => setFlow("detail")}
        onConfirm={assignInitial}
        record={selectedRecord}
      />
    )
  } else if (selectedRecord && flow === "request") {
    content = (
      <ReassignmentRequestView
        duplicateId={pendingForSelected?.id}
        onCancel={() => setFlow("detail")}
        onSubmit={submitRequest}
        record={selectedRecord}
      />
    )
  } else if (selectedRecord && flow === "detail") {
    content = (
      <ExpedientDetail
        actor={actor}
        documentCount={documentsForSelected.length}
        derivations={derivations.filter(
          (derivation) =>
            derivation.expedientReference === selectedRecord.reference,
        )}
        documents={documentsForSelected}
        exchanges={exchangesForSelected}
        latestDocumentVersion={
          latestSelectedVersion
            ? {
                id: latestSelectedVersion.id,
                status: latestSelectedVersion.status,
              }
            : undefined
        }
        notice={notice}
        onAssignInitial={() => {
          if (actor === "supervisor" && !selectedRecord.responsible)
            setFlow("assign")
        }}
        onBack={() => {
          clearSelections()
          setView(detailOrigin)
        }}
        onOpenDocuments={openDocuments}
        onOpenExchange={(exchange) => openExchange(exchange, "expedient")}
        onRegisterExchange={() => {
          if (actor === "exchange") {
            setExchangeOrigin("expedient")
            setFlow("registerExchange")
          }
        }}
        onOpenTrackingDocument={openDocuments}
        onOpenTrace={(trace) => openTrace(trace, "expedient")}
        onOpenRequests={() => navigate("requests")}
        onRequestReassignment={() => {
          if (
            actor === "analyst" &&
            selectedRecord.responsible === "Usuario DEMO-014"
          ) {
            setFlow("request")
          }
        }}
        onSpecialDerivation={() => {
          if (actor === "analyst" || actor === "exchange") {
            setFlow("specialDerivation")
          }
        }}
        origin={detailOrigin}
        pendingRequest={pendingForSelected}
        record={selectedRecord}
        requests={requests.filter(
          (request) => request.expedientReference === selectedRecord.reference,
        )}
        reviews={reviewTasks.filter(
          (review) => review.expedientReference === selectedRecord.reference,
        )}
        trackingFocus={trackingFocus}
        traces={traces.filter(
          (trace) => trace.expedientReference === selectedRecord.reference,
        )}
      />
    )
  } else if (view === "pending") {
    content = (
      <PendingView
        actor={actor}
        filters={pendingFilters}
        onFiltersChange={setPendingFilters}
        onLocate={() => navigate("locate")}
        onOpen={(record) => openRecord(record, "pending")}
        onOpenTracking={(record) => openRecord(record, "pending", true)}
        records={
          actor === "supervisor"
            ? records
            : actor === "reviewer"
              ? records.filter((record) =>
                  reviewTasks.some(
                    (review) =>
                      review.expedientReference === record.reference &&
                      review.status === "Pendiente de revisión",
                  ),
                )
              : records.filter(
                  (record) => record.responsible === "Usuario DEMO-014",
                )
        }
      />
    )
  } else if (view === "locate") {
    content = (
      <LocateView
        filters={locateFilters}
        onFiltersChange={setLocateFilters}
        onOpen={(record) => openRecord(record, "locate")}
        records={records}
      />
    )
  } else if (view === "requests") {
    content = (
      <ReassignmentQueue
        actor={actor}
        filters={requestFilters}
        onEvaluate={(request) => {
          if (actor !== "supervisor") return
          setSelectedRequestId(request.id)
          setFlow("evaluation")
        }}
        onFiltersChange={setRequestFilters}
        requests={requests}
      />
    )
  } else if (view === "reviews") {
    content = (
      <ReviewQueue
        actor={actor}
        documents={documents}
        filters={reviewFilters}
        onFiltersChange={setReviewFilters}
        onOpen={(task) => {
          if (actor !== "reviewer") return
          setSelectedReviewId(task.id)
          setSelectedReference(task.expedientReference)
          setSelectedDocumentId(task.documentId)
          setSelectedVersionId(task.versionId)
          setFlow("reviewWorkspace")
        }}
        tasks={reviewTasks}
      />
    )
  } else if (view === "exchanges") {
    content = (
      <ExchangeList
        actor={actor}
        filters={exchangeFilters}
        onFiltersChange={setExchangeFilters}
        onOpen={(exchange) => openExchange(exchange, "list")}
        onRegister={() => {
          if (actor !== "exchange") return
          setExchangeOrigin("list")
          setSelectedReference(null)
          setFlow("registerExchange")
        }}
        records={exchanges}
      />
    )
  } else if (view === "evidence") {
    content = (
      <EvidenceList
        actor={actor}
        filters={evidenceFilters}
        onFiltersChange={setEvidenceFilters}
        onOpen={(trace) => openTrace(trace, "list")}
        records={traces}
      />
    )
  } else {
    content = (
      <InterventionList
        actor={actor}
        filters={interventionFilters}
        onFiltersChange={setInterventionFilters}
        onOpen={(intervention) => {
          if (actor !== "support") return
          setSelectedInterventionId(intervention.id)
          setNotice("")
          setFlow("interventionDetail")
        }}
        records={interventions}
      />
    )
  }

  return (
    <AppShell
      activeItem={activeItem}
      actor={actor}
      menuOpen={menuOpen}
      onActorChange={changeActor}
      onHelp={() => setHelpOpen(true)}
      onTour={() => setTourRequest((current) => current + 1)}
      onLogout={onLogout}
      onMenuToggle={() => setMenuOpen((current) => !current)}
      onNavigate={navigate}
      onSidebarToggle={() => setSidebarCollapsed((current) => !current)}
      sidebarCollapsed={sidebarCollapsed}
      workspaceName={workspaceName}
    >
      <div className="page"><Assistance key={actor} actor={actor} view={activeItem} flow={flow} reference={flow ? selectedReference ?? selectedInterventionId ?? undefined : undefined} helpOpen={helpOpen} onCloseHelp={() => setHelpOpen(false)} tourRequest={tourRequest} onNavigate={navigate}>{content}</Assistance></div>
    </AppShell>
  )
}
