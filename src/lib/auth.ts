import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "iospd_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-secret-change-me");

export function verifyPassword(password: string): boolean {
  const configured = process.env.REPORT_PASSWORD_HASH;
  if (!configured) return process.env.NODE_ENV !== "production" && password === "desenvolvimento";
  const [salt, expectedHex] = configured.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSession() {
  const token = await new SignJWT({ access: "report" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
}

export async function isAuthenticated() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.access === "report";
  } catch { return false; }
}

export async function requireSession() {
  if (!(await isAuthenticated())) redirect("/login");
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
