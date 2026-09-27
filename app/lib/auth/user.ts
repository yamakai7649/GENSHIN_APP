import { pool } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import type { CurrentUser } from "@/types/user"

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession()

  if (!session) {
    return null
  }

  const result = await pool.query<CurrentUser>(
    `
      SELECT
        users.id,
        users.username,
        users.display_name AS "displayName",
        users.bio,
        users.avatar_url AS "avatarUrl",
        users.user_type AS "userType",
        human_accounts.email
      FROM users
      JOIN human_accounts
        ON human_accounts.user_id = users.id
      WHERE users.id = $1;
    `,
    [session.userId]
  )

  const user = result.rows[0]

  if (!user) {
    return null
  }

  return user
}
