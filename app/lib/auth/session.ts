import { randomBytes, createHash } from "node:crypto"
import { cookies } from "next/headers"
import { pool } from "@/lib/db"
import { Session } from "@/types/session"

export function generateSessionToken() {
  return randomBytes(32).toString("base64url")
}

export function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex")
}

export async function createSession(userId: number) {
  const token = generateSessionToken()

  const tokenHash = hashSessionToken(token)

  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 7
  )

  await pool.query(
    `
      INSERT INTO sessions (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3);
    `,
    [userId, tokenHash, expiresAt]
  )

  const cookieStore = await cookies()

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function getSession() {
  const cookieStore = await cookies()

  const token = cookieStore.get("session")?.value

  if (!token) {
    return null
  }

  const tokenHash = hashSessionToken(token)

  const result = await pool.query(
    `
      SELECT
        id,
        user_id AS "userId",
        expires_at AS "expiresAt"
      FROM sessions
      WHERE token_hash = $1
    `,
    [tokenHash]
  )

  const session: Session = result.rows[0]

  if (!session) {
    return null
  }

  if (session.expiresAt <= new Date()) {
    return null
  }

  return session
}

export async function deleteSession() {
  const cookieStore = await cookies()

  const token = cookieStore.get("session")?.value

  if (!token) {
    return null
  }

  const tokenHash = hashSessionToken(token);

  await pool.query(
    `
      DELETE
      FROM sessions
      WHERE token_hash = $1
    `,
    [tokenHash]
  )

  cookieStore.delete("session");
}
