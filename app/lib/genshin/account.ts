import type { PoolClient } from "pg";
import type { GenshinSyncData } from "@/lib/genshin/schemas/sync";

export async function saveGenshinAccount(
  client: PoolClient,
  userId: number,
  data: GenshinSyncData,
): Promise<number> {
  const { account, overview } = data;

  const result = await client.query<{
    id: number;
  }>(
    `
      INSERT INTO genshin_accounts (
        user_id,
        game_uid,
        region,
        region_name,
        nickname,
        adventure_rank,
        game_head_icon,
        stats,
        world_explorations,
        homes
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10
      )
      ON CONFLICT (
        user_id,
        game_uid
      )
      DO UPDATE SET
        region = EXCLUDED.region,
        region_name = EXCLUDED.region_name,
        nickname = EXCLUDED.nickname,
        adventure_rank = EXCLUDED.adventure_rank,
        game_head_icon = EXCLUDED.game_head_icon,
        stats = EXCLUDED.stats,
        world_explorations =
          EXCLUDED.world_explorations,
        homes = EXCLUDED.homes,
        last_synced_at = NOW(),
        updated_at = NOW()
      RETURNING id
    `,
    [
      userId,
      account.game_role_id,
      account.region,
      account.region_name,
      account.nickname,
      account.level,
      overview.role.game_head_icon,

      JSON.stringify(overview.stats),
      JSON.stringify(overview.world_explorations),
      JSON.stringify(overview.homes),
    ],
  );

  return result.rows[0].id;
}
