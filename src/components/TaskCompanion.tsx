import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, LocateFixed, Pause, Play, Route, X } from "lucide-react"
import type { Guide } from "../data/task-guides"
import { screenHelp, type ScreenId } from "../data/help-context"
import { targetForScreen } from "../data/guide-targets"
import { Button } from "./system"

export function TaskCompanion({ guide, screen, suspended = false, onClose, onExploreScreen }: {
  guide: Guide; screen: ScreenId; suspended?: boolean; onClose: () => void; onExploreScreen?: () => void
}) {
  const [index, setIndex] = useState(() => Math.max(0, guide.steps.findIndex((step) => step.screen === screen)))
  const [done, setDone] = useState(false)
  const [paused, setPaused] = useState(false)
  const [available, setAvailable] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)
  const target = useRef<HTMLElement | null>(null)
  const previousScreen = useRef(screen)
  const step = guide.steps[index]
  const current = step.screen === screen
  const guidance = targetForScreen(step.screen, guide.id, index)

  useEffect(() => { title.current?.focus() }, [])
  useEffect(() => {
    if (previousScreen.current !== screen && !paused && !done) {
      // A screen transition is orientation evidence, never proof of business completion.
      if (guide.steps[index + 1]?.screen === screen) setIndex(index + 1)
    }
    previousScreen.current = screen
  }, [screen, guide, index, paused, done])

  useEffect(() => {
    if (paused || done || suspended || !current) { setAvailable(false); return }
    const workspace = document.querySelector('.assisted-workspace__content')
    if (!workspace) return
    function locate() {
      target.current?.removeAttribute("data-guided")
      const node = workspace?.querySelector<HTMLElement>(guidance.selector)
      const visible = node && !document.querySelector('dialog[open]') && node.getClientRects().length > 0 && !node.closest('[inert], dialog:not([open])') && !node.matches(':disabled')
      target.current = visible ? node : null
      target.current?.setAttribute("data-guided", "true")
      setAvailable(Boolean(target.current))
    }
    locate()
    const observer = new MutationObserver(locate)
    observer.observe(workspace, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] })
    window.addEventListener("resize", locate)
    return () => { observer.disconnect(); window.removeEventListener("resize", locate); target.current?.removeAttribute("data-guided"); target.current = null }
  }, [guidance.selector, paused, done, suspended, current, screen])

  function showTarget() {
    const node = target.current
    if (!node) return
    node.scrollIntoView({ block: "center", behavior: "instant" })
    const temporaryTabIndex = !node.hasAttribute("tabindex") && !node.matches('button, input, select, textarea, a[href]')
    if (temporaryTabIndex) {
      node.tabIndex = -1
      node.addEventListener("blur", () => node.removeAttribute("tabindex"), { once: true })
    }
    node.focus({ preventScroll: true })
  }

  return <aside className={`task-companion${paused ? " task-companion--paused" : ""}`} aria-label="Guía durante la tarea">
    <div className="task-companion__header">
      <span><Route size={17} aria-hidden="true" /> Acompañamiento opcional</span>
      <div className="companion-controls">
        <button className="help-close" type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "Reanudar guía" : "Pausar guía"}>{paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}</button>
        <button className="help-close" type="button" onClick={onClose} aria-label="Cerrar guía de tarea"><X size={18} aria-hidden="true" /></button>
      </div>
    </div>
    <h2 ref={title} tabIndex={-1}>{guide.title}</h2>
    {onExploreScreen && <button type="button" className="text-button companion-screen-link" onClick={onExploreScreen}>Conocer esta pantalla</button>}
    {paused ? <p>Guía en pausa. Puedes seguir trabajando sin resaltados.</p> : done ? <div className="companion-complete"><Check size={20} aria-hidden="true" /><div><h3>Recorrido revisado</h3><p>No hemos ejecutado ni validado la operación por ti.</p><Button variant="quiet" onClick={() => { setDone(false); setIndex(0) }}>Reiniciar guía de tarea</Button></div></div> : <>
      <div className="companion-step-body">
        <div>
          <p className="companion-counter" role="status">Paso {index + 1} de {guide.steps.length} · {current ? "Estás en la pantalla de este paso" : screenHelp[step.screen].title}</p>
          <h3>{step.title}</h3>
          <p>{current ? guidance.hint : `Continúa en ${screenHelp[step.screen].title}. La guía no cambiará de pantalla por ti.`}</p>
        </div>
        {current && <Button variant="secondary" icon={<LocateFixed size={17} aria-hidden="true" />} onClick={showTarget} disabled={!available}>Mostrar en pantalla</Button>}
      </div>
      <details className="companion-details"><summary>Ver indicaciones y resultado esperado</summary><p>{step.instruction}</p><p><strong>Qué deberías ver: </strong>{step.result}</p>{step.alternative && <p>{step.alternative}</p>}<p>{guide.recovery}</p></details>
      <div className="companion-navigation">
        <span className="companion-location">Pantalla actual: {screenHelp[screen].title}</span>
        <div><Button variant="quiet" disabled={index === 0} onClick={() => setIndex(index - 1)} icon={<ArrowLeft size={15} aria-hidden="true" />}>Anterior</Button><Button variant="quiet" onClick={() => index === guide.steps.length - 1 ? setDone(true) : setIndex(index + 1)} icon={<ArrowRight size={15} aria-hidden="true" />}>{index === guide.steps.length - 1 ? "Terminar guía" : "Siguiente paso"}</Button></div>
      </div>
    </>}
  </aside>
}
