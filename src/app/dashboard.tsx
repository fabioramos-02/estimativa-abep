"use client";

import { useMemo, useState } from "react";
import type { ReportData } from "@/lib/types";
import { normalize, round2 } from "@/lib/calculations";
import { logout } from "./actions";

type Changes = { summary: { indicators2026: number; indicators2027: number; maintained: number; adjusted: number; excluded: number; new: number }; dimensions: { id: string; name: string; before: number; after: number; weight: number }[]; comments: string[] };
const score = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = (value: number) => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function Bar({ value, maximum = 100, tone = "primary", label }: { value: number; maximum?: number; tone?: string; label: string }) {
  const width = Math.max(0, Math.min(100, (value / maximum) * 100));
  return <div className="bar" role="img" aria-label={`${label}: ${score(value)} de ${score(maximum)}`}><span className={`bar-fill ${tone}`} style={{ width: `${width}%` }} /></div>;
}

export function Dashboard({ report, changes }: { report: ReportData; changes: Changes }) {
  const [dimension, setDimension] = useState("todas");
  const [query, setQuery] = useState("");
  const opportunity = round2(report.scenarios.likely - report.current2026.score);
  const indicators = useMemo(() => report.indicators.filter((item) => (dimension === "todas" || item.dimension === dimension) && (`${item.id} ${item.title} ${item.rationale}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")))), [dimension, query, report.indicators]);
  const topOpportunities = [...report.indicators].sort((a, b) => (b.likely - b.current) - (a.likely - a.current)).slice(0, 5);

  return <>
    <header className="gov-header"><div className="header-inner"><div className="brand-lockup"><span className="brand-mark">MS</span><span>Governo de Mato Grosso do Sul<br /><strong>SETDIG</strong></span></div><form action={logout}><button className="logout" type="submit">Sair</button></form></div></header>
    <main id="conteudo">
      <section className="hero section" aria-labelledby="title">
        <div className="hero-title"><div><p className="eyebrow">IOSPD · estimativa interna · corte em 19/11/2026</p><h1 id="title">Estimativa estratégica da pontuação de Mato Grosso do Sul</h1></div><span className="status-pill">Em convalidação</span></div>
        <div className="verdict"><div><span className="verdict-label">Leitura executiva</span><p>A estimativa provável é de <strong>{score(report.scenarios.likely)} pontos</strong>. A revisão das evidências pode acrescentar <strong>{score(opportunity)} pontos</strong> à avaliação preliminar.</p></div><a className="button print-hide" href="#prioridades">Ver prioridades</a></div>
        <div className="overview-grid">
          <article className="score-card primary-card"><span>Estimativa provável · 2026</span><strong>{score(report.scenarios.likely)}</strong><Bar value={report.scenarios.likely} maximum={report.current2026.maximum} label="Estimativa provável" /><small>de {score(report.current2026.maximum)} pontos · cenário interno</small></article>
          <article className="score-card"><span>Resultado oficial · 2025</span><strong>{percent(report.baseline2025.percentage)}</strong><small>{score(report.baseline2025.score)} de {score(report.baseline2025.maximum)} · {report.baseline2025.rank}º entre as UFs</small></article>
          <article className="score-card"><span>Avaliação preliminar · 2026</span><strong>{score(report.current2026.score)}</strong><small>{report.current2026.full} itens pontuados · {report.current2026.review} em revisão</small></article>
          <article className="score-card"><span>Faixa estimada · 2026</span><strong>{score(report.scenarios.conservative)}–{score(report.scenarios.optimistic)}</strong><small>conservador a otimista · não é resultado oficial</small></article>
        </div>
      </section>

      <section className="section" id="prioridades" aria-labelledby="prioridades-title"><div className="section-heading"><div><p className="eyebrow">Decisão imediata</p><h2 id="prioridades-title">Três frentes que concentram o resultado</h2></div><p>Priorizar evidências com ganho possível e dependências já identificadas.</p></div><div className="priority-grid">
        <article className="priority"><span className="priority-number">01</span><h3>Comprovar serviços em andamento</h3><p>Avançar nas APIs de acompanhamento por CPF e no teste amostral de serviços do indicador 1.4.</p><span className="tag risk">Risco alto</span></article>
        <article className="priority"><span className="priority-number">02</span><h3>Fechar evidências encaminhadas</h3><p>Consolidar agendamento do DETRAN, CadÚnico, cibersegurança e continuidade omnicanal.</p><span className="tag opportunity">Ganho possível</span></article>
        <article className="priority"><span className="priority-number">03</span><h3>Separar 2026 da proposta 2027</h3><p>Questionar critérios novos sem incorporá-los à estimativa vigente antes da decisão da ABEP.</p><span className="tag attention">Acompanhar</span></article>
      </div></section>

      <section className="section alt" aria-labelledby="cenarios-title"><div className="section-heading"><div><p className="eyebrow">Cenários 2026</p><h2 id="cenarios-title">A revisão pode elevar o resultado preliminar</h2></div><p>Os cenários não antecipam a decisão do Comitê Avaliador.</p></div><div className="scenario-list">
        {[["Avaliação preliminar", report.current2026.score, "neutral", "Pontuação registrada no relatório de convalidação"], ["Conservador", report.scenarios.conservative, "secondary", "Somente ganhos com evidência mais direta"], ["Provável", report.scenarios.likely, "primary", "Evidências e ajustes com chance razoável de aceite"], ["Otimista", report.scenarios.optimistic, "success", "Limite superior se todas as revisões mapeadas forem aceitas"]].map(([label, value, tone, note]) => <div className="scenario-row" key={String(label)}><div><strong>{label}</strong><small>{note}</small></div><Bar value={Number(value)} maximum={report.current2026.maximum} tone={String(tone)} label={String(label)} /><b>{score(Number(value))}</b></div>)}
      </div></section>

      <section className="section" aria-labelledby="dimensoes-title"><div className="section-heading"><div><p className="eyebrow">Leitura por dimensão</p><h2 id="dimensoes-title">Onde está a maior distância para o potencial de 2026</h2></div><p>Percentuais normalizados. As metodologias de 2025 e 2026 são diferentes.</p></div><div className="dimension-grid">
        {report.dimensions.map((item) => <article className="dimension-card" key={item.id}><div className="dimension-title"><span>D{item.id}</span><h3>{item.name}</h3></div><div className="dimension-stat"><span>2025 oficial</span><b>{percent(normalize(item.score2025, item.max2025))}</b></div><Bar value={normalize(item.score2025, item.max2025)} label={`Dimensão ${item.id}, 2025`} tone="neutral" /><div className="dimension-stat"><span>2026 provável</span><b>{percent(normalize(item.likely2026, item.max2026))}</b></div><Bar value={normalize(item.likely2026, item.max2026)} label={`Dimensão ${item.id}, 2026 provável`} /></article>)}
      </div></section>

      <section className="section alt" aria-labelledby="oportunidades-title"><div className="section-heading"><div><p className="eyebrow">Foco da convalidação</p><h2 id="oportunidades-title">Maiores oportunidades mapeadas</h2></div><p>Ordenadas pelo ganho no cenário provável.</p></div><div className="opportunity-list">{topOpportunities.map((item) => <article key={item.id}><span className="indicator-id">{item.id}</span><div><h3>{item.title}</h3><p>{item.rationale}</p></div><strong>+{score(item.likely - item.current)}</strong></article>)}</div></section>

      <section className="section" aria-labelledby="mudancas-title"><div className="section-heading"><div><p className="eyebrow">Proposta ABEP · 2027</p><h2 id="mudancas-title">Mudanças monitoradas, sem impacto numérico na estimativa 2026</h2></div><p>A proposta reduz o total de indicadores, mas altera critérios e pesos.</p></div><div className="change-summary"><div><strong>{changes.summary.indicators2027}</strong><span>indicadores propostos</span></div><div><strong>{changes.summary.adjusted}</strong><span>ajustados ou unificados</span></div><div><strong>{changes.summary.new}</strong><span>novos</span></div><div><strong>{changes.summary.excluded}</strong><span>excluídos</span></div></div><div className="change-content"><article><h3>Pontos registrados pela SETDIG/MS</h3><ul>{changes.comments.map((comment) => <li key={comment}>{comment}</li>)}</ul></article><aside><h3>Orientação</h3><p>Manter uma trilha específica para 2027: validar mudanças metodológicas, preparar evidências estruturantes e não misturar a proposta futura com a convalidação em curso.</p></aside></div></section>

      <section className="section details print-hide" aria-labelledby="detalhes-title"><div className="section-heading"><div><p className="eyebrow">Rastreabilidade</p><h2 id="detalhes-title">Detalhamento dos 44 indicadores</h2></div><p>Cada ajuste tem justificativa explícita.</p></div><div className="filters"><label>Dimensão<select value={dimension} onChange={(event) => setDimension(event.target.value)}><option value="todas">Todas</option>{report.dimensions.map((item) => <option value={item.id} key={item.id}>D{item.id} · {item.name}</option>)}</select></label><label>Buscar indicador<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: API, DETRAN, 1.4" /></label></div><div className="table-wrap"><table><caption>{indicators.length} indicadores exibidos</caption><thead><tr><th>Indicador</th><th>Preliminar</th><th>Conservador</th><th>Provável</th><th>Otimista</th><th>Justificativa</th></tr></thead><tbody>{indicators.map((item) => <tr key={item.id}><th><span>{item.id}</span>{item.title}</th><td>{score(item.current)}</td><td>{score(item.conservative)}</td><td><strong>{score(item.likely)}</strong></td><td>{score(item.optimistic)}</td><td>{item.rationale}</td></tr>)}</tbody></table></div></section>

      <section className="section methodology" aria-labelledby="metodo-title"><p className="eyebrow">Método e fontes</p><h2 id="metodo-title">Como ler esta estimativa</h2><div><p><strong>2025:</strong> resultado oficial detalhado por dimensão, usado apenas como referência histórica.</p><p><strong>2026:</strong> avaliação preliminar do Relatório de Convalidação e cenários internos construídos por indicador.</p><p><strong>2027:</strong> proposta do Comitê Técnico Externo e comentários “Duda Delgado - SETDIG/MS”; sem pontuação projetada.</p><p><strong>Limite:</strong> a pontuação final depende da análise e decisão da ABEP-TIC. Atualizado em 19/11/2026.</p></div></section>
    </main>
    <footer><div>Governo de Mato Grosso do Sul · Secretaria-Executiva de Transformação Digital</div><div>Relatório interno · IOSPD 2026</div></footer>
  </>;
}
