import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-lockup"><span className="brand-mark">MS</span><span>Governo de Mato Grosso do Sul<br /><strong>SETDIG</strong></span></div>
        <p className="eyebrow">Acesso restrito</p>
        <h1 id="login-title">Estimativa IOSPD 2026</h1>
        <p>Relatório estratégico interno para apoio à decisão.</p>
        <LoginForm />
      </section>
    </main>
  );
}
