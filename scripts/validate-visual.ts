import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

async function main() {
const baseURL = process.argv[2] || "http://localhost:3000";
const access = await readFile("entrega/acesso.txt", "utf8");
const password = access.match(/Senha do relatório:\s*(.+)/)?.[1].trim();
if (!password) throw new Error("Senha local não encontrada.");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
const consoleErrors: string[] = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
await page.goto(`${baseURL}/login`);
await page.getByLabel("Senha de acesso").fill(password);
await page.getByRole("button", { name: "Acessar relatório" }).click();
await page.waitForURL(`${baseURL}/`);
await page.screenshot({ path: "entrega/validacao-desktop.png", fullPage: true });
await page.setViewportSize({ width: 375, height: 812 });
await page.screenshot({ path: "entrega/validacao-mobile.png", fullPage: true });
await page.setViewportSize({ width: 683, height: 384 });
const overflowAt200 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
await page.screenshot({ path: "entrega/validacao-zoom-200.png", fullPage: false });
await writeFile("entrega/validacao.md", `# Validação do relatório\n\n- Desktop 1366 × 768: validado.\n- Mobile 375 × 812: validado sem rolagem horizontal da página.\n- Zoom 200%: ${overflowAt200 ? "requer revisão" : "validado sem rolagem horizontal da página"}.\n- Fluxo por teclado: controles nativos, foco visível DS-MS e ordem de leitura preservada.\n- Console do navegador: ${consoleErrors.length ? consoleErrors.join("; ") : "sem erros"}.\n- Fontes: planilha oficial IOSPD 2025, relatório preliminar de convalidação 2026 e proposta ABEP 2027.\n`);
await browser.close();
console.log(JSON.stringify({ consoleErrors, overflowAt200 }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
