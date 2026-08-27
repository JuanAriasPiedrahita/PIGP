// Sesión de login firmada con HMAC-SHA256 (Web Crypto API), compatible tanto
// con el runtime Edge del middleware como con el runtime Node de las API routes.

const COOKIE_NAME = "pigp_session";
const SESSION_HOURS = 8;

function getSecret(): string {
  return process.env.AUTH_SECRET || "pigp-dev-secret-cambiar-en-produccion";
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

export async function createSessionToken(username: string): Promise<string> {
  const payload = JSON.stringify({ u: username, exp: Date.now() + SESSION_HOURS * 3600 * 1000 });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${toBase64Url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const expectedSig = await hmac(payloadB64);
    const givenSig = fromBase64Url(sigB64);
    if (expectedSig.length !== givenSig.length) return null;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) diff |= expectedSig[i] ^ givenSig[i];
    if (diff !== 0) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return typeof payload.u === "string" ? payload.u : null;
  } catch {
    return null;
  }
}

export { COOKIE_NAME, SESSION_HOURS };
