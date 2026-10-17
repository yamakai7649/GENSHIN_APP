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

export const genshinCharacterSchema = z.object({
  base: z.object({
    name: z.string(),
    element: z.string(),
    fetter: z.number(),
    level: z.number(),
    actived_constellation_num: z.number(),
  }),
  weapon: characterWeaponSchema,
  relics: z.array(z.unknown()),
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

export const genshinOverviewSchema = z.object({
  role: z.object({
    game_head_icon: z.string(),
  }),
  stats: z.unknown(),
  world_explorations: z.array(z.unknown()),
  homes: z.array(z.unknown()),
});

export const rawGenshinSyncDataSchema = z.object({
  account: genshinAccountSchema,
  overview: genshinOverviewSchema,
  characters: z.object({
    list: z.array(genshinCharacterSchema),
  }),
});

export const genshinSyncDataSchema = z.object({
  account: genshinAccountSchema,
  overview: genshinOverviewSchema,
  characters: z.array(genshinCharacterSchema),
});

export type GenshinAccount = z.infer<typeof genshinAccountSchema>;
export type GenshinOverview = z.infer<typeof genshinOverviewSchema>;
export type GenshinCharacter = z.infer<typeof genshinCharacterSchema>;
export type RawGenshinSyncData = z.infer<typeof rawGenshinSyncDataSchema>;
export type GenshinSyncData = z.infer<typeof genshinSyncDataSchema>;
