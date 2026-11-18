import { useEffect, useRef } from "react"
import { ArrowLeft, ArrowRight, Play } from "lucide-react"
import type { Guide } from "../data/task-guides"
import { Button } from "./system"

export function GuideContent({ guide, onBack, onNavigate, onAccompany }: {
  guide: Guide
  onBack: () => void
  onNavigate: () => void
  onAccompany: () => void
}) {
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => { title.current?.focus() }, [])
  return <section className="guide-detail">
    <button className="text-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Todas las guías</button>
    <h3 tabIndex={-1} ref={title}>{guide.title}</h3>
    <p>{guide.description}</p>
    <Button onClick={onAccompany} icon={<Play size={16} aria-hidden="true" />}>Acompañarme en esta tarea</Button>
    <p className="guide-start-note">Localiza los controles reales, a tu ritmo. Puedes pausar o cerrar cuando quieras.</p>
    <details className="guide-reference"><summary>Antes de empezar</summary><p>{guide.entry}</p><p>{guide.caution}</p></details>
    <ol>
      {guide.steps.map((step, index) => <li key={step.title}>
        <details><summary><span className="guide-step-number" aria-hidden="true">{index + 1}</span>{step.title}</summary>
        <p>{step.instruction}</p>
        <div className="guide-step-result">
          <strong>Qué deberías ver</strong>
          <p>{step.result}</p>
          {step.alternative && <><strong>Si tu caso es diferente</strong><p>{step.alternative}</p></>}
        </div>
        </details>
      </li>)}
    </ol>
    <details className="guide-outcome"><summary>Resultado y recuperación</summary>
      <h4>Al terminar</h4><p>{guide.result}</p>
      <h4>Si no puedes continuar</h4><p>{guide.recovery}</p>
    </details>
    <Button variant="secondary" onClick={onNavigate} icon={<ArrowRight size={16} aria-hidden="true" />}>Ir al módulo de inicio</Button>
    <p className="guide-navigation-note">Navegar es opcional. Puedes acompañarte con esta guía sin abandonar la pantalla actual.</p>
  </section>
}
