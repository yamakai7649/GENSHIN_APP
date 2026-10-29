import type { PoolClient } from "pg";
import type { GenshinCharacter } from "@/lib/genshin/schemas/character";
import { getCharacterMasterName } from "@/lib/genshin/characters";

export async function saveWeapons(
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
