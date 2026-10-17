import type { PoolClient } from "pg";
import type { GenshinCharacter } from "@/lib/genshin/sync-schema";

export function getCharacterMasterName(character: GenshinCharacter): string {
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

export async function saveCharacters(
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
