import { pool } from "@/lib/db";

export type GenshinAccount = {
  region: string;
  regionName: string | null;
  nickname: string;
  adventureRank: number;
  stats: unknown;
  worldExplorations: unknown;
  homes: unknown;
  lastSyncedAt: Date;
};

export async function getGenshinAccountId(
  userId: number,
): Promise<number | null> {
  const result = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM genshin_accounts
      WHERE user_id = $1
      ORDER BY last_synced_at DESC
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0]?.id ?? null;
}

export async function getGenshinAccount(
  userId: number,
): Promise<GenshinAccount | null> {
  const result = await pool.query<GenshinAccount>(
    `
      SELECT
        region,
        region_name AS "regionName",
        nickname,
        adventure_rank AS "adventureRank",
        stats,
        world_explorations AS "worldExplorations",
        homes,
        last_synced_at AS "lastSyncedAt"
      FROM genshin_accounts
      WHERE user_id = $1
      ORDER BY last_synced_at DESC
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}
