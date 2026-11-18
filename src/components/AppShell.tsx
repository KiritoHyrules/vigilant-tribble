import type { ReactNode } from "react"
import {
  ArrowLeftRight,
  ChevronLeft,
  ClipboardList,
  CircleHelp,
  FileCheck2,
  LogOut,
  Menu,
  PanelLeftClose,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react"
import { Button, IconButton, SelectField } from "./system"

import type { Actor, NavigationId } from "../types/navigation"

export type { Actor, NavigationId } from "../types/navigation"

export type NavigationItem = {
  id: string
  label: string
  icon: ReactNode
  visible: boolean
}

export const demonstrationNavigation: NavigationItem[] = [
  {
    id: "pending",
    label: "Pendientes y seguimiento",
    icon: <ClipboardList size={19} />,
    visible: true,
  },
  {
    id: "locate",
    label: "Localizar expedientes",
    icon: <Search size={19} />,
    visible: true,
  },
  {
    id: "requests",
    label: "Solicitudes de reasignación",
    icon: <RefreshCw size={19} />,
    visible: true,
  },
  {
    id: "reviews",
    label: "Revisiones pendientes",
    icon: <FileCheck2 size={19} />,
    visible: true,
  },
  {
    id: "exchanges",
    label: "Intercambios registrados",
    icon: <ArrowLeftRight size={19} />,
    visible: true,
  },
  {
    id: "evidence",
    label: "Evidencia y trazabilidad",
    icon: <ShieldCheck size={19} />,
    visible: true,
  },
  {
    id: "interventions",
    label: "Intervenciones técnicas",
    icon: <Wrench size={19} />,
    visible: true,
  },
]

export function AppShell({
  children,
  activeItem,
  actor,
  menuOpen,
  sidebarCollapsed,
  workspaceName,
  onActorChange,
  onNavigate,
  onMenuToggle,
  onSidebarToggle,
  onHelp,
  onTour,
  onLogout,
}: {
  children: ReactNode
  activeItem: NavigationId
  actor: Actor
  menuOpen: boolean
  sidebarCollapsed: boolean
  workspaceName: string
  onActorChange: (actor: Actor) => void
  onNavigate: (item: NavigationId) => void
  onMenuToggle: () => void
  onSidebarToggle: () => void
  onHelp?: () => void
  onTour?: () => void
  onLogout?: () => void
}) {
  const navigation = demonstrationNavigation.filter(
    (item) =>
      item.visible &&
      ((item.id !== "pending" && item.id !== "locate") ||
        actor === "analyst" ||
        actor === "supervisor" ||
        actor === "reviewer" ||
        actor === "exchange") &&
      (item.id !== "requests" || actor === "supervisor") &&
      (item.id !== "reviews" || actor === "reviewer") &&
      (item.id !== "exchanges" || actor === "exchange") &&
      (item.id !== "evidence" || actor === "auditor") &&
      (item.id !== "interventions" || actor === "support"),
  )
  const isSupervisor = actor === "supervisor"
  const isReviewer = actor === "reviewer"
  const isVocal = actor === "vocal"
  const isExchange = actor === "exchange"
  const isSupport = actor === "support"
  const isAuditor = actor === "auditor"

  return (
    <div
      className={`app-shell ${sidebarCollapsed ? "app-shell--collapsed" : ""} ${
        menuOpen ? "app-shell--menu-open" : ""
      }`}
    >
      <a className="skip-link" href="#workspace-main">Saltar al contenido</a>
      <header className="topbar">
        <div className="topbar__brand">
          <IconButton
            className="topbar__menu"
            label={menuOpen ? "Cerrar navegación" : "Abrir navegación"}
            onClick={onMenuToggle}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </IconButton>
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">
              T
            </div>
            <div className="brand-copy">
              <strong>TRASU</strong>
              <span>Gestión y seguimiento interno</span>
            </div>
          </div>
          <div className="topbar__workspace">
            <span>Espacio actual</span>
            <strong>{workspaceName}</strong>
          </div>
        </div>
        <div className="topbar__context">
          <div className="demo-profile-control" data-tour="profile">
            <span>Solo demostración</span>
            <SelectField
              label="Actor de prueba"
              onChange={(event) => onActorChange(event.target.value as Actor)}
              options={[
                { value: "analyst", label: "Analista · STK-02" },
                { value: "supervisor", label: "Supervisor · STK-01" },
                { value: "reviewer", label: "Revisor · STK-03" },
                {
                  value: "vocal",
                  label: "Vocal · STK-04 (condicionado)",
                },
                {
                  value: "exchange",
                  label: "Personal documentario · STK-06",
                },
                {
                  value: "support",
                  label: "Soporte · STK-08 (condicionado)",
                },
                { value: "auditor", label: "Auditor · STK-09" },
              ]}
              value={actor}
            />
          </div>
          <div className="user-summary">
            <div aria-hidden="true" className="avatar">
              {isSupervisor
                ? "S01"
                : isReviewer
                  ? "R03"
                  : isVocal
                    ? "V04"
                    : isExchange
                      ? "I06"
                      : isSupport
                        ? "T08"
                        : isAuditor
                          ? "A09"
                          : "D14"}
            </div>
            <div>
              <strong>
                {isSupervisor
                  ? "Supervisor DEMO-001"
                  : isReviewer
                    ? "Revisor DEMO-003"
                    : isVocal
                      ? "Vocal DEMO-004"
                      : isExchange
                        ? "Personal documentario DEMO-006"
                        : isSupport
                          ? "Soporte DEMO-008"
                          : isAuditor
                            ? "Auditor DEMO-009"
                            : "Usuario DEMO-014"}
              </strong>
              <span>Sesión de demostración · sin autenticación real</span>
            </div>
          </div>
          <Button variant="secondary" aria-label="Ayuda y guías" onClick={onHelp} data-tour="help" icon={<CircleHelp size={18} aria-hidden="true" />}>Ayuda y guías</Button>
          <Button className="tour-header-control" variant="quiet" onClick={onTour}>Recorrido</Button>
          <Button
            disabled={!onLogout}
            onClick={onLogout}
            aria-label="Salir de la demostración"
            icon={<LogOut size={17} />}
            title="Finalizar la sesión de demostración"
            variant="quiet"
          >
            Salir
          </Button>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar__heading">
          <span>Espacio de trabajo</span>
          <IconButton
            className="sidebar__collapse"
            label={
              sidebarCollapsed ? "Expandir navegación" : "Contraer navegación"
            }
            onClick={onSidebarToggle}
          >
            {sidebarCollapsed ? (
              <ChevronLeft className="rotate" size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </IconButton>
        </div>
        <nav aria-label="Navegación principal" className="nav-list" data-tour="navigation">
          {navigation.map((item) => (
            <button
              aria-label={item.label}
              title={sidebarCollapsed ? item.label : undefined}
              aria-current={activeItem === item.id ? "page" : undefined}
              className="nav-item"
              key={item.id}
              onClick={() => onNavigate(item.id as NavigationId)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar__assistance">
          <button type="button" onClick={onHelp} aria-label="Consultar asistencia">
            <CircleHelp size={20} aria-hidden="true" />
            <span><strong>Trabaja con orientación</strong><small>Solo cuando la necesites</small></span>
          </button>
        </div>
        <div className="sidebar__note">
          <span className="sidebar__note-dot" />
          <p>
            Entorno de demostración.<br />Sin conexión institucional.
          </p>
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Cerrar navegación"
          className="sidebar-backdrop"
          onClick={onMenuToggle}
          type="button"
        />
      )}

      <main className="workspace" id="workspace-main" tabIndex={-1} data-tour="workspace">{children}</main>
    </div>
  )
}
