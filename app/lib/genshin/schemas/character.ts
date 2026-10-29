import { z } from "zod";

export const rawCharacterPropertySchema = z.object({
  property_type: z.number(),
  base: z.string(),
  add: z.string(),
  final: z.string(),
});

export const rawCharacterSkillSchema = z.object({
  skill_id: z.number(),
  level: z.number(),
});

export const rawCharacterWeaponSchema = z.object({
  name: z.string(),
  level: z.number(),
  promote_level: z.number(),
  affix_level: z.number(),
  main_property: z.object({
    property_type: z.number(),
    final: z.string(),
  }),
  sub_property: z
    .object({
      property_type: z.number(),
      final: z.string(),
    })
    .nullable(),
});

export const rawArtifactPropertySchema = z.object({
  property_type: z.number(),
  value: z.string(),
});

export const rawArtifactSubPropertySchema = rawArtifactPropertySchema.extend({
  times: z.number(),
});

export const rawGenshinArtifactSchema = z.object({
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
  main_property: rawArtifactPropertySchema,
  sub_property_list: z.array(rawArtifactSubPropertySchema),
});

export const rawGenshinCharacterSchema = z.object({
  base: z.object({
    name: z.string(),
    element: z.string(),
    fetter: z.number(),
    level: z.number(),
    actived_constellation_num: z.number(),
  }),
  weapon: rawCharacterWeaponSchema,
  relics: z.array(rawGenshinArtifactSchema),
  selected_properties: z.array(rawCharacterPropertySchema),
  base_properties: z.array(rawCharacterPropertySchema),
  extra_properties: z.array(rawCharacterPropertySchema),
  element_properties: z.array(rawCharacterPropertySchema),
  skills: z.array(rawCharacterSkillSchema),
});

export const propertyMapEntrySchema = z.object({
  property_type: z.number(),
  name: z.string(),
  icon: z.string(),
  filter_name: z.string(),
});

export const propertyMapSchema = z.record(z.string(), propertyMapEntrySchema);

export const statTypeSchema = z.enum([
  "hp",
  "hpPercent",
  "maxHp",
  "baseAttack",
  "attack",
  "attackPercent",
  "defense",
  "defensePercent",
  "critRate",
  "critDamage",
  "energyRecharge",
  "elementalMastery",
  "healingBonus",
  "incomingHealingBonus",
  "shieldStrength",
  "cooldownReduction",
  "physicalDamageBonus",
  "physicalResistance",
  "pyroDamageBonus",
  "pyroResistance",
  "hydroDamageBonus",
  "hydroResistance",
  "electroDamageBonus",
  "electroResistance",
  "dendroDamageBonus",
  "dendroResistance",
  "anemoDamageBonus",
  "anemoResistance",
  "geoDamageBonus",
  "geoResistance",
  "cryoDamageBonus",
  "cryoResistance",
  "maxStamina",
]);

export const statUnitSchema = z.enum(["flat", "percent"]);

export const characterStatSchema = z.object({
  type: statTypeSchema,
  unit: statUnitSchema,
  baseValue: z.number(),
  addedValue: z.number().nullable(),
  finalValue: z.number(),
});

export const artifactStatSchema = z.object({
  type: statTypeSchema,
  unit: statUnitSchema,
  value: z.number(),
});

export const artifactSubStatSchema = artifactStatSchema.extend({
  upgradeCount: z.number(),
});

export const genshinArtifactSchema = z.object({
  pieceId: z.number(),
  name: z.string(),
  icon: z.string(),
  slot: z.enum(["flower", "plume", "sands", "goblet", "circlet"]),
  slotName: z.string(),
  rarity: z.number(),
  level: z.number(),
  set: z.object({
    setId: z.number(),
    name: z.string(),
  }),
  mainStat: artifactStatSchema,
  subStats: z.array(artifactSubStatSchema),
});

export const characterWeaponSchema = z.object({
  name: z.string(),
  level: z.number(),
  ascensionLevel: z.number(),
  refinementLevel: z.number(),
  baseAttack: z.number(),
  subStat: artifactStatSchema.nullable(),
});

export const genshinCharacterSchema = z.object({
  masterName: z.string(),
  element: z.enum([
    "anemo",
    "geo",
    "electro",
    "dendro",
    "hydro",
    "pyro",
    "cryo",
  ]),
  level: z.number(),
  friendshipLevel: z.number(),
  constellationLevel: z.number(),
  weapon: characterWeaponSchema,
  artifacts: z.array(genshinArtifactSchema),
  displayedStats: z.array(characterStatSchema),
  baseStats: z.array(characterStatSchema),
  extraStats: z.array(characterStatSchema),
  elementalStats: z.array(characterStatSchema),
  skills: z.array(
    z.object({
      skillId: z.number(),
      level: z.number(),
    }),
  ),
});

export type RawGenshinCharacter = z.infer<typeof rawGenshinCharacterSchema>;
export type PropertyMap = z.infer<typeof propertyMapSchema>;
export type StatType = z.infer<typeof statTypeSchema>;
export type StatUnit = z.infer<typeof statUnitSchema>;
export type GenshinCharacter = z.infer<typeof genshinCharacterSchema>;
