import { z } from "zod";
import { pool } from "../app/lib/db";
import { fetchHoyolabJson } from "./hoyolab-fetch";

// ========================================
// 1. Schema：HoYoWikiのRawデータ
// ========================================

// キャラクター一覧API
const characterListSchema = z.object({
  list: z.array(
    z.object({
      entry_page_id: z.string(),
    }),
  ),
});

// キャラクター詳細API
const characterDetailSchema = z.object({
  name: z.string(),
  desc: z.string(),
  icon_url: z.string(),
  header_img_url: z.string(),

  modules: z.array(
    z.object({
      name: z.string(),
      components: z.array(
        z.object({
          component_id: z.string(),
          data: z.string(),
        }),
      ),
    }),
  ),

  filter_values: z.object({
    character_vision: z.object({
      values: z.array(z.string()),
    }),
    character_weapon: z.object({
      values: z.array(z.string()).min(1),
    }),
    character_property: z.object({
      values: z.array(z.string()),
    }),
    character_rarity: z.object({
      values: z.array(z.string()).min(1),
    }),
    character_region: z.object({
      values: z.array(z.string()),
    }),
  }),
});

// 天賦のレベル別倍率
const talentAttributeSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
});

// HoYoWikiの天賦
const talentSchema = z.object({
  title: z.string(),
  icon_url: z.string(),
  desc: z.string(),
  attributes: z.array(talentAttributeSchema).nullable(),
});

const talentDataSchema = z.object({
  list: z.array(talentSchema),
});

// HoYoWikiの命ノ星座
const constellationSchema = z.object({
  name: z.string(),
  icon_url: z.string(),
  desc: z.string(),
});

const constellationDataSchema = z.object({
  list: z.array(constellationSchema),
});

// スキップ判定用に名前だけ検証
const characterNameSchema = characterDetailSchema.pick({
  name: true,
});

type CharacterDetail = z.infer<typeof characterDetailSchema>;

type TalentMaster = z.infer<typeof talentSchema>;

type ConstellationMaster = z.infer<typeof constellationSchema> & {
  pos: number;
};

// ========================================
// 2. Type：DBに保存するデータ
// ========================================

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
  talent_data: TalentMaster[];
  constellation_data: ConstellationMaster[];
};

const skipCharacters = ["アナスターシャ", "ダニカ"];

// ========================================
// 3. Fetch：HoYoWikiからデータ取得
// ========================================

// キャラクター一覧からentry_page_idを取得
async function getCharacterEntryPageIds(): Promise<string[]> {
  const entryPageIds: string[] = [];
  const pageSize = 30;
  let pageNum = 1;

  while (true) {
    const data = await fetchHoyolabJson(
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

    const { list } = characterListSchema.parse(data);

    entryPageIds.push(...list.map((character) => character.entry_page_id));

    if (list.length < pageSize) {
      break;
    }

    pageNum++;
  }

  return entryPageIds;
}

// キャラクター1件のRawデータを取得
async function getCharacterDetail(entryPageId: string): Promise<unknown> {
  const data = await fetchHoyolabJson(
    `https://sg-act-public-api-static.hoyolab.com/hoyowiki/genshin/wapi/entry_page?entry_page_id=${entryPageId}`,
    {
      method: "GET",
      headers: {
        "x-rpc-language": "ja-jp",
      },
    },
  );

  return data.page;
}

// ========================================
// 4. Transform：必要な情報を選択・変換
// ========================================

function parseCharacterDetail(
  characterDetail: CharacterDetail,
): CharacterMaster {
  // 必要なModuleを取得
  const talentModule = characterDetail.modules.find(
    (module) => module.name === "天賦",
  );

  const constellationModule = characterDetail.modules.find(
    (module) => module.name === "命ノ星座",
  );

  if (!talentModule || !constellationModule) {
    throw new Error(`${characterDetail.name}: 必要なmoduleが見つかりません`);
  }

  // 必要なComponentを取得
  const talentComponent = talentModule.components.find(
    (component) => component.component_id === "talent",
  );

  const constellationComponent = constellationModule.components.find(
    (component) => component.component_id === "summaryList",
  );

  if (!talentComponent || !constellationComponent) {
    throw new Error(`${characterDetail.name}: 必要なcomponentが見つかりません`);
  }

  // JSON文字列をパースして検証
  const talentData = talentDataSchema.parse(JSON.parse(talentComponent.data));

  const constellationData = constellationDataSchema.parse(
    constellationComponent.data
      ? JSON.parse(constellationComponent.data)
      : { list: [] },
  );

  // DB保存用データに変換
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

    constellation_data: constellationData.list.map((constellation, index) => ({
      ...constellation,
      pos: index + 1,
    })),
  };
}

// ========================================
// 5. Database：キャラクターマスター保存
// ========================================

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
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11
      )
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

// ========================================
// 6. Main：Seed処理
// ========================================

async function seedCharacters() {
  const entryPageIds = await getCharacterEntryPageIds();

  for (const entryPageId of entryPageIds) {
    // ① Rawデータ取得
    const rawCharacter = await getCharacterDetail(entryPageId);

    // ② 名前だけ検証してスキップ判定
    const { name } = characterNameSchema.parse(rawCharacter);

    if (skipCharacters.includes(name)) {
      console.log(`スキップ: ${name}`);
      continue;
    }

    // ③ 詳細データを検証
    const characterDetail = characterDetailSchema.parse(rawCharacter);

    // ④ DB保存用データに変換
    const character = parseCharacterDetail(characterDetail);

    // ⑤ 保存
    await upsertCharacterMaster(character);

    console.log(`登録完了: ${character.name}`);
  }
}

async function main() {
  await seedCharacters();
}

main();
