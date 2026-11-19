# Estimativa estratégica IOSPD 2026

Relatório executivo interno de Mato Grosso do Sul para acompanhar a convalidação do Índice de Oferta de Serviços Públicos Digitais (IOSPD).

## Atualizar os dados

```powershell
npm.cmd run data:import
```

O importador lê a planilha oficial de 2025, o relatório HTML preliminar de 2026 e os ajustes rastreáveis de `data/estimativas.csv`. As mudanças propostas para 2027 permanecem em uma seção qualitativa separada.

## Executar e validar

```powershell
node scripts/setup-secrets.mjs
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

Variáveis necessárias em produção: `REPORT_PASSWORD_HASH` e `AUTH_SECRET`.
