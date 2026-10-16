export type GenshinSyncData = {
  account: GenshinAccount;
  overview: GenshinOverview;
  characters: GenshinCharacter[];
};

export type GenshinAccount = {
  game_role_id: string;
  region: string;
  region_name: string;
  nickname: string;
  level: number;
};

export type GenshinOverview = {
  role: {
    game_head_icon: string;
  };
  stats: unknown;
  world_explorations: unknown[];
  homes: unknown[];
};

type CharacterProperty = {
  property_type: number;
  base: string;
  add: string;
  final: string;
};

type CharacterSkill = {
  skill_id: number;
  level: number;
};

type CharacterWeapon = {
  name: string;
  level: number;
  promote_level: number;
  affix_level: number;

  main_property: {
    final: string;
  };

  sub_property: {
    final: string;
  } | null;
};

export type GenshinCharacter = {
  base: {
    name: string;
    element: string;
    fetter: number;
    level: number;
    actived_constellation_num: number;
  };

  weapon: CharacterWeapon;

  relics: unknown[];

  selected_properties: CharacterProperty[];
  base_properties: CharacterProperty[];
  extra_properties: CharacterProperty[];
  element_properties: CharacterProperty[];

  skills: CharacterSkill[];
};
