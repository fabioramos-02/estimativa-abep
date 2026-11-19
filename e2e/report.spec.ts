import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const password = () => readFileSync("entrega/acesso.txt", "utf8").match(/Senha do relatório:\s*(.+)/)?.[1].trim() ?? "desenvolvimento";

test("protege o relatório e permite acesso com a senha", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Senha de acesso").fill("incorreta");
  await page.getByRole("button", { name: "Acessar relatório" }).click();
  await expect(page.locator(".form-error")).toContainText("Senha incorreta");
  await page.getByLabel("Senha de acesso").fill(password());
  await page.getByRole("button", { name: "Acessar relatório" }).click();
  await page.waitForURL("http://localhost:3000/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Estimativa estratégica");
});

test("filtra os indicadores e não cria rolagem horizontal no celular", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Senha de acesso").fill(password());
  await page.getByRole("button", { name: "Acessar relatório" }).click();
  await page.waitForURL("http://localhost:3000/");
  await page.getByLabel("Buscar indicador").fill("2.8");
  await expect(page.getByText("1 indicadores exibidos")).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
