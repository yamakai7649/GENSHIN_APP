import { pool } from "@/lib/db";

export type EquippedWeapon = {
  name: string;
  weaponType: string;
  rarity: number;

  subStatType: string | null;

  level: number;
  promoteLevel: number;
  refinement: number;

  baseAttack: number | null;
  subStatValue: string | null;

  equippedCharacterName: string;
};

export async function listEquippedWeapons(
  accountId: number,
): Promise<EquippedWeapon[]> {
  const result = await pool.query<EquippedWeapon>(
    `
      SELECT
        wm.name,
        wm.weapon_type AS "weaponType",
        wm.rarity,
        wm.sub_stat_type AS "subStatType",

        aw.level,
        aw.promote_level AS "promoteLevel",
        aw.refinement,
        aw.base_attack AS "baseAttack",
        aw.sub_stat_value AS "subStatValue",

        cm.name AS "equippedCharacterName"

      FROM account_weapons aw

      INNER JOIN weapon_masters wm
        ON wm.id = aw.weapon_master_id

      INNER JOIN account_characters ac
        ON ac.id = aw.equipped_character_id

      INNER JOIN character_masters cm
        ON cm.id = ac.character_master_id

      WHERE aw.account_id = $1

      ORDER BY
        wm.rarity DESC,
        aw.level DESC,
        wm.name ASC
    `,
    [accountId],
  );

  return result.rows;
}
