import test from "node:test";
import assert from "node:assert/strict";
import report from "../src/data/report-data.json";
import { normalize, totalFor } from "../src/lib/calculations";
import type { ReportData } from "../src/lib/types";

const data = report as ReportData;

test("mantém a linha de base oficial de 2025", () => {
  assert.equal(data.baseline2025.score, 191.25);
  assert.equal(data.baseline2025.maximum, 225.5);
  assert.equal(data.baseline2025.rank, 9);
  assert.equal(normalize(data.baseline2025.score, data.baseline2025.maximum), 84.81);
});

test("importa os 44 indicadores e a avaliação preliminar", () => {
  assert.equal(data.indicators.length, 44);
  assert.equal(totalFor(data.indicators, "atual"), 49.34);
  assert.equal(data.current2026.maximum, 99.92);
});

test("cenários são ordenados e reproduzíveis", () => {
  assert.equal(totalFor(data.indicators, "conservador"), 65.73);
  assert.equal(totalFor(data.indicators, "provavel"), 72.08);
  assert.equal(totalFor(data.indicators, "otimista"), 86.6);
  assert.ok(data.current2026.score <= data.scenarios.conservative);
  assert.ok(data.scenarios.conservative <= data.scenarios.likely);
  assert.ok(data.scenarios.likely <= data.scenarios.optimistic);
});

test("cada indicador tem justificativa e valores dentro do limite", () => {
  for (const item of data.indicators) {
    assert.ok(item.rationale.length > 10, item.id);
    assert.ok(item.current <= item.conservative, item.id);
    assert.ok(item.conservative <= item.likely, item.id);
    assert.ok(item.likely <= item.optimistic, item.id);
    assert.ok(item.optimistic <= item.maximum, item.id);
  }
});
