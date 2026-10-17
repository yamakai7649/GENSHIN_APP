import { pool } from "@/lib/db";
import type { GenshinSyncData } from "@/lib/genshin/sync-schema";
import { saveGenshinAccount } from "@/lib/genshin/account";
import { saveCharacters } from "@/lib/genshin/characters";
import { saveWeapons } from "@/lib/genshin/weapons";

export async function saveGenshinData(userId: number, data: GenshinSyncData) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ① アカウント保存
    const accountId = await saveGenshinAccount(client, userId, data);

    // ② character_masters取得
    // ③ weapon_masters取得
    const characterMasters = await client.query<{
      id: number;
      name: string;
    }>(
      `
        SELECT id, name
        FROM character_masters
      `,
    );

    const weaponMasters = await client.query<{
      id: number;
      name: string;
    }>(
      `
        SELECT id, name
        FROM weapon_masters
      `,
    );

    const characterMasterMap = new Map<string, number>(
      characterMasters.rows.map((master) => [master.name, master.id] as const),
    );

    const weaponMasterMap = new Map<string, number>(
      weaponMasters.rows.map((master) => [master.name, master.id] as const),
    );

    // ④ キャラ一括保存
    const accountCharacterIdMap = await saveCharacters(
      client,
      accountId,
      data.characters,
      characterMasterMap,
    );

    // ⑤ 武器一括保存
    await saveWeapons(
      client,
      accountId,
      data.characters,
      characterMasterMap,
      weaponMasterMap,
      accountCharacterIdMap,
    );

    // 全部成功したら確定
    await client.query("COMMIT");

    console.log(`キャラ数: ${data.characters.length}`);
    console.log("原神データ保存完了");
  } catch (error) {
    // どこか1つでも失敗したら全部取り消す
    await client.query("ROLLBACK");

    console.error("原神データ保存失敗。ROLLBACKしました。", error);

    throw error;
  } finally {
    // poolから借りた接続を返す
    client.release();
  }
}
