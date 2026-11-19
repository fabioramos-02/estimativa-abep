export type Scenario = "atual" | "conservador" | "provavel" | "otimista";

export type Indicator = {
  dimension: string;
  id: string;
  title: string;
  classification: string;
  current: number;
  maximum: number;
  conservative: number;
  likely: number;
  optimistic: number;
  rationale: string;
  status: "comprovado" | "revisao" | "nao-atendido";
};

export type DimensionSummary = {
  id: string;
  name: string;
  score2025: number;
  max2025: number;
  current2026: number;
  max2026: number;
  likely2026: number;
};

export type ReportData = {
  generatedAt: string;
  baseline2025: { score: number; maximum: number; percentage: number; rank: number };
  current2026: { score: number; maximum: number; full: number; review: number; unmet: number };
  scenarios: { conservative: number; likely: number; optimistic: number };
  dimensions: DimensionSummary[];
  indicators: Indicator[];
};
