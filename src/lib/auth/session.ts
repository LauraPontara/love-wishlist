import { SignJWT, jwtVerify } from "jose";

// Sessão = JWT HS256 em cookie httpOnly (ADR-003). Este módulo não depende de
// next/headers, então funciona tanto no proxy quanto nas rotas.

export const SESSION_COOKIE = "nw_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 dias (RF03)

const key = (secret: string) => new TextEncoder().encode(secret);

export async function createSessionToken(profileId: string, secret: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profileId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key(secret));
}

/** Retorna o id do perfil se o token for válido; null caso contrário. */
export async function verifySessionToken(token: string | undefined, secret: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
