import { test, expect, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { screenTours } from "../src/data/screen-tours"
import { screenHelp } from "../src/data/help-context"

async function enter(page: Page, username = "demo.analista") {
  await page.goto("/")
  await page.getByRole("button", { name: "Acceder al sistema", exact: true }).click()
  await page.getByLabel("Usuario de demostración", { exact: true }).fill(username)
  await page.getByLabel("Contraseña de demostración", { exact: true }).fill("trasu-demo")
  await page.getByRole("button", { name: "Entrar a la demostración", exact: true }).click()
  await page.getByRole("button", { name: "Ahora no", exact: true }).click()
}
const orientation = (page: Page) => page.getByRole("region", { name: "Orientación de esta pantalla", exact: true })

test("cada módulo y subflujo declara su orientación propia", () => {
  expect(Object.keys(screenTours).sort()).toEqual(Object.keys(screenHelp).sort())
  expect(Object.keys(screenTours)).toHaveLength(22)
  for (const stops of Object.values(screenTours)) {
    expect(stops.length).toBeGreaterThanOrEqual(3)
    expect(new Set(stops.map((item) => item.id)).size).toBe(stops.length)
    for (const item of stops) { expect(item.selector).toBeTruthy(); expect(item.text.length).toBeGreaterThan(35) }
  }
})

test("orientación visible: Ver expediente → detalle → documentos, sin buscarla en Ayuda", async ({ page }, info) => {
  await enter(page)
  await expect(orientation(page).getByRole("button", { name: "Explorar esta pantalla", exact: true })).toBeVisible()
  await orientation(page).getByRole("button", { name: "Explorar esta pantalla", exact: true }).click()
  await expect(orientation(page).getByRole("heading", { name: "¿Para qué sirve Ver expediente?", exact: true })).toBeVisible()
  await orientation(page).getByRole("button", { name: "Mostrar el elemento", exact: true }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pendientes y seguimiento")
  await expect(page.locator('[data-guided="true"]')).toBeFocused()
  await page.locator('[data-guided="true"]').click()
  await expect(orientation(page)).toHaveAttribute("data-screen-assistance", "detail")
  await expect(orientation(page).getByRole("heading", { name: "Ya estás dentro del expediente", exact: true })).toBeVisible()
  await orientation(page).getByRole("button", { name: "Siguiente elemento", exact: true }).click()
  await expect(orientation(page).getByRole("heading", { name: "Documentos y versiones", exact: true })).toBeVisible()
  await orientation(page).getByRole("button", { name: "Mostrar el elemento", exact: true }).click()
  await expect(page.getByRole("button", { name: "Abrir documentos y versiones", exact: true })).toBeFocused()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("DEMO-TRASU-001")
  await orientation(page).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `.impeccable/review/screen-orientation-${info.project.name}.png`, fullPage: true })
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
  expect(results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([])
  await page.getByRole("button", { name: "Abrir documentos y versiones", exact: true }).click()
  await expect(orientation(page)).toHaveAttribute("data-screen-assistance", "documents")
  await expect(orientation(page).getByRole("heading", { name: "Documentos y versiones", exact: true })).toBeVisible()
  await orientation(page).getByRole("button", { name: "Cerrar orientación de pantalla", exact: true }).click()
  await expect(page.locator('[data-guided="true"]')).toHaveCount(0)
  await expect(orientation(page).getByRole("button", { name: "Explorar esta pantalla", exact: true })).toBeFocused()
})

test("orientación en formulario conserva lo escrito y no registra una solicitud", async ({ page }) => {
  await enter(page)
  await page.getByRole("row").filter({ hasText: "DEMO-TRASU-001" }).getByRole("button", { name: "Ver expediente", exact: true }).click()
  await expect(orientation(page).getByRole("button", { name: "Explorar esta pantalla", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Solicitar reasignación", exact: true }).click()
  const reason = page.getByRole("textbox", { name: "Motivo obligatorio", exact: true })
  await reason.fill("Motivo que debe conservarse al consultar la orientación.")
  await orientation(page).getByRole("button", { name: "Explorar esta pantalla", exact: true }).click()
  await expect(orientation(page)).toHaveAttribute("data-screen-assistance", "request")
  await orientation(page).getByRole("button", { name: "Siguiente elemento", exact: true }).click()
  await orientation(page).getByRole("button", { name: "Mostrar el elemento", exact: true }).click()
  await expect(reason).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(reason).toHaveValue("Motivo que debe conservarse al consultar la orientación.")
  await expect(page.getByRole("button", { name: "Enviar solicitud", exact: true })).toBeVisible()
  await expect(page.getByRole("status").filter({ hasText: "Se creó la solicitud" })).toHaveCount(0)
})

test("estados vacío y error no ofrecen filas ausentes como acciones disponibles", async ({ page }) => {
  await enter(page)
  await page.getByText("Simular estados", { exact: true }).click()
  await page.getByRole("button", { name: "Probar estado vacío", exact: true }).click()
  await page.getByText("Simular estados", { exact: true }).click()
  await orientation(page).getByRole("button", { name: "Explorar esta pantalla", exact: true }).click()
  await expect(orientation(page)).toContainText("Comprueba el estado de la pantalla")
  await expect(orientation(page)).not.toContainText("¿Para qué sirve Ver expediente?")
  await expect(page.getByRole("button", { name: "Ver expediente", exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "Volver a consultar", exact: true }).click()
  await expect(orientation(page)).toContainText("¿Para qué sirve Ver expediente?")
  await page.getByText("Simular estados", { exact: true }).click()
  await page.getByRole("button", { name: "Probar error", exact: true }).click()
  await page.getByText("Simular estados", { exact: true }).click()
  await expect(orientation(page)).toContainText("Comprueba el estado de la pantalla")
  await orientation(page).getByRole("button", { name: "Mostrar el elemento", exact: true }).click()
  await expect(page.locator('[data-guided="true"]')).toContainText("No fue posible cargar la bandeja")
})

for (const [username, screen] of [
  ["demo.supervisor", "requests"], ["demo.revisor", "reviews"], ["demo.documentario", "exchanges"],
  ["demo.auditor", "evidence"], ["demo.soporte", "interventions"], ["demo.vocal", "reviews"],
] as const) {
  test(`entrada contextual del perfil ${username}`, async ({ page }) => {
    await enter(page, username)
    await expect(orientation(page)).toHaveAttribute("data-screen-assistance", screen)
    await orientation(page).getByRole("button", { name: "Explorar esta pantalla", exact: true }).click()
    await expect(orientation(page).getByRole("button", { name: "Mostrar el elemento", exact: true })).toBeEnabled()
    if (username === "demo.vocal") {
      await expect(orientation(page)).toContainText("Acceso limitado en esta pantalla")
      await expect(orientation(page)).not.toContainText("¿Para qué sirve Ver expediente?")
      await expect(page.getByRole("button", { name: "Ver expediente", exact: true })).toHaveCount(0)
    }
  })
}
