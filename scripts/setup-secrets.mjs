import { randomBytes, scryptSync } from "node:crypto";
import { writeFileSync } from "node:fs";

const password = `MS-IOSPD-${randomBytes(6).toString("base64url")}`;
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const authSecret = randomBytes(32).toString("base64url");
writeFileSync(".env.local", `REPORT_PASSWORD_HASH=${salt}:${hash}\nAUTH_SECRET=${authSecret}\n`);
writeFileSync("entrega/acesso.txt", `Senha do relatório: ${password}\n`);
console.log("Segredos gerados em .env.local. A senha foi salva em entrega/acesso.txt (arquivo ignorado pelo Git).");
