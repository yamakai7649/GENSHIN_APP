import type { GenshinSyncData, GenshinCharacter } from "@/types/genshin";

type RawGenshinSyncData = Omit<GenshinSyncData, "characters"> & {
  characters: {
    list: GenshinCharacter[];
  };
};

export function prepareGenshinSyncData(
  body: RawGenshinSyncData,
): GenshinSyncData {
  return {
    account: {
      game_role_id: body.account.game_role_id,
      region: body.account.region,
      region_name: body.account.region_name,
      nickname: body.account.nickname,
      level: body.account.level,
    },

    overview: {
      role: {
        game_head_icon: body.overview.role.game_head_icon,
      },
      stats: body.overview.stats,
      world_explorations: body.overview.world_explorations,
      homes: body.overview.homes,
    },

    characters: body.characters.list.map((character) => ({
      base: {
        name: character.base.name,
        element: character.base.element,
        fetter: character.base.fetter,
        level: character.base.level,
        actived_constellation_num: character.base.actived_constellation_num,
      },

      weapon: {
        name: character.weapon.name,
        level: character.weapon.level,
        promote_level: character.weapon.promote_level,
        affix_level: character.weapon.affix_level,
        main_property: {
          final: character.weapon.main_property.final,
        },
        sub_property: character.weapon.sub_property
          ? {
              final: character.weapon.sub_property.final,
            }
          : null,
      },

      relics: character.relics,

      selected_properties: character.selected_properties.map((property) => ({
        property_type: property.property_type,
        base: property.base,
        add: property.add,
        final: property.final,
      })),

      base_properties: character.base_properties.map((property) => ({
        property_type: property.property_type,
        base: property.base,
        add: property.add,
        final: property.final,
      })),

      extra_properties: character.extra_properties.map((property) => ({
        property_type: property.property_type,
        base: property.base,
        add: property.add,
        final: property.final,
      })),

      element_properties: character.element_properties.map((property) => ({
        property_type: property.property_type,
        base: property.base,
        add: property.add,
        final: property.final,
      })),

      skills: character.skills.map((skill) => ({
        skill_id: skill.skill_id,
        level: skill.level,
      })),
    })),
  };
}
