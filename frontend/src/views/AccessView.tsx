import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react"
import type { Actor } from "../components/AppShell"
import { Brand } from "../components/Brand"
import { Button } from "../components/system"
import { demoPassword, roles } from "../data/assistance"

export function AccessView({ initialRole, notice, onBack, onEnter }: {
  initialRole: Actor; notice: string; onBack: () => void; onEnter: (actor: Actor) => void
}) {
  const [actor, setActor] = useState(initialRole)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const userRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!username.trim() || !password) {
      setError("Completa el usuario y la contraseña de demostración.")
      return
    }
    const match = (Object.keys(roles) as Actor[]).find((role) => roles[role].username === username.trim().toLowerCase())
    if (!match || password !== demoPassword) {
      setError("Los datos no coinciden con una cuenta demo. Usa «Completar datos de prueba» y vuelve a intentarlo.")
      return
    }
    setError("")
    setBusy(true)
    timerRef.current = setTimeout(() => onEnter(match), 450)
  }

  return (
    <main className="access-page">
      <aside className="access-story"><Brand light /><div><h2>El contexto<br />para continuar<br /><span>tu trabajo.</span></h2><p>Expedientes, documentos y actuaciones conectados en un mismo espacio.</p></div><span><ShieldCheck size={18} aria-hidden="true" /> Uso exclusivo del personal autorizado</span></aside>
      <section className="access-content" aria-labelledby="access-title">
        <button className="text-button access-back" onClick={onBack} type="button"><ArrowLeft size={17} aria-hidden="true" /> Volver a la presentación</button>
        <div className="access-form-wrap">
          <LockKeyhole className="access-lock" size={30} aria-hidden="true" />
          <h1 id="access-title">Accede a tu espacio</h1><p className="access-subtitle">Continúa con una cuenta de demostración.</p>
          <div className="demo-disclosure"><strong>Acceso de demostración</strong><p>No introduzcas credenciales reales. Esta pantalla no autentica usuarios ni conecta con servicios institucionales.</p></div>
          {notice && <p className="access-session-note" role="status">{notice}</p>}
          <form onSubmit={submit} noValidate aria-busy={busy}>
            {error && <div className="access-error" role="alert" tabIndex={-1} ref={errorRef}>{error}<div><button type="button" className="text-button" onClick={() => (!username.trim() ? userRef : passwordRef).current?.focus()}>Revisar los campos</button></div></div>}
            <label className="access-field" htmlFor="demo-user">Usuario de demostración</label>
            <input id="demo-user" ref={userRef} value={username} onChange={(e) => { setUsername(e.target.value); setError("") }} autoComplete="username" spellCheck={false} autoCapitalize="none" aria-describedby="demo-user-hint" aria-invalid={Boolean(error)} disabled={busy} />
            <small id="demo-user-hint" className="field-hint">Ejemplo: {roles[actor].username}</small>
            <label className="access-field" htmlFor="demo-password">Contraseña de demostración</label>
            <div className="password-control"><input id="demo-password" ref={passwordRef} type={visible ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError("") }} autoComplete="current-password" aria-invalid={Boolean(error)} disabled={busy} /><button type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>
            <button type="button" className="text-button recovery-link" onClick={() => setRecovery(!recovery)} aria-expanded={recovery} aria-controls="access-recovery">¿Necesitas ayuda para ingresar?</button>
            {recovery && <p id="access-recovery" className="recovery-info">Para probar esta versión, completa los datos de prueba de abajo. No se envían correos de recuperación. La recuperación institucional se definirá al integrar el servicio real.</p>}
            <Button type="submit" className="access-submit" disabled={busy} icon={<ArrowRight size={18} aria-hidden="true" />}>{busy ? "Abriendo demostración…" : "Entrar a la demostración"}</Button>
            <span className="sr-only" role="status">{busy ? "Preparando el espacio de demostración" : ""}</span>
          </form>
          <details className="demo-accounts" open><summary>Datos de prueba por perfil</summary><label htmlFor="access-role">Perfil de demostración</label><select id="access-role" value={actor} onChange={(e) => setActor(e.target.value as Actor)}>{(Object.keys(roles) as Actor[]).map((role) => <option key={role} value={role}>{roles[role].name} · {roles[role].code}</option>)}</select><p>Usuario: <strong>{roles[actor].username}</strong><br />Contraseña: <strong>{demoPassword}</strong></p><Button disabled={busy} variant="secondary" onClick={() => { setUsername(roles[actor].username); setPassword(demoPassword); setError(""); userRef.current?.focus() }}>Completar datos de prueba</Button></details>
          <p className="access-privacy">No guardamos contraseñas. Solo se recuerda si omitiste o completaste la orientación de cada perfil en este navegador.</p>
        </div>
      </section>
    </main>
  )
}
