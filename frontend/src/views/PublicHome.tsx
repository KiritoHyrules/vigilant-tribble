import { ArrowRight, ArrowUpRight, BookOpen, Check, FileCheck2, Files, ShieldCheck } from "lucide-react"
import { useState } from "react"
import type { Actor } from "../components/AppShell"
import { Brand } from "../components/Brand"
import { Button } from "../components/system"
import { roles } from "../data/assistance"

export function PublicHome({ onAccess }: { onAccess: (actor?: Actor) => void }) {
  const [selectedRole, setSelectedRole] = useState<Actor>("analyst")
  return (
    <div className="public-home">
      <a className="skip-link" href="#presentacion">Saltar al contenido</a>
      <header className="public-header portal-container">
        <a href="#presentacion" aria-label="TRASU, inicio"><Brand /></a>
        <nav aria-label="Navegación de presentación">
          <a href="#funciones">La plataforma</a><a href="#orientacion">Orientación</a>
          <Button onClick={() => onAccess()} icon={<ArrowUpRight size={17} aria-hidden="true" />}>Acceder al sistema</Button>
        </nav>
      </header>
      <main id="presentacion" tabIndex={-1}>
        <section className="public-hero portal-container" aria-labelledby="hero-title">
          <div className="public-hero__copy">
            <h1 id="hero-title">Tu trabajo,<br /><span>con el contexto</span><br />que necesitas.</h1>
            <p>Gestión y seguimiento interno de TRASU. Un espacio para consultar expedientes, coordinar la revisión documental y mantener la trazabilidad de cada actuación.</p>
            <div className="public-hero__actions">
              <Button onClick={() => onAccess()} icon={<ArrowRight size={19} aria-hidden="true" />}>Ingresar al espacio de trabajo</Button>
              <a href="#funciones">Conocer la plataforma <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
            <span className="access-note"><ShieldCheck size={17} aria-hidden="true" /> Para personal institucional autorizado</span>
          </div>
          <div className="workflow-board" aria-label="El recorrido de trabajo: expediente, revisión y trazabilidad">
            <div className="workflow-board__top"><span>Un recorrido conectado</span><span>TRASU</span></div>
            <h2>De la consulta<br />al seguimiento.</h2>
            <ol className="workflow-stages">
              <li><span className="stage-symbol"><Files size={22} aria-hidden="true" /></span><div><strong>Ubica el expediente</strong><p>Referencia, estado y responsabilidad.</p></div></li>
              <li><span className="stage-symbol"><FileCheck2 size={22} aria-hidden="true" /></span><div><strong>Trabaja sobre la versión correcta</strong><p>Revisión interna y observaciones.</p></div></li>
              <li><span className="stage-symbol"><ShieldCheck size={22} aria-hidden="true" /></span><div><strong>Conserva la trazabilidad</strong><p>Actuaciones y evidencia disponible.</p></div></li>
            </ol>
            <div className="workflow-board__bottom"><Check size={16} aria-hidden="true" /><span>Cada actuación, con su contexto.</span></div>
          </div>
        </section>
        <section id="funciones" className="public-functions" aria-labelledby="functions-title">
          <div className="portal-container functions-layout">
            <div><h2 id="functions-title">Una plataforma.<br />Trabajo bien conectado.</h2><p>Consulta y actúa desde el espacio que corresponde a tu perfil, sin perder el contexto del expediente.</p></div>
            <div className="function-list">
              <article><Files size={24} aria-hidden="true" /><div><h3>Expedientes y responsabilidades</h3><p>Localiza información, consulta pendientes y sigue las asignaciones y solicitudes de reasignación.</p></div></article>
              <article><FileCheck2 size={24} aria-hidden="true" /><div><h3>Documentos y revisión interna</h3><p>Relaciona cada revisión y observación con su versión documental. Conserva los antecedentes al subsanar.</p></div></article>
              <article><ShieldCheck size={24} aria-hidden="true" /><div><h3>Intercambios y evidencia</h3><p>Distingue registros, resultados y evidencia disponible. Consulta la secuencia de las actuaciones.</p></div></article>
            </div>
          </div>
        </section>
        <section id="orientacion" className="portal-container orientation-section" aria-labelledby="orientation-title">
          <div className="orientation-heading"><h2 id="orientation-title">No necesitas descubrirlo todo<br />el primer día.</h2><p>Un recorrido para empezar. Ayuda cuando la necesitas. Guías breves para las tareas que requieren más atención.</p></div>
          <div className="role-explorer">
            <div className="role-explorer__list" role="group" aria-label="Conocer la orientación por perfil">
              {(Object.keys(roles) as Actor[]).map((actor) => <button key={actor} type="button" aria-pressed={selectedRole === actor} onClick={() => setSelectedRole(actor)}>{roles[actor].name}<ArrowRight size={16} aria-hidden="true" /></button>)}
            </div>
            <div className="role-explorer__detail" aria-live="polite">
              <BookOpen size={30} aria-hidden="true" /><h3>Tu orientación como {roles[selectedRole].name.toLowerCase()}</h3>
              <p>{roles[selectedRole].purpose}</p>
              <ul><li>Recorrido inicial opcional y repetible.</li><li>Ayuda contextual dentro de tu espacio.</li><li>Guías disponibles según tu perfil.</li></ul>
              <Button variant="secondary" onClick={() => onAccess(selectedRole)} icon={<ArrowUpRight size={17} aria-hidden="true" />}>Ir al acceso de demostración</Button>
              <small>Elegir un perfil aquí solo prepara la demostración; no concede permisos institucionales.</small>
            </div>
          </div>
        </section>
        <section className="portal-container public-help" aria-labelledby="public-help-title">
          <h2 id="public-help-title">Antes de ingresar</h2>
          <div>
            <details><summary>¿Quién puede utilizar la plataforma?</summary><p>El sistema está dirigido al personal institucional autorizado. Esta versión es un prototipo con perfiles y datos de demostración; no valida permisos reales.</p></details>
            <details><summary>¿Dónde encuentro ayuda para mi tarea?</summary><p>Dentro del espacio de trabajo encontrarás Ayuda y guías. Allí puedes iniciar un recorrido, consultar pasos por tarea y regresar al trabajo sin perder tu ubicación.</p></details>
            <details><summary>¿Puedo utilizar mis credenciales reales?</summary><p>No. Utiliza únicamente las credenciales de demostración que se muestran en el acceso. La autenticación institucional y su canal de soporte están pendientes de integración.</p></details>
          </div>
        </section>
      </main>
      <footer className="public-footer portal-container"><Brand /><p>Prototipo interactivo · Datos simulados<br />Sin conexión a servicios institucionales</p><a href="#presentacion">Volver arriba ↑</a></footer>
    </div>
  )
}
