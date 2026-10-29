import type {
  GenshinCharacter,
  PropertyMap,
  RawGenshinCharacter,
  StatType,
  StatUnit,
} from "@/lib/genshin/schemas/character";

const STAT_TYPE_BY_FILTER_NAME: Record<string, StatType> = {
  HP: "hp",
  HPパーセンテージ: "hpPercent",
  HP上限: "maxHp",
  基礎攻撃力: "baseAttack",
  攻撃力: "attack",
  攻撃力パーセンテージ: "attackPercent",
  防御力: "defense",
  防御力パーセンテージ: "defensePercent",
  会心率: "critRate",
  会心ダメージ: "critDamage",
  元素チャージ効率: "energyRecharge",
  元素熟知: "elementalMastery",
  与える治療効果: "healingBonus",
  受ける治療効果: "incomingHealingBonus",
  シールド強化: "shieldStrength",
  クールタイム短縮: "cooldownReduction",
  物理ダメージ: "physicalDamageBonus",
  物理耐性: "physicalResistance",
  炎元素ダメージ: "pyroDamageBonus",
  炎元素耐性: "pyroResistance",
  水元素ダメージ: "hydroDamageBonus",
  水元素耐性: "hydroResistance",
  雷元素ダメージ: "electroDamageBonus",
  雷元素耐性: "electroResistance",
  草元素ダメージ: "dendroDamageBonus",
  草元素耐性: "dendroResistance",
  風元素ダメージ: "anemoDamageBonus",
  風元素耐性: "anemoResistance",
  岩元素ダメージ: "geoDamageBonus",
  岩元素耐性: "geoResistance",
  氷元素ダメージ: "cryoDamageBonus",
  氷元素耐性: "cryoResistance",
  スタミナ上限: "maxStamina",
};

function normalizeElement(element: string): GenshinCharacter["element"] {
  switch (element) {
    case "Anemo":
      return "anemo";
    case "Geo":
      return "geo";
    case "Electro":
      return "electro";
    case "Dendro":
      return "dendro";
    case "Hydro":
      return "hydro";
    case "Pyro":
      return "pyro";
    case "Cryo":
      return "cryo";
    default:
      throw new Error(`未対応の元素: ${element}`);
  }
}

function getCharacterMasterName(
  name: string,
  element: GenshinCharacter["element"],
): string {
  if (name !== "旅人") {
    return name;
  }

  const travelerElementNames: Record<GenshinCharacter["element"], string> = {
    anemo: "風",
    geo: "岩",
    electro: "雷",
    dendro: "草",
    hydro: "水",
    pyro: "炎",
    cryo: "氷",
  };

  return `旅人(${travelerElementNames[element]})`;
}

function getStatType(propertyType: number, propertyMap: PropertyMap): StatType {
  const property = propertyMap[String(propertyType)];

  if (!property || property.property_type !== propertyType) {
    throw new Error(`property_mapに未登録のproperty_type: ${propertyType}`);
  }

  const statType = STAT_TYPE_BY_FILTER_NAME[property.filter_name];

  if (!statType) {
    throw new Error(
      `未対応のステータス: property_type=${propertyType}, filter_name=${property.filter_name}`,
    );
  }

  return statType;
}

function getStatUnit(value: string): StatUnit {
  return value.trim().endsWith("%") ? "percent" : "flat";
}

function parseStatValue(value: string, unit: StatUnit): number {
  const trimmed = value.trim();
  const hasPercent = trimmed.endsWith("%");

  if ((unit === "percent") !== hasPercent) {
    throw new Error(`ステータス単位が不一致です: ${value}`);
  }

  const numericText = hasPercent ? trimmed.slice(0, -1) : trimmed;
  const parsed = Number(numericText);

  if (!Number.isFinite(parsed)) {
    throw new Error(`ステータス値を数値化できません: ${value}`);
  }

  return parsed;
}

function parseOptionalStatValue(value: string, unit: StatUnit): number | null {
  if (value.trim() === "") {
    return null;
  }

  return parseStatValue(value, unit);
}

