export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`portal-brand ${light ? "portal-brand--light" : ""}`}>
      <span className="portal-brand__mark" aria-hidden="true">T</span>
      <span><strong>TRASU</strong><small>Gestión y seguimiento interno</small></span>
    </span>
  )
}
