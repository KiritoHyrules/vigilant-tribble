import { test, expect } from "@playwright/test"

for (const state of ["pausada", "finalizada"] as const) {
  test(`la guía ${state} conserva el acceso a la orientación de pantalla`, async ({ page }, info) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Acceder al sistema", exact: true }).click()
    await page.getByLabel("Usuario de demostración", { exact: true }).fill("demo.analista")
    await page.getByLabel("Contraseña de demostración", { exact: true }).fill("trasu-demo")
    await page.getByRole("button", { name: "Entrar a la demostración", exact: true }).click()
    await page.getByRole("button", { name: "Ahora no", exact: true }).click()
    await page.getByRole("button", { name: "Ayuda y guías", exact: true }).click()
    const help = page.getByRole("dialog", { name: "Ayuda y guías", exact: true })
    await help.getByRole("button", { name: /Abrir un expediente y elegir cómo continuar/ }).click()
    await help.getByRole("button", { name: "Acompañarme en esta tarea", exact: true }).click()
    const companion = page.getByRole("complementary", { name: "Guía durante la tarea", exact: true })
    if (state === "pausada") {
      await companion.getByRole("button", { name: "Pausar guía", exact: true }).click()
      await expect(companion).toContainText("Guía en pausa")
    } else {
      for (let index = 0; index < 3; index++) await companion.getByRole("button", { name: "Siguiente paso", exact: true }).click()
      await companion.getByRole("button", { name: "Terminar guía", exact: true }).click()
      await expect(companion).toContainText("Recorrido revisado")
    }
    await expect(companion.getByRole("button", { name: "Conocer esta pantalla", exact: true })).toBeVisible()
    if (state === "pausada") await page.screenshot({ path: `.impeccable/review/companion-paused-${info.project.name}.png`, fullPage: true })
    await companion.getByRole("button", { name: "Conocer esta pantalla", exact: true }).click()
    await expect(companion).toHaveCount(0)
    const orientation = page.getByRole("region", { name: "Orientación de esta pantalla", exact: true })
    await expect(orientation.getByRole("heading", { name: "¿Para qué sirve Ver expediente?", exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pendientes y seguimiento")
    await expect(page.getByRole("row").filter({ hasText: "DEMO-TRASU-001" })).toBeVisible()
  })
}
