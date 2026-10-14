import { pool } from "../app/lib/db";

type CharacterMaster = {
  name: string;
  description: string | null;
  element: string;
  rarity: number;
  weapon_type: string;
  region: string | null;
  ascension_stat: string | null;
  icon: string | null;
  image: string | null;
  talent_data: unknown[];
  constellation_data: unknown[];
};

type CharacterDetail = {
  name: string;
  desc: string;
  icon_url: string;
  header_img_url: string;

  modules: {
    name: string;
    components: {
      component_id: string;
      data: string;
    }[];
  }[];

  filter_values: {
    character_vision: {
      values: string[];
    };
    character_weapon: {
      values: string[];
    };
    character_property: {
      values: string[];
    };
    character_rarity: {
      values: string[];
    };
    character_region: {
      values: string[];
    };
  };
};

type TalentResponse = {
  list: unknown[];
};

type ConstellationResponse = {
  list: unknown[];
};

const skipCharacters = ["バレリー", "ミティヤ"];

async function getCharacterEntryPageIds(): Promise<string[]> {
  const entryPageIds: string[] = [];
  const pageSize = 30;
  let pageNum = 1;

  while (true) {
    const res = await fetch(
      "https://sg-act-public-api.hoyolab.com/hoyowiki/genshin/wapi/get_entry_page_list",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-rpc-language": "ja-jp",
          Referer: "https://wiki.hoyolab.com/",
        },
        body: JSON.stringify({
          filters: [],
          menu_id: "2",
          page_num: pageNum,
          page_size: pageSize,
          use_es: true,
        }),
      },
    );

    const result = await res.json();

    const list: { entry_page_id: string }[] = result.data.list;

    entryPageIds.push(...list.map((character) => character.entry_page_id));

    if (list.length < pageSize) {
      break;
    }

    pageNum++;
  }

  return entryPageIds;
}

async function getCharacterDetail(
  entryPageId: string,
): Promise<CharacterDetail> {
  const res = await fetch(
    `https://sg-act-public-api-static.hoyolab.com/hoyowiki/genshin/wapi/entry_page?entry_page_id=${entryPageId}`,
    {
      method: "GET",
      headers: {
        "x-rpc-language": "ja-jp",
      },
    },
  );

  const result = await res.json();

  return result.data.page;
}

function parseCharacterDetail(
  characterDetail: CharacterDetail,
): CharacterMaster {
  const talentModule = characterDetail.modules.find(
    (module) => module.name === "天賦",
  )!;

  const constellationModule = characterDetail.modules.find(
    (module) => module.name === "命ノ星座",
  )!;

  const talentComponent = talentModule.components.find(
    (component) => component.component_id === "talent",
  )!;

  const constellationComponent = constellationModule.components.find(
    (component) => component.component_id === "summaryList",
  )!;

  const talentData: TalentResponse = JSON.parse(talentComponent.data);

  const constellationData: ConstellationResponse = constellationComponent.data
    ? JSON.parse(constellationComponent.data)
    : { list: [] };

  return {
    name: characterDetail.name,

    description: characterDetail.desc || null,

    element: characterDetail.filter_values.character_vision.values[0] ?? "無",

    rarity: Number(
      characterDetail.filter_values.character_rarity.values[0].replace("★", ""),
    ),

    weapon_type: characterDetail.filter_values.character_weapon.values[0],

    region: characterDetail.filter_values.character_region.values[0] ?? null,

    ascension_stat:
      characterDetail.filter_values.character_property.values[0] ?? null,

    icon: characterDetail.icon_url || null,

    image: characterDetail.header_img_url || null,

    talent_data: talentData.list,

    constellation_data: constellationData.list,
  };
}

async function upsertCharacterMaster(character: CharacterMaster) {
  await pool.query(
    `
      INSERT INTO character_masters (
        name,
        description,
        element,
        rarity,
        weapon_type,
        region,
        ascension_stat,
        icon,
        image,
        talent_data,
        constellation_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (name)
      DO UPDATE SET
        description = EXCLUDED.description,
        element = EXCLUDED.element,
        rarity = EXCLUDED.rarity,
        weapon_type = EXCLUDED.weapon_type,
        region = EXCLUDED.region,
        ascension_stat = EXCLUDED.ascension_stat,
        icon = EXCLUDED.icon,
        image = EXCLUDED.image,
        talent_data = EXCLUDED.talent_data,
        constellation_data = EXCLUDED.constellation_data,
        updated_at = NOW()
    `,
    [
      character.name,
      character.description,
      character.element,
      character.rarity,
      character.weapon_type,
      character.region,
      character.ascension_stat,
      character.icon,
      character.image,
      JSON.stringify(character.talent_data),
      JSON.stringify(character.constellation_data),
    ],
  );
}

async function seedCharacters() {
  const entryPageIds = await getCharacterEntryPageIds();

  for (const entryPageId of entryPageIds) {
    const characterDetail = await getCharacterDetail(entryPageId);

    if (skipCharacters.includes(characterDetail.name)) {
      console.log(`スキップ: ${characterDetail.name}`);

      continue;
    }

    const character = parseCharacterDetail(characterDetail);

    await upsertCharacterMaster(character);

    console.log(`登録完了: ${character.name}`);
  }
}

async function main() {
  await seedCharacters();
}

main();
