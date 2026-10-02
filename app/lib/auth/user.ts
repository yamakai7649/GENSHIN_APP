
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { CurrentUser } from "@/types/user";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const result = await pool.query<CurrentUser>(
    `
      SELECT id, email
      FROM users
      WHERE id = $1;
    `,
    [session.userId]
  );

  return result.rows[0] ?? null;
}
