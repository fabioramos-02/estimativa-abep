import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const entries = readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1)];
});
for (const [name, value] of entries) {
  const result = spawnSync("vercel.cmd", ["env", "add", name, "production", "--force"], { input: `${value}\n`, encoding: "utf8", shell: true });
  if (result.status !== 0) throw new Error(`Falha ao configurar ${name}: ${result.stderr}`);
  console.log(`${name}: configurado em produção`);
}