function normalizeCharacterStat(
  property: RawGenshinCharacter["selected_properties"][number],
  propertyMap: PropertyMap,
): GenshinCharacter["displayedStats"][number] {
  const unit = getStatUnit(property.final);

  return {
    type: getStatType(property.property_type, propertyMap),
    unit,
    baseValue: parseStatValue(property.base, unit),
    addedValue: parseOptionalStatValue(property.add, unit),
    finalValue: parseStatValue(property.final, unit),
  };
}

function normalizeArtifactStat(
  property: RawGenshinCharacter["relics"][number]["main_property"],
  propertyMap: PropertyMap,
) {
  const unit = getStatUnit(property.value);

  return {
    type: getStatType(property.property_type, propertyMap),
    unit,
    value: parseStatValue(property.value, unit),
  };
}

function normalizeArtifactSlot(
  position: number,
): GenshinCharacter["artifacts"][number]["slot"] {
  switch (position) {
    case 1:
      return "flower";
    case 2:
      return "plume";
    case 3:
      return "sands";
    case 4:
      return "goblet";
    case 5:
      return "circlet";
    default:
      throw new Error(`未対応の聖遺物部位: ${position}`);
  }
}

function normalizeArtifact(
  artifact: RawGenshinCharacter["relics"][number],
  propertyMap: PropertyMap,
): GenshinCharacter["artifacts"][number] {
  return {
    pieceId: artifact.id,
    name: artifact.name,
    icon: artifact.icon,
    slot: normalizeArtifactSlot(artifact.pos),
    slotName: artifact.pos_name,
    rarity: artifact.rarity,
    level: artifact.level,
    set: {
      setId: artifact.set.id,
      name: artifact.set.name,
    },
    mainStat: normalizeArtifactStat(artifact.main_property, propertyMap),
    subStats: artifact.sub_property_list.map((property) => ({
      ...normalizeArtifactStat(property, propertyMap),
      upgradeCount: property.times,
    })),
  };
}

function normalizeWeapon(
  weapon: RawGenshinCharacter["weapon"],
  propertyMap: PropertyMap,
): GenshinCharacter["weapon"] {
  const baseAttack = {
    type: getStatType(weapon.main_property.property_type, propertyMap),
    unit: getStatUnit(weapon.main_property.final),
    value: parseStatValue(
      weapon.main_property.final,
      getStatUnit(weapon.main_property.final),
    ),
  };

  if (baseAttack.type !== "baseAttack" || baseAttack.unit !== "flat") {
    throw new Error(`武器のmain_propertyが基礎攻撃力ではありません: ${weapon.name}`);
  }

  const subStat = weapon.sub_property
    ? (() => {
        const unit = getStatUnit(weapon.sub_property.final);

        return {
          type: getStatType(weapon.sub_property.property_type, propertyMap),
          unit,
          value: parseStatValue(weapon.sub_property.final, unit),
        };
      })()
    : null;

  return {
    name: weapon.name,
    level: weapon.level,
    ascensionLevel: weapon.promote_level,
    refinementLevel: weapon.affix_level,
    baseAttack: baseAttack.value,
    subStat,
  };
}

export function normalizeCharacter(
  character: RawGenshinCharacter,
  propertyMap: PropertyMap,
): GenshinCharacter {
  const element = normalizeElement(character.base.element);

  return {
    masterName: getCharacterMasterName(character.base.name, element),
    element,
    level: character.base.level,
    friendshipLevel: character.base.fetter,
    constellationLevel: character.base.actived_constellation_num,
    weapon: normalizeWeapon(character.weapon, propertyMap),
    artifacts: character.relics.map((artifact) =>
      normalizeArtifact(artifact, propertyMap),
    ),
    displayedStats: character.selected_properties.map((property) =>
      normalizeCharacterStat(property, propertyMap),
    ),
    baseStats: character.base_properties.map((property) =>
      normalizeCharacterStat(property, propertyMap),
    ),
    extraStats: character.extra_properties.map((property) =>
      normalizeCharacterStat(property, propertyMap),
    ),
    elementalStats: character.element_properties.map((property) =>
      normalizeCharacterStat(property, propertyMap),
    ),
    skills: character.skills.map((skill) => ({
      skillId: skill.skill_id,
      level: skill.level,
    })),
  };
}
