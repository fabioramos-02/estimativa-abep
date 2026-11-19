import { load } from "cheerio";

export type PreliminaryRow = {
  dimension: string;
  indicator: string;
  answer: string;
  classification: string;
  justification: string;
  score: number;
  maximum: number;
};

const text = (value: unknown) => String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const number = (value: unknown) => {
  const parsed = Number(String(value ?? "0").replace(",", ".").replace("-", "0"));
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parsePreliminaryHtml(html: string): PreliminaryRow[] {
  let payload: { data?: unknown[][]; container?: string } | undefined;
  const findPayload = (value: unknown): { data?: unknown[][]; container?: string } | undefined => {
    if (!value || typeof value !== "object") return undefined;
    const object = value as Record<string, unknown>;
    if (Array.isArray(object.data) && typeof object.container === "string" && object.container.includes("Valor do indicador")) {
      return object as { data?: unknown[][]; container?: string };
    }
    for (const child of Object.values(object)) {
      const found = findPayload(child);
      if (found) return found;
    }
    return undefined;
  };

  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    if (payload) break;
    const raw = match[1];
    try {
      payload = findPayload(JSON.parse(raw));
    } catch {
      // Scripts de bibliotecas não são o widget de dados.
    }
  }

  if (!payload?.data || !payload.container) throw new Error(`Tabela de convalidação não encontrada no HTML (${scripts.length} blocos JSON).`);
  const table = load(payload.container);
  const headers = table("th").map((_, element) => table(element).text().trim()).get();
  const columns = payload.data;
  const index = (label: string) => headers.indexOf(label);
  const rowCount = Math.max(...columns.map((column) => column.length));

  return Array.from({ length: rowCount }, (_, row) => ({
    dimension: text(columns[index("Dimensão")]?.[row]),
    indicator: text(columns[index("Indicador")]?.[row]),
    answer: text(columns[index("Resposta da UF")]?.[row]),
    classification: text(columns[index("Classificação recebida")]?.[row]),
    justification: text(columns[index("Justificativa (por que resposta recebeu essa classificação)")]?.[row]),
    score: number(columns[index("Nota")]?.[row]),
    maximum: number(columns[index("Valor do indicador")]?.[row]),
  }));
}
