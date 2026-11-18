import { test, expect, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const roleCases = [
  { value: "analyst", name: "Analista", username: "demo.analista", landing: "Pendientes y seguimiento", guide: "Preparar una versión para revisión" },
  { value: "supervisor", name: "Supervisor", username: "demo.supervisor", landing: "Solicitudes de reasignación", guide: "Evaluar una solicitud de reasignación" },
  { value: "reviewer", name: "Revisor", username: "demo.revisor", landing: "Revisiones pendientes", guide: "Revisar una versión documental" },
  { value: "vocal", name: "Vocal", username: "demo.vocal", landing: "Revisiones pendientes", guide: "Comprender el acceso condicionado" },
  { value: "exchange", name: "Personal documentario", username: "demo.documentario", landing: "Intercambios registrados", guide: "Registrar y dar seguimiento a una salida" },
  { value: "support", name: "Soporte", username: "demo.soporte", landing: "Intervenciones técnicas", guide: "Documentar una intervención técnica" },
  { value: "auditor", name: "Auditor", username: "demo.auditor", landing: "Evidencia y trazabilidad", guide: "Comprobar una actuación y su evidencia" },
]

async function enter(page: Page, username = "demo.analista") {
  await page.goto("/")
  await page.getByRole("button", { name: "Acceder al sistema", exact: true }).click()
  await page.getByLabel("Usuario de demostración", { exact: true }).fill(username)
  await page.getByLabel("Contraseña de demostración", { exact: true }).fill("trasu-demo")
  await page.getByRole("button", { name: "Entrar a la demostración", exact: true }).click()
  await expect(page.getByRole("button", { name: "Ayuda y guías", exact: true })).toBeVisible()
}

test("portada sin datos internos, usable y accesible", async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Tu trabajo, con el contexto que necesitas." })).toBeVisible()
  await expect(page.getByRole("table")).toHaveCount(0)
  await expect(page.getByText("Usuario DEMO-014", { exact: true })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Acceder al sistema", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Auditor", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Tu orientación como auditor" })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
  expect(a11y.violations).toEqual([])
  await page.getByRole("button", { name: "Analista", exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `.impeccable/review/${testInfo.project.name}.png`, fullPage: true })
  expect(errors).toEqual([])
})

test("acceso: errores, mostrar contraseña, datos demo y regreso", async ({ page }, testInfo) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Acceder al sistema", exact: true }).click()
  await page.getByRole("button", { name: "Entrar a la demostración", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("Completa el usuario")
  await expect(page.getByRole("alert")).toBeFocused()
  await page.getByLabel("Usuario de demostración", { exact: true }).fill("demo.analista")
  await page.getByLabel("Contraseña de demostración", { exact: true }).fill("incorrecta")
  await page.getByRole("button", { name: "Entrar a la demostración", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("no coinciden")
  await page.getByRole("button", { name: "Mostrar contraseña", exact: true }).click()
  await expect(page.getByLabel("Contraseña de demostración", { exact: true })).toHaveAttribute("type", "text")
  await page.getByRole("button", { name: "¿Necesitas ayuda para ingresar?" }).click()
  await expect(page.getByText(/No se envían correos de recuperación/)).toBeVisible()
  await page.getByRole("button", { name: "Completar datos de prueba", exact: true }).click()
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
  expect(a11y.violations).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `.impeccable/review/access-${testInfo.project.name}.png`, fullPage: true })
  await page.getByRole("button", { name: "Volver a la presentación", exact: true }).click()
  await expect(page.getByRole("button", { name: "Acceder al sistema", exact: true })).toBeVisible()
})

for (const role of roleCases) {
  test(`perfil ${role.name}: destino, guías y salida`, async ({ page }, testInfo) => {
    await enter(page, role.username)
    await expect(page.getByLabel("Actor de prueba")).toHaveValue(role.value)
    await expect(page.locator(".workspace")).toContainText(role.landing)
    await page.getByRole("button", { name: "Ahora no", exact: true }).click()
    await page.getByRole("button", { name: "Ayuda y guías", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Ayuda y guías", exact: true })
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: new RegExp(role.guide) }).click()
    await expect(dialog.getByRole("heading", { name: role.guide, exact: true })).toBeVisible()
    await expect(dialog.locator(".guide-detail ol > li")).toHaveCount(4)
    await expect(dialog.getByRole("checkbox")).toHaveCount(0)
    await expect(dialog.getByRole("button", { name: "Acompañarme en esta tarea", exact: true })).toBeVisible()
    await dialog.getByText("Resultado y recuperación", { exact: true }).click()
    await expect(dialog.getByText("Al terminar", { exact: true })).toBeVisible()
    await expect(dialog.getByText("Si no puedes continuar", { exact: true })).toBeVisible()
    if (role.value !== "supervisor") await expect(dialog.getByText("Evaluar una solicitud de reasignación", { exact: true })).toHaveCount(0)
    if (role.value === "analyst") {
      const a11y = await new AxeBuilder({ page }).include(".help-drawer").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
      expect(a11y.violations).toEqual([])
      await page.screenshot({ path: `.impeccable/review/help-${testInfo.project.name}.png` })
    }
    await page.keyboard.press("Escape")
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole("button", { name: "Ayuda y guías", exact: true })).toBeFocused()
    await page.getByRole("button", { name: "Salir de la demostración", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Accede a tu espacio", exact: true })).toBeVisible()
    await expect(page.getByRole("status").filter({ hasText: "ha finalizado" })).toBeVisible()
    await expect(page.locator(".app-shell")).toHaveCount(0)
  })
}

test("recorrido opcional, repetible y respetado por perfil", async ({ page }, testInfo) => {
  await enter(page)
  await page.getByRole("button", { name: "Iniciar recorrido", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Tu perfil: Analista", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Siguiente", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Solo el espacio de tu perfil", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Anterior", exact: true }).click()
  await expect(page.getByText("Paso 1 de 4", { exact: true })).toBeVisible()
  await page.screenshot({ path: `.impeccable/review/tour-${testInfo.project.name}.png` })
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Siguiente", exact: true }).click()
  await page.getByRole("button", { name: "Comenzar mi trabajo", exact: true }).click()
  await expect(page.locator(".tour-card")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Ayuda y guías", exact: true })).toBeFocused()
  await expect(page.getByRole("button", { name: "Iniciar recorrido", exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "Ayuda y guías", exact: true }).click()
  await page.getByRole("button", { name: "Repetir recorrido inicial", exact: true }).click()
  await expect(page.getByText("Paso 1 de 4", { exact: true })).toBeVisible()
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Siguiente", exact: true }).click()
  await page.getByRole("button", { name: "Comenzar mi trabajo", exact: true }).click()
  await expect(page.getByRole("button", { name: "Ayuda y guías", exact: true })).toBeFocused()
  await page.getByRole("button", { name: "Ayuda y guías", exact: true }).click()
  await page.getByRole("button", { name: "Repetir recorrido inicial", exact: true }).click()
  await page.getByRole("button", { name: "Omitir recorrido", exact: true }).click()
  await expect(page.getByRole("button", { name: "Ayuda y guías", exact: true })).toBeFocused()
  await page.getByRole("button", { name: "Ayuda y guías", exact: true }).click()
  await page.getByRole("button", { name: "Repetir recorrido inicial", exact: true }).click()
  await page.keyboard.press("Escape")
  await expect(page.locator(".tour-card")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Ayuda y guías", exact: true })).toBeFocused()
  await page.getByLabel("Actor de prueba").selectOption("auditor")
  await expect(page.getByRole("button", { name: "Iniciar recorrido", exact: true })).toBeVisible()
  await page.getByLabel("Actor de prueba").selectOption("analyst")
  await expect(page.getByRole("button", { name: "Iniciar recorrido", exact: true })).toHaveCount(0)
})

test("asistencia sigue operativa sin almacenamiento local", async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error("Storage unavailable") }; Storage.prototype.setItem = () => { throw new Error("Storage unavailable") } })
  await enter(page)
  await page.getByRole("button", { name: "Ahora no", exact: true }).click()
  await page.getByRole("button", { name: "Ayuda y guías", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Ayuda y guías", exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("searchbox", { name: "Buscar una guía de tu perfil" }).fill("sin-coincidencia")
  await expect(dialog.getByText("No encontramos una guía con esos términos.")).toBeVisible()
  await dialog.getByRole("button", { name: "Limpiar búsqueda", exact: true }).click()
  await expect(dialog.getByText(/\d+ guías disponibles para este perfil/)).toBeVisible()
})
