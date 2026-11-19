"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action} className="login-form">
      <label htmlFor="password">Senha de acesso</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
      <p className="form-error" role="alert" aria-live="polite">{state.error}</p>
      <button className="button" disabled={pending}>{pending ? "Verificando…" : "Acessar relatório"}</button>
    </form>
  );
}
