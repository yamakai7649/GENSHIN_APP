import { pool } from "@/lib/db";
import type { PoolClient } from "pg";
import type { GenshinSyncData, GenshinCharacter } from "@/types/genshin";

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

async function saveGenshinAccount(
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

function getCharacterMasterName(character: GenshinCharacter): string {
  if (character.base.name !== "旅人") {
    return character.base.name;
  }

  const elementNames: Record<string, string> = {
    Anemo: "風",
    Geo: "岩",
    Electro: "雷",
    Dendro: "草",
    Hydro: "水",
    Pyro: "炎",
    Cryo: "氷",
  };

  const elementName = elementNames[character.base.element];

  if (!elementName) {
    return "旅人";
  }

  return `旅人(${elementName})`;
}

async function saveCharacters(
  client: PoolClient,
  accountId: number,
  characters: GenshinCharacter[],
  characterMasterMap: Map<string, number>,
): Promise<Map<number, number>> {
  const rows: {
    character: GenshinCharacter;
    characterMasterId: number;
  }[] = [];

  for (const character of characters) {
    const masterName = getCharacterMasterName(character);

    const characterMasterId = characterMasterMap.get(masterName);

    if (!characterMasterId) {
      throw new Error(`character_master未登録: ${masterName}`);
    }

    rows.push({
      character,
      characterMasterId,
    });
  }

  if (rows.length === 0) {
    return new Map();
  }

  const values: (string | number | null)[] = [];

  const placeholders = rows.map(({ character, characterMasterId }, index) => {
    const offset = index * 11;

    const skillLevels = character.skills.map((skill) => ({
      skill_id: skill.skill_id,
      level: skill.level,
    }));

    values.push(
      accountId,
      characterMasterId,

      character.base.level,
      character.base.fetter,
      character.base.actived_constellation_num,

      JSON.stringify(character.selected_properties),
      JSON.stringify(character.base_properties),
      JSON.stringify(character.extra_properties),
      JSON.stringify(character.element_properties),
      JSON.stringify(skillLevels),
      JSON.stringify(character.relics),
    );

    return `
        (
          $${offset + 1},
          $${offset + 2},
          $${offset + 3},
          $${offset + 4},
          $${offset + 5},
          $${offset + 6},
          $${offset + 7},
          $${offset + 8},
          $${offset + 9},
          $${offset + 10},
          $${offset + 11}
        )
      `;
  });

  const result = await client.query<{
    id: number;
    character_master_id: number;
  }>(
    `
      INSERT INTO account_characters (
        account_id,
        character_master_id,
        level,
        friendship_level,
        constellation_level,
        displayed_stats,
        base_stats,
        extra_stats,
        elemental_stats,
        skill_levels,
        artifacts
      )
      VALUES
        ${placeholders.join(",")}

      ON CONFLICT (
        account_id,
        character_master_id
      )
      DO UPDATE SET
        level =
          EXCLUDED.level,

        friendship_level =
          EXCLUDED.friendship_level,

        constellation_level =
          EXCLUDED.constellation_level,

        displayed_stats =
          EXCLUDED.displayed_stats,

        base_stats =
          EXCLUDED.base_stats,

        extra_stats =
          EXCLUDED.extra_stats,

        elemental_stats =
          EXCLUDED.elemental_stats,

        skill_levels =
          EXCLUDED.skill_levels,

        artifacts =
          EXCLUDED.artifacts,

        updated_at = NOW()

      RETURNING
        id,
        character_master_id
    `,
    values,
  );

  return new Map<number, number>(
    result.rows.map((row) => [row.character_master_id, row.id] as const),
  );
}

async function saveWeapons(
  client: PoolClient,
  accountId: number,
  characters: GenshinCharacter[],
  characterMasterMap: Map<string, number>,
  weaponMasterMap: Map<string, number>,
  accountCharacterIdMap: Map<number, number>,
) {
  const rows: {
    character: GenshinCharacter;
    accountCharacterId: number;
    weaponMasterId: number;
  }[] = [];

  for (const character of characters) {
    const masterName = getCharacterMasterName(character);

    const characterMasterId = characterMasterMap.get(masterName);

    if (!characterMasterId) {
      throw new Error(`character_master未登録: ${masterName}`);
    }

    const accountCharacterId = accountCharacterIdMap.get(characterMasterId);

    if (!accountCharacterId) {
      throw new Error(`account_character取得失敗: ${masterName}`);
    }

    const weaponMasterId = weaponMasterMap.get(character.weapon.name);

    if (!weaponMasterId) {
      throw new Error(`weapon_master未登録: ${character.weapon.name}`);
    }

    rows.push({
      character,
      accountCharacterId,
      weaponMasterId,
    });
  }

  if (rows.length === 0) {
    return;
  }

  const values: (string | number | null)[] = [];

  const placeholders = rows.map(
    ({ character, accountCharacterId, weaponMasterId }, index) => {
      const offset = index * 8;

      const weapon = character.weapon;

      values.push(
        accountId,
        weaponMasterId,

        weapon.level,
        weapon.promote_level,
        weapon.affix_level,

        Number(weapon.main_property.final),

        weapon.sub_property?.final ?? null,

        accountCharacterId,
      );

      return `
        (
          $${offset + 1},
          $${offset + 2},
          $${offset + 3},
          $${offset + 4},
          $${offset + 5},
          $${offset + 6},
          $${offset + 7},
          $${offset + 8}
        )
      `;
    },
  );

  await client.query(
    `
      INSERT INTO account_weapons (
        account_id,
        weapon_master_id,
        level,
        promote_level,
        refinement,
        base_attack,
        sub_stat_value,
        equipped_character_id
      )
      VALUES
        ${placeholders.join(",")}

      ON CONFLICT (
        equipped_character_id
      )
      DO UPDATE SET
        weapon_master_id =
          EXCLUDED.weapon_master_id,

        level =
          EXCLUDED.level,

        promote_level =
          EXCLUDED.promote_level,

        refinement =
          EXCLUDED.refinement,

        base_attack =
          EXCLUDED.base_attack,

        sub_stat_value =
          EXCLUDED.sub_stat_value,

        updated_at = NOW()
    `,
    values,
  );
}
