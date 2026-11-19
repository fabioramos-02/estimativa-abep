import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function main() {
  const baseURL = process.argv[2] || process.env.REPORT_URL || "http://localhost:3000";
  const access = await readFile("entrega/acesso.txt", "utf8");
  const password = access.match(/Senha do relatório:\s*(.+)/)?.[1].trim();
  if (!password) throw new Error("Senha não encontrada em entrega/acesso.txt");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Senha de acesso").fill(password);
  await page.getByRole("button", { name: "Acessar relatório" }).click();
  await page.waitForURL(`${baseURL}/`);
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: "entrega/estimativa-iospd-ms-2026-11-19.pdf", format: "A4", printBackground: true, margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" } });
  await browser.close();
  console.log("PDF gerado em entrega/estimativa-iospd-ms-2026-11-19.pdf");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
