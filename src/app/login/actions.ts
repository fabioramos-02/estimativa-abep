"use server";

import { createSession, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export type LoginState = { error: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) return { error: "Senha incorreta. Verifique o acesso informado pela SETDIG." };
  await createSession();
  redirect("/");
}
