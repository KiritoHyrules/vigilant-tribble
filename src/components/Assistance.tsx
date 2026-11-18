import { useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Play, Search, X } from "lucide-react"
import type { Actor, NavigationId } from "./AppShell"
import { Button } from "./system"
import { guidesForRole, roles, type Guide } from "../data/assistance"
import { guideDestination } from "../data/task-guides"
import { actionHelp, actionsForRole, editingScreens, screenHelp, type FlowId, type ScreenId } from "../data/help-context"
import { GuideContent } from "./GuideContent"
import { TaskCompanion } from "./TaskCompanion"
import { ScreenGuide } from "./ScreenGuide"

function hasSeen(actor: Actor) {
  try {
    const raw = localStorage.getItem(`trasu:orientation:v1:${actor}`)
    if (!raw) return false
    const state = JSON.parse(raw)
    return state.status === "done" || state.status === "skipped"
  } catch { return false }
}

export function Assistance({ actor, view, flow, reference, helpOpen, onCloseHelp, tourRequest, onNavigate, children }: {
  actor: Actor; view: NavigationId; flow: FlowId | null; reference?: string; helpOpen: boolean
  onCloseHelp: () => void; tourRequest: number; onNavigate: (view: NavigationId) => void; children: ReactNode
}) {
  const [seen, setSeen] = useState(() => hasSeen(actor))
  const [step, setStep] = useState<number | null>(null)
  const [spot, setSpot] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [companionId, setCompanionId] = useState<string | null>(null)
  const [screenGuideActive, setScreenGuideActive] = useState(false)
  const [onlyCurrent, setOnlyCurrent] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<NavigationId | null>(null)
  const [announced, setAnnounced] = useState("")
  const dialogRef = useRef<HTMLDialogElement>(null)
  const tourTitleRef = useRef<HTMLHeadingElement>(null)
  const priorFocus = useRef<HTMLElement | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const navigationWarningRef = useRef<HTMLHeadingElement>(null)
  const lastTourRequest = useRef(tourRequest)
  const roleGuides = guidesForRole(actor)
  const selected = roleGuides.find((guide) => guide.id === selectedId)
  const companion = roleGuides.find((guide) => guide.id === companionId)
  const screen: ScreenId = flow ?? view
  const screenActions = actionsForRole(screenHelp[screen].actions, actor)
  const term = query.trim().toLocaleLowerCase("es")
  const filtered = roleGuides.filter((guide) => (!onlyCurrent || guide.steps.some((item) => item.screen === screen)) && `${guide.title} ${guide.description} ${guide.steps.map((item) => `${item.title} ${item.instruction} ${item.result}`).join(" ")}`.toLocaleLowerCase("es").includes(term))
  const tourSteps = [
    { target: "profile", title: `Tu perfil: ${roles[actor].name}`, text: `${roles[actor].purpose} El selector superior permite explorar perfiles de prueba; no representa un permiso real.` },
    { target: "navigation", title: "Solo el espacio de tu perfil", text: "La navegación reúne tus módulos habilitados. En pantallas pequeñas, ábrela con el menú superior. Un acceso condicionado no se desbloquea completando el recorrido." },
    { target: "workspace", title: "Primero el contexto, después la acción", text: "Consulta referencias, estados y versiones antes de actuar. Los mensajes junto a la tarea explican las condiciones que debes revisar." },
    { target: "help", title: "La ayuda se queda contigo", text: "Abre Ayuda y guías para volver a este recorrido o consultar una lista de pasos. Las guías no ejecutan ni confirman operaciones por ti." },
  ]

  function startTour() {
    priorFocus.current = document.activeElement as HTMLElement | null
    onCloseHelp()
    setCompanionId(null)
    setScreenGuideActive(false)
    setStep(0)
  }

  function endTour(status: "done" | "skipped") {
    try { localStorage.setItem(`trasu:orientation:v1:${actor}`, JSON.stringify({ status })) } catch { /* Orientation remains usable when storage is unavailable. */ }
    setSeen(true)
    setStep(null)
    setSpot(null)
    requestAnimationFrame(() => {
      const previous = priorFocus.current
      const canRestore = previous?.isConnected && previous.getClientRects().length > 0 && !previous.closest('dialog:not([open]), [inert]')
      const target = canRestore ? previous : document.querySelector<HTMLElement>('[data-tour="help"]')
      target?.focus()
    })
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (helpOpen && !dialog.open) dialog.showModal()
    if (!helpOpen && dialog.open) dialog.close()
  }, [helpOpen])

  useEffect(() => {
    if (!helpOpen) setPendingNavigation(null)
  }, [helpOpen])

  useEffect(() => { if (pendingNavigation) navigationWarningRef.current?.focus() }, [pendingNavigation])

  useEffect(() => {
    if (tourRequest !== lastTourRequest.current) {
      lastTourRequest.current = tourRequest
      priorFocus.current = document.activeElement as HTMLElement | null
      setStep(0)
    }
  }, [tourRequest])

  useEffect(() => {
    if (step === null) return
    tourTitleRef.current?.focus()
    const selector = ["profile", "navigation", "workspace", "help"][step]
    const node = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`)
    function measure() {
      if (!node) { setSpot(null); return }
      const rect = node.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1 || rect.right <= 0 || rect.left >= window.innerWidth) { setSpot(null); return }
      const x = Math.max(4, rect.left - 5)
      const y = Math.max(4, rect.top - 5)
      setSpot({ x, y, width: Math.min(rect.width + 10, window.innerWidth - x - 4), height: Math.min(rect.height + 10, window.innerHeight - y - 4) })
    }
    measure()
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); endTour("skipped") }
    }
    document.addEventListener("keydown", handleKey)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    const observer = node ? new ResizeObserver(measure) : null
    if (node) observer?.observe(node)
    return () => { document.removeEventListener("keydown", handleKey); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); observer?.disconnect() }
  }, [step])

  function selectGuide(guide: Guide) { setSelectedId(guide.id); setPendingNavigation(null) }
  function closeCompanion() {
    setCompanionId(null)
    setAnnounced("Guía cerrada. No se ha modificado la tarea.")
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-tour="help"]')?.focus())
  }
  function accompany() {
    if (!selected) return
    setStep(null)
    setCompanionId(selected.id)
    setScreenGuideActive(false)
    onCloseHelp()
    requestAnimationFrame(() => document.querySelector<HTMLElement>(".task-companion h2")?.focus())
  }
  function navigateToGuide() {
    if (!selected) return
    const destination = guideDestination(selected, actor)
    if (editingScreens.includes(screen)) setPendingNavigation(destination)
    else { onCloseHelp(); onNavigate(destination) }
  }

  return <>
    {!seen && step === null && !flow && !screenGuideActive && <section className="orientation-welcome" aria-labelledby="welcome-title"><div><h2 id="welcome-title">¿Primera vez como {roles[actor].name.toLowerCase()}?</h2><p>Explora tu espacio o empieza a trabajar directamente.</p></div><div><Button variant="secondary" icon={<Play size={16} aria-hidden="true" />} onClick={startTour}>Iniciar recorrido</Button><Button variant="quiet" onClick={() => endTour("skipped")}>Ahora no</Button></div></section>}
    <span className="sr-only" role="status">{announced}</span>
    {!companion && step === null && <ScreenGuide key={`${screen}:${reference ?? ""}`} screen={screen} active={screenGuideActive} suspended={helpOpen} onStart={() => setScreenGuideActive(true)} onClose={() => setScreenGuideActive(false)} />}
    <div className={`assisted-workspace${companion ? " assisted-workspace--active" : ""}`}><div className="assisted-workspace__content">{children}</div>{companion && <TaskCompanion key={companion.id} guide={companion} screen={screen} suspended={helpOpen} onClose={closeCompanion} onExploreScreen={() => { setCompanionId(null); setScreenGuideActive(true); requestAnimationFrame(() => document.querySelector<HTMLElement>(".screen-assistance h2")?.focus()) }} />}</div>
    <dialog ref={dialogRef} className="help-drawer" aria-labelledby="help-title" onCancel={(event) => { event.preventDefault(); onCloseHelp() }}>
      <header className="help-drawer__header"><div><h2 id="help-title">Ayuda y guías</h2><p>{roles[actor].name} · {roles[actor].code}</p></div><button className="help-close" type="button" onClick={onCloseHelp} aria-label="Cerrar ayuda"><X size={21} aria-hidden="true" /></button></header>
      <div className="help-drawer__body">
        <div className="help-current-context"><span>Tu ubicación</span><strong>{screenHelp[screen].title}</strong>{reference && <small>{reference}</small>}</div>
        {selected ? <>
          <GuideContent key={selected.id} guide={selected} onBack={() => { setSelectedId(null); setPendingNavigation(null); requestAnimationFrame(() => searchRef.current?.focus()) }} onNavigate={navigateToGuide} onAccompany={accompany} />
          {pendingNavigation && <section className="help-navigation-warning"><h3 tabIndex={-1} ref={navigationWarningRef}>¿Abandonar la preparación actual?</h3><p>Ir al módulo de inicio cerrará esta pantalla. Los datos sin confirmar se descartarán; los registros ya confirmados no se borrarán.</p><Button variant="secondary" onClick={() => { setPendingNavigation(null); requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>(".guide-detail .button")?.focus()) }}>Seguir en esta tarea</Button><Button onClick={() => { onCloseHelp(); onNavigate(pendingNavigation); setPendingNavigation(null) }}>Descartar preparación e ir al módulo</Button></section>}
        </> : <>
          <details className="help-actions">
            <summary>
              <span className="help-actions__label">Qué puedes hacer en esta pantalla</span>
              <span className="help-actions__count">{screenActions.length}</span>
              <ChevronRight className="help-actions__chevron" size={16} aria-hidden="true" />
            </summary>
            <dl>{screenActions.map((id) => <div key={id}><dt>{actionHelp[id].label}</dt><dd>{actionHelp[id].effect}<small>{actionHelp[id].condition}</small></dd></div>)}</dl>
          </details>
          <div className="help-intro"><BookOpen size={24} aria-hidden="true" /><div><h3>Retoma la orientación</h3><p>Un recorrido breve por tu perfil, navegación y ayuda.</p><Button variant="secondary" onClick={startTour} icon={<Play size={15} aria-hidden="true" />}>Repetir recorrido inicial</Button></div></div>
          <label className="help-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar una guía de tu perfil</span><input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar una acción: ver expediente, subsanar…" /></label>
          <label className="help-current-filter"><input type="checkbox" checked={onlyCurrent} onChange={(event) => setOnlyCurrent(event.target.checked)} /> Relacionadas con esta pantalla</label>
          <h3>Guías para tu trabajo</h3><p className="help-result-count" role="status">{filtered.length} {filtered.length === 1 ? "guía disponible" : "guías disponibles"} para este perfil</p>
          <div className="guide-list">{filtered.map((guide) => <button key={guide.id} type="button" onClick={() => selectGuide(guide)}><span><strong>{guide.title}</strong><small>{guide.description}</small></span><ArrowRight size={18} aria-hidden="true" /></button>)}</div>
          {filtered.length === 0 && <div className="help-empty"><p>No encontramos una guía con esos términos.</p><Button variant="secondary" onClick={() => { setQuery(""); setOnlyCurrent(false); searchRef.current?.focus() }}>Limpiar búsqueda</Button></div>}
        </>}
        <p className="help-disclaimer">Orientación del prototipo. No modifica expedientes, no concede permisos y no sustituye los procedimientos institucionales vigentes.</p>
      </div>
    </dialog>
    {step !== null && <>
      {spot && <div className="tour-spotlight" aria-hidden="true" style={{ left: spot.x, top: spot.y, width: spot.width, height: spot.height }} />}
      <section className="tour-card" aria-label="Recorrido de orientación"><div className="tour-card__progress"><span>Paso {step + 1} de {tourSteps.length}</span><button type="button" className="text-button" onClick={() => endTour("skipped")}>Omitir recorrido</button></div><div className="tour-track" aria-hidden="true">{tourSteps.map((_, index) => <span key={index} className={index <= step ? "is-complete" : ""} />)}</div><h2 ref={tourTitleRef} tabIndex={-1}>{tourSteps[step].title}</h2><p>{tourSteps[step].text}</p><div className="tour-card__actions"><Button variant="quiet" disabled={step === 0} onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} aria-hidden="true" />}>Anterior</Button><Button onClick={() => step === tourSteps.length - 1 ? endTour("done") : setStep(step + 1)} icon={step === tourSteps.length - 1 ? <Check size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}>{step === tourSteps.length - 1 ? "Comenzar mi trabajo" : "Siguiente"}</Button></div></section>
    </>}
  </>
}
