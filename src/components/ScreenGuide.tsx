import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, CircleHelp, LocateFixed, X } from "lucide-react"
import { screenTours, type ScreenStop } from "../data/screen-tours"
import { screenHelp, type ScreenId } from "../data/help-context"
import { Button } from "./system"

export function ScreenGuide({ screen, active, suspended, onStart, onClose }: {
  screen: ScreenId; active: boolean; suspended: boolean; onStart: () => void; onClose: () => void
}) {
  const [stops, setStops] = useState<ScreenStop[]>([])
  const [index, setIndex] = useState(0)
  const [available, setAvailable] = useState(false)
  const target = useRef<HTMLElement | null>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const signature = useRef("")
  const current = stops[Math.min(index, Math.max(0, stops.length - 1))]

  useEffect(() => {
    if (!active || suspended) return
    const content = document.querySelector<HTMLElement>(".assisted-workspace__content")
    if (!content) return
    function visible(selector: string) {
      return Array.from(content!.querySelectorAll<HTMLElement>(selector)).find((node) => node.getClientRects().length > 0 && !node.matches(":disabled") && !node.closest('dialog:not([open]), [inert]'))
    }
    function scan() {
      target.current?.removeAttribute("data-guided")
      target.current = null
      if (document.querySelector("dialog[open]")) { setAvailable(false); return }
      const restricted = visible(".restricted-panel")
      const state = visible(".empty-state, .worklist-system-state .alert--error, .locator-state .alert--error, .document-state .alert--error")
      const steps: ScreenStop[] = restricted ? [{ id: "restricted", selector: ".restricted-panel", title: "Acceso limitado en esta pantalla", text: "Tu perfil o la condición del registro no permite esta acción. La orientación no concede permisos; utiliza las opciones de retorno disponibles." }] : screenTours[screen].filter((item) => visible(item.selector))
      if (!restricted && state) steps.unshift({ id: "state", selector: ".empty-state, .worklist-system-state .alert--error, .locator-state .alert--error, .document-state .alert--error", title: "Comprueba el estado de la pantalla", text: "Este bloque explica una ausencia, restricción o fallo. Revisa su mensaje y las opciones de recuperación disponibles; no significa que se haya completado una tarea." })
      if (steps.length === 0) steps.push({ id: "context", selector: "h1", title: screenHelp[screen].title, text: "Revisa la información y el estado disponibles. La orientación no cambia registros ni habilita acciones ausentes." })
      const nextSignature = steps.map((item) => item.id).join("|")
      const changed = nextSignature !== signature.current
      if (changed) { signature.current = nextSignature; setStops(steps); setIndex(0) }
      const chosen = changed ? steps[0] : steps[Math.min(index, steps.length - 1)]
      const node = chosen && visible(chosen.selector)
      if (node) { target.current = node; node.setAttribute("data-guided", "true") }
      setAvailable(Boolean(node))
    }
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "disabled"] })
    window.addEventListener("resize", scan)
    return () => { observer.disconnect(); window.removeEventListener("resize", scan); target.current?.removeAttribute("data-guided"); target.current = null }
  }, [screen, active, suspended, index])

  useEffect(() => {
    if (!active) return
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented && !suspended && !document.querySelector("dialog[open]")) { event.preventDefault(); close() }
    }
    document.addEventListener("keydown", escape)
    return () => document.removeEventListener("keydown", escape)
  }, [active, suspended, onClose])

  function close() {
    onClose()
    requestAnimationFrame(() => launcher.current?.focus())
  }
  function show() {
    const node = target.current
    if (!node) return
    node.scrollIntoView({ block: "center", behavior: "instant" })
    if (!node.hasAttribute("tabindex") && !node.matches("button, input, select, textarea, a[href]")) {
      node.tabIndex = -1
      node.addEventListener("blur", () => node.removeAttribute("tabindex"), { once: true })
    }
    node.focus({ preventScroll: true })
  }
  function move(next: number) {
    setIndex(next)
    requestAnimationFrame(() => title.current?.focus())
  }

  return <section className={`screen-assistance${active ? " screen-assistance--active" : ""}`} data-screen-assistance={screen} aria-label="Orientación de esta pantalla">
    {!active ? <>
      <span><CircleHelp size={17} aria-hidden="true" /> {screen === "detail" ? "¿Cómo continuar en este expediente?" : "¿Qué puedes hacer en esta pantalla?"}</span>
      <button ref={launcher} type="button" className="text-button" onClick={() => { onStart(); requestAnimationFrame(() => title.current?.focus()) }}>Explorar esta pantalla <ArrowRight size={15} aria-hidden="true" /></button>
    </> : <>
      <div className="screen-assistance__header"><span>{screenHelp[screen].title} · Orientación opcional</span><button className="help-close" type="button" onClick={close} aria-label="Cerrar orientación de pantalla"><X size={18} aria-hidden="true" /></button></div>
      <div className="screen-assistance__step">
        <div><p className="screen-assistance__counter" role="status">Punto {Math.min(index + 1, stops.length)} de {stops.length}</p><h2 ref={title} tabIndex={-1}>{current?.title ?? "Preparando orientación"}</h2><p>{current?.text}</p></div>
        <Button variant="secondary" icon={<LocateFixed size={16} aria-hidden="true" />} onClick={show} disabled={!available || suspended}>Mostrar el elemento</Button>
      </div>
      <div className="screen-assistance__actions"><Button variant="quiet" disabled={index === 0} icon={<ArrowLeft size={15} aria-hidden="true" />} onClick={() => move(index - 1)}>Punto anterior</Button>{index < stops.length - 1 ? <Button variant="quiet" onClick={() => move(index + 1)} icon={<ArrowRight size={15} aria-hidden="true" />}>Siguiente elemento</Button> : <Button variant="quiet" onClick={close}>Terminar orientación</Button>}</div>
    </>}
  </section>
}
