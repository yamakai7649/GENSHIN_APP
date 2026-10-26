import { pool } from "@/lib/db";

export type CharacterListItem = {
  name: string;
  element: string;
  rarity: number;
  weaponType: string;
  level: number;
  promoteLevel: number;
  friendshipLevel: number;
  constellationLevel: number;
  weapon: {
    name: string;
    level: number;
    promoteLevel: number;
    refinement: number;
  };
};

export type CharacterDetail = {
  character: {
    name: string;
    element: string;
    rarity: number;
    weaponType: string;
    level: number;
    promoteLevel: number;
    friendshipLevel: number;
    constellationLevel: number;
  };
  stats: {
    displayed: unknown;
    base: unknown;
    extra: unknown;
    elemental: unknown;
  };
  skills: unknown;
  artifacts: unknown;
  weapon: {
    name: string;
    weaponType: string;
    rarity: number;
    level: number;
    promoteLevel: number;
    refinement: number;
    baseAttack: number | null;
    subStatType: string | null;
    subStatValue: string | null;
  };
};

export async function listCharacters(
  accountId: number,
): Promise<CharacterListItem[]> {
  const result = await pool.query<CharacterListItem>(
    `
      SELECT
        cm.name,
        cm.element,
        cm.rarity,
        cm.weapon_type AS "weaponType",
        ac.level,
        ac.promote_level AS "promoteLevel",
        ac.friendship_level AS "friendshipLevel",
        ac.constellation_level AS "constellationLevel",
        jsonb_build_object(
          'name', wm.name,
          'level', aw.level,
          'promoteLevel', aw.promote_level,
          'refinement', aw.refinement
        ) AS weapon

      FROM account_characters ac

      INNER JOIN character_masters cm
        ON cm.id = ac.character_master_id

      INNER JOIN account_weapons aw
        ON aw.equipped_character_id = ac.id

      INNER JOIN weapon_masters wm
        ON wm.id = aw.weapon_master_id

      WHERE ac.account_id = $1

      ORDER BY
        ac.level DESC,
        cm.rarity DESC,
        cm.name ASC
    `,
    [accountId],
  );

  return result.rows;
}

export async function getCharacter(
  accountId: number,
  characterName: string,
): Promise<CharacterDetail | null> {
  const result = await pool.query<CharacterDetail>(
    `
      SELECT
        jsonb_build_object(
          'name', cm.name,
          'element', cm.element,
          'rarity', cm.rarity,
          'weaponType', cm.weapon_type,
          'level', ac.level,
          'promoteLevel', ac.promote_level,
          'friendshipLevel', ac.friendship_level,
          'constellationLevel', ac.constellation_level
        ) AS character,
        jsonb_build_object(
          'displayed', ac.displayed_stats,
          'base', ac.base_stats,
          'extra', ac.extra_stats,
          'elemental', ac.elemental_stats
        ) AS stats,
        ac.skill_levels AS skills,
        ac.artifacts,
        jsonb_build_object(
          'name', wm.name,
          'weaponType', wm.weapon_type,
          'rarity', wm.rarity,
          'level', aw.level,
          'promoteLevel', aw.promote_level,
          'refinement', aw.refinement,
          'baseAttack', aw.base_attack,
          'subStatType', wm.sub_stat_type,
          'subStatValue', aw.sub_stat_value
        ) AS weapon

      FROM account_characters ac

      INNER JOIN character_masters cm
        ON cm.id = ac.character_master_id

      INNER JOIN account_weapons aw
        ON aw.equipped_character_id = ac.id

      INNER JOIN weapon_masters wm
        ON wm.id = aw.weapon_master_id

      WHERE
        ac.account_id = $1
        AND cm.name = $2

      LIMIT 1
    `,
    [accountId, characterName],
  );

  return result.rows[0] ?? null;
}
