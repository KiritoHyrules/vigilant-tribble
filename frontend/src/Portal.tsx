import { useEffect, useRef, useState } from "react"
import App from "./App"
import type { Actor } from "./components/AppShell"
import { AccessView } from "./views/AccessView"
import { PublicHome } from "./views/PublicHome"
import "./portal.css"
import "./workspace.css"

export default function Portal() {
  const [page, setPage] = useState<"public" | "access" | "workspace">("public")
  const [actor, setActor] = useState<Actor>("analyst")
  const [notice, setNotice] = useState("")
  const routeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    document.title = page === "public" ? "TRASU · Presentación" : page === "access" ? "TRASU · Acceso de demostración" : "TRASU · Espacio de trabajo"
    window.scrollTo(0, 0)
    routeRef.current?.focus()
  }, [page])
  return <div className="portal-root" ref={routeRef} tabIndex={-1}>
    {page === "public" ? <PublicHome onAccess={(role) => { setActor(role ?? "analyst"); setNotice(""); setPage("access") }} /> : page === "access" ? <AccessView initialRole={actor} notice={notice} onBack={() => setPage("public")} onEnter={(role) => { setActor(role); setPage("workspace") }} /> : <div className="app-experience"><App initialActor={actor} onLogout={() => { setNotice("La sesión de demostración ha finalizado. Puedes ingresar de nuevo con los datos de prueba."); setPage("access") }} /></div>}
  </div>
}
