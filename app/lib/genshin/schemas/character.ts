import { z } from "zod";

export const characterPropertySchema = z.object({
  property_type: z.number(),
  base: z.string(),
  add: z.string(),
  final: z.string(),
});

// HoYoLABの天賦情報
export const characterSkillSchema = z.object({
  name: z.string(),
  skill_type: z.number(),
  level: z.number(),
  is_unlock: z.boolean(),
  is_enhanced: z.boolean(),
  can_enhanced: z.boolean(),
  enhanced_desc: z.string(),

  skill_affix_list: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),

  before_enhanced_skill_attr_index: z.array(z.number()),
  after_enhanced_skill_attr_index: z.array(z.number()),
});

// HoYoLABの命ノ星座情報
export const characterConstellationSchema = z.object({
  pos: z.number().int().min(1).max(6),
  name: z.string(),
  effect: z.string(),
  enhanced_effect: z.string(),
  can_enhanced: z.boolean(),
  is_enhanced: z.boolean(),
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
  name: z.string(),
  pos: z.number(),
  pos_name: z.string(),
  rarity: z.number(),
  level: z.number(),

  set: z.object({
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
  constellations: z.array(characterConstellationSchema),
});

export type GenshinCharacter = z.infer<typeof genshinCharacterSchema>;
