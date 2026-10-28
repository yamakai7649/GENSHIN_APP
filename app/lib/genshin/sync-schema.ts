import { z } from "zod";

export const characterPropertySchema = z.object({
  property_type: z.number(),
  base: z.string(),
  add: z.string(),
  final: z.string(),
});

export const characterSkillSchema = z.object({
  skill_id: z.number(),
  level: z.number(),
});

export const characterWeaponSchema = z.object({
  name: z.string(),
  level: z.number(),
  promote_level: z.number(),
  affix_level: z.number(),
  main_property: z.object({
    final: z.string(),
  }),
  sub_property: z
    .object({
      final: z.string(),
    })
    .nullable(),
});

export const artifactPropertySchema = z.object({
  property_type: z.number(),
  value: z.string(),
});

export const artifactSubPropertySchema = artifactPropertySchema.extend({
  times: z.number(),
});

export const genshinArtifactSchema = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string(),
  pos: z.number(),
  pos_name: z.string(),
  rarity: z.number(),
  level: z.number(),
  set: z.object({
    id: z.number(),
    name: z.string(),
  }),
  main_property: artifactPropertySchema,
  sub_property_list: z.array(artifactSubPropertySchema),
});

export const genshinCharacterSchema = z.object({
  base: z.object({
    name: z.string(),
    element: z.string(),
    fetter: z.number(),
    level: z.number(),
    actived_constellation_num: z.number(),
  }),
  weapon: characterWeaponSchema,
  relics: z.array(genshinArtifactSchema),
  selected_properties: z.array(characterPropertySchema),
  base_properties: z.array(characterPropertySchema),
  extra_properties: z.array(characterPropertySchema),
  element_properties: z.array(characterPropertySchema),
  skills: z.array(characterSkillSchema),
});

export const genshinAccountSchema = z.object({
  game_role_id: z.string(),
  region: z.string(),
  region_name: z.string(),
  nickname: z.string(),
  level: z.number(),
});

export const genshinStatsSchema = z.object({
  active_day_number: z.number(),
  achievement_number: z.number(),
  avatar_number: z.number(),
  full_fetter_avatar_num: z.number(),
  spiral_abyss: z.string(),
  role_combat: z.object({
    max_round_id: z.number(),
    tarot_finished_cnt: z.number(),
  }),
  hard_challenge: z.object({
    difficulty: z.number(),
  }),
  way_point_number: z.number(),
  domain_number: z.number(),
  anemoculus_number: z.number(),
  geoculus_number: z.number(),
  electroculus_number: z.number(),
  dendroculus_number: z.number(),
  hydroculus_number: z.number(),
  pyroculus_number: z.number(),
  iceculus_number: z.number(),
  moonoculus_number: z.number(),
  luxurious_chest_number: z.number(),
  precious_chest_number: z.number(),
  exquisite_chest_number: z.number(),
  common_chest_number: z.number(),
  magic_chest_number: z.number(),
});

export const explorationOfferingSchema = z.object({
  name: z.string(),
  level: z.number(),
  open_state: z.string(),
  icon: z.string(),
});

export const areaExplorationSchema = z.object({
  name: z.string(),
  exploration_percentage: z.number(),
});

export const explorationBossSchema = z.object({
  name: z.string(),
  kill_num: z.number(),
});

export const tribalReputationSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: z.number(),
  icon: z.string(),
  image: z.string(),
});

export const worldExplorationSchema = z.object({
  id: z.number(),
  parent_id: z.number(),
  name: z.string(),
  type: z.string(),
  world_type: z.number(),
  level: z.number(),
  exploration_percentage: z.number(),
  seven_statue_level: z.number(),
  icon: z.string(),
  cover: z.string(),
  background_image: z.string(),
  inner_icon: z.string(),
  offerings: z.array(explorationOfferingSchema),
  area_exploration_list: z.array(areaExplorationSchema),
  boss_list: z.array(explorationBossSchema),
  natan_reputation: z
    .object({
      tribal_list: z.array(tribalReputationSchema),
    })
    .nullable(),
});

export const genshinHomeSchema = z.object({
  level: z.number(),
  visit_num: z.number(),
  comfort_num: z.number(),
  item_num: z.number(),
  name: z.string(),
  icon: z.string(),
  comfort_level_name: z.string(),
  comfort_level_icon: z.string(),
});

export const genshinOverviewSchema = z.object({
  role: z.object({
    game_head_icon: z.string(),
  }),
  stats: genshinStatsSchema,
  world_explorations: z.array(worldExplorationSchema),
  homes: z.array(genshinHomeSchema),
});

export const rawGenshinSyncDataSchema = z
  .object({
    account: genshinAccountSchema,
    overview: genshinOverviewSchema,
    characters: z.object({
      list: z.array(genshinCharacterSchema),
    }),
  })
  .transform((data) => ({
    account: data.account,
    overview: data.overview,
    characters: data.characters.list,
  }));

export const genshinSyncDataSchema = z.object({
  account: genshinAccountSchema,
  overview: genshinOverviewSchema,
  characters: z.array(genshinCharacterSchema),
});

export type GenshinAccount = z.infer<typeof genshinAccountSchema>;
export type GenshinOverview = z.infer<typeof genshinOverviewSchema>;
export type GenshinCharacter = z.infer<typeof genshinCharacterSchema>;
export type GenshinSyncData = z.infer<typeof genshinSyncDataSchema>;
