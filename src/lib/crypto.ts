import "server-only";
import crypto from "node:crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error("SESSION_SECRET não configurado no .env.local");
  }
  return s;
}

export function hashPin(pin: string): string {
  return crypto.createHmac("sha256", secret()).update(`pin:${pin}`).digest("hex");
}

export function verifyPin(pin: string, hash: string): boolean {
  const computed = hashPin(pin);
  const a = Buffer.from(computed);
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function base64url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

export function signSession(memberId: string): string {
  const payload = JSON.stringify({ id: memberId, iat: Date.now() });
  const payloadB64 = base64url(Buffer.from(payload));
  const signature = base64url(
    crypto.createHmac("sha256", secret()).update(payloadB64).digest()
  );
  return `${payloadB64}.${signature}`;
}

export function verifySession(token: string): { id: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expected = base64url(
    crypto.createHmac("sha256", secret()).update(payloadB64).digest()
  );
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(base64urlDecode(payloadB64).toString());
    if (typeof payload.id !== "string") return null;
    return { id: payload.id };
  } catch {
    return null;
  }
}
