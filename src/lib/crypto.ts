// Firma/verificación genérica de payloads JSON con HMAC-SHA256 (Web Crypto API),
// compatible tanto con el runtime Edge del middleware como con el runtime Node
// de las API routes. Usada como base de los distintos sistemas de sesión (admin, líder).

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

export async function signJson<T>(payload: T): Promise<string> {
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${toBase64Url(sig)}`;
}

export async function verifyJson<T>(token: string | undefined | null): Promise<T | null> {
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

    return JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as T;
  } catch {
    return null;
  }
}
