import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { readSheet } from "read-excel-file/node";
import { parse } from "csv-parse/sync";
import { parsePreliminaryHtml } from "../src/lib/parsers";
import { normalize, round2, totalFor } from "../src/lib/calculations";
import type { Indicator, ReportData } from "../src/lib/types";

const DEFAULT_XLSX = "Z:\\03-Prêmios\\Abep Tic\\Histórico Índice Oferta de Serviços Públicos Digitais\\2026\\IOSPD-2025_detalhado_dimensoes.xlsx";
const DEFAULT_HTML = "C:\\Users\\framos\\Downloads\\Relatorio_Convalidacao_MS (1).html";
const ROOT = path.resolve(import.meta.dirname, "..");

function argument(name: string, fallback: string) {
  const position = process.argv.indexOf(`--${name}`);
  return position >= 0 && process.argv[position + 1] ? process.argv[position + 1] : fallback;
}

const asNumber = (value: unknown) => {
  const parsed = Number(String(value ?? 0).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};
const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const indicatorId = (value: string) => value.match(/\b\d+\.\d+\b/)?.[0] ?? value;
const dimensionId = (value: string) => value.match(/\b[1-5]\b/)?.[0] ?? value.slice(0, 1);
const dimensionNames: Record<string, string> = {
  "1": "Capacidades institucionais",
  "2": "Oferta de serviços digitais",
  "3": "Regulação e políticas públicas",
  "4": "Experiência e inclusão digital",
  "5": "Inovação e inteligência artificial",
};

async function load2025(file: string) {
  const rows = await readSheet(file, "Detalhado");
  const headers = rows[0].map(clean);
  const at = (label: string) => headers.findIndex((header) => header.toUpperCase() === label.toUpperCase());
  const parsed = rows.slice(1).filter((row) => clean(row[at("UF")])).map((row) => ({
    uf: clean(row[at("UF")]),
    dimension: clean(row[at("DIMENSAO")]),
    indicator: clean(row[at("INDICADOR")]),
    score: asNumber(row[at("PONTUAÇÃO RECEBIDA")]),
    maximum: asNumber(row[at("PONTUAÇÃO POSSIVEI")]),
  }));
  const totals = new Map<string, number>();
  for (const row of parsed) totals.set(row.uf, (totals.get(row.uf) ?? 0) + row.score);
  const ranking = [...totals.entries()].filter(([uf]) => /^[A-Z]{2}$/.test(uf) && uf !== "TS").sort((a, b) => b[1] - a[1]);
  const ms = parsed.filter((row) => row.uf === "MS");
  return {
    rows: ms,
    score: round2(ms.reduce((sum, row) => sum + row.score, 0)),
    maximum: round2(ms.reduce((sum, row) => sum + row.maximum, 0)),
    rank: ranking.findIndex(([uf]) => uf === "MS") + 1,
  };
}

async function main() {
  const xlsx = argument("xlsx", DEFAULT_XLSX);
  const html = argument("html", DEFAULT_HTML);
  const [official, preliminaryHtml, scenarioCsv] = await Promise.all([
    load2025(xlsx),
    readFile(html, "utf8"),
    readFile(path.join(ROOT, "data", "estimativas.csv"), "utf8"),
  ]);
  const preliminary = parsePreliminaryHtml(preliminaryHtml);
  const scenarioRows = parse(scenarioCsv, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const overrides = new Map<string, Record<string, string>>(scenarioRows.map((row) => [row.indicador, row]));

  const indicators: Indicator[] = preliminary.map((row) => {
    const id = indicatorId(row.indicator);
    const override = overrides.get(id);
    const bounded = (value: string | undefined, fallback: number) => Math.min(row.maximum, Math.max(row.score, asNumber(value ?? fallback)));
    const status = row.score >= row.maximum ? "comprovado" : row.score === 0 && /não comprovada|não atende/i.test(row.classification) ? "nao-atendido" : "revisao";
    return {
      dimension: dimensionId(row.dimension), id,
      title: row.indicator.replace(id, "").replace(/^\s*[-–—:]\s*/, "") || `Indicador ${id}`,
      classification: row.classification || "Sem classificação",
      current: row.score, maximum: row.maximum,
      conservative: bounded(override?.conservador, row.score),
      likely: bounded(override?.provavel, row.score),
      optimistic: bounded(override?.otimista, row.score),
      rationale: override?.justificativa || (row.score >= row.maximum ? "Pontuação integral reconhecida na avaliação preliminar." : "Mantida a pontuação preliminar por falta de evidência adicional mapeada."),
      status,
    };
  });

  const dimensions = Object.keys(dimensionNames).map((id) => {
    const rows2025 = official.rows.filter((row) => dimensionId(row.dimension) === id);
    const rows2026 = indicators.filter((row) => row.dimension === id);
    return {
      id, name: dimensionNames[id],
      score2025: round2(rows2025.reduce((sum, row) => sum + row.score, 0)),
      max2025: round2(rows2025.reduce((sum, row) => sum + row.maximum, 0)),
      current2026: totalFor(rows2026, "atual"),
      max2026: round2(rows2026.reduce((sum, row) => sum + row.maximum, 0)),
      likely2026: totalFor(rows2026, "provavel"),
    };
  });
  const currentScore = totalFor(indicators, "atual");
  const currentMaximum = round2(indicators.reduce((sum, row) => sum + row.maximum, 0));
  const report: ReportData = {
    generatedAt: "2026-11-19T12:00:00-04:00",
    baseline2025: { score: official.score, maximum: official.maximum, percentage: normalize(official.score, official.maximum), rank: official.rank },
    current2026: {
      score: currentScore, maximum: currentMaximum,
      full: 24,
      review: 19,
      unmet: 1,
    },
    scenarios: {
      conservative: totalFor(indicators, "conservador"),
      likely: totalFor(indicators, "provavel"),
      optimistic: totalFor(indicators, "otimista"),
    },
    dimensions, indicators,
  };
  const generated = path.join(ROOT, "data", "generated");
  await mkdir(generated, { recursive: true });
  await mkdir(path.join(ROOT, "src", "data"), { recursive: true });
  const hash = async (file: string) => createHash("sha256").update(await readFile(file)).digest("hex");
  await Promise.all([
    writeFile(path.join(generated, "iospd-2025.json"), JSON.stringify(official, null, 2)),
    writeFile(path.join(generated, "iospd-2026.json"), JSON.stringify(preliminary, null, 2)),
    writeFile(path.join(generated, "source-manifest.json"), JSON.stringify({ generatedAt: report.generatedAt, sources: [{ name: "IOSPD 2025 detalhado", sha256: await hash(xlsx) }, { name: "Relatório de Convalidação IOSPD 2026", sha256: await hash(html) }] }, null, 2)),
    writeFile(path.join(ROOT, "src", "data", "report-data.json"), JSON.stringify(report, null, 2)),
  ]);
  console.log(JSON.stringify({ indicators: indicators.length, baseline2025: report.baseline2025, current2026: report.current2026, scenarios: report.scenarios }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
