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

export type GenshinCharacter = z.infer<typeof genshinCharacterSchema>;
