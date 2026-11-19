import type { Indicator, Scenario } from "./types";

export const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function scenarioValue(indicator: Indicator, scenario: Scenario): number {
  if (scenario === "atual") return indicator.current;
  if (scenario === "conservador") return indicator.conservative;
  if (scenario === "provavel") return indicator.likely;
  return indicator.optimistic;
}

export function totalFor(indicators: Indicator[], scenario: Scenario): number {
  return round2(indicators.reduce((sum, item) => sum + scenarioValue(item, scenario), 0));
}

export function normalize(score: number, maximum: number): number {
  return maximum === 0 ? 0 : round2((score / maximum) * 100);
}
