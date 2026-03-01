import { SignJWT, jwtVerify } from "jose";
import type { CustomerJWTPayload } from "./types";

export const CUSTOMER_COOKIE = "tgb_customer";
const SECRET = () => new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || "change-me");

// ─── Password hashing via Web Crypto PBKDF2 ────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return `${saltB64}:${hashB64}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  const computed = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return computed === hashB64;
}

// ─── JWT ───────────────────────────────────────────────────────────────────────

export async function signCustomerToken(customerId: string, email: string): Promise<string> {
  return new SignJWT({ role: "customer", sub: customerId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET());
}

export async function verifyCustomerToken(token: string): Promise<CustomerJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET());
    if ((payload as Record<string, unknown>).role !== "customer") return null;
    return payload as unknown as CustomerJWTPayload;
  } catch {
    return null;
  }
}
