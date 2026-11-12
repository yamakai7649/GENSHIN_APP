import { z } from "zod";
import { pool } from "../app/lib/db";
import { fetchHoyolabJson } from "./hoyolab-fetch";

// ========================================
// 1. Schema：HoYoWikiのRawデータ
// ========================================

// 武器一覧API
const weaponListSchema = z.object({
  list: z.array(
    z.object({
      entry_page_id: z.string(),
    }),
  ),
});

// 武器詳細API
const weaponDetailSchema = z.object({
  name: z.string().min(1),
  desc: z.string(),
  icon_url: z.string(),

  modules: z.array(
    z.object({
      name: z.string(),
      components: z.array(
        z.object({
          data: z.string(),
        }),
      ),
    }),
  ),

  filter_values: z.object({
    weapon_rarity: z.object({
      value_types: z
        .array(
          z.object({
            enum_string: z.string(),
          }),
        )
        .min(1),
    }),
  }),
});

// ステータスModule内のJSON
const statusDataSchema = z.object({
  list: z.array(
    z.object({
      key: z.string(),
      value: z.array(z.string()),
    }),
  ),
});

// 突破Module内のJSON
const ascensionDataSchema = z.object({
  list: z.array(z.unknown()),
});

type WeaponDetail = z.infer<typeof weaponDetailSchema>;

// ========================================
// 2. Type：DBに保存するデータ
// ========================================

type WeaponMaster = {
  name: string;
  description: string | null;
  icon: string | null;

  weapon_type: string;
  rarity: number;
  sub_stat_type: string | null;

  acquisition_method: string | null;
  passive_name: string | null;
  passive_effect: string | null;

  ascension_data: unknown[];
  release_version: string | null;
};

// ========================================
// 3. Fetch：HoYoWikiからデータ取得
// ========================================

async function getWeaponEntryPageIds(): Promise<string[]> {
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
          menu_id: "4",
          page_num: pageNum,
          page_size: pageSize,
          use_es: true,
        }),
      },
    );

    const { list } = weaponListSchema.parse(data);

    entryPageIds.push(...list.map((weapon) => weapon.entry_page_id));

    if (list.length < pageSize) {
      break;
    }

    pageNum++;
  }

  return entryPageIds;
}

async function getWeaponDetail(entryPageId: string): Promise<unknown> {
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

function parseWeaponDetail(weaponDetail: WeaponDetail): WeaponMaster {
  const statusModule = weaponDetail.modules.find(
    (module) => module.name === "ステータス",
  );

  const ascensionModule = weaponDetail.modules.find(
    (module) => module.name === "突破",
  );

  if (!statusModule || !ascensionModule) {
    throw new Error(`${weaponDetail.name}: 必要なmoduleが見つかりません`);
  }

  // Moduleの中身を取得
  const statusComponent = statusModule.components[0];
  const ascensionComponent = ascensionModule.components[0];

  if (!statusComponent || !ascensionComponent) {
    throw new Error(`${weaponDetail.name}: 必要なcomponentが見つかりません`);
  }

  // JSON文字列をパースして検証
  const statusData = statusDataSchema.parse(JSON.parse(statusComponent.data));

  const ascensionData = ascensionDataSchema.parse(
    JSON.parse(ascensionComponent.data),
  );

  const getStatusValue = (key: string): string | null => {
    return statusData.list.find((item) => item.key === key)?.value[0] ?? null;
  };

  const fixedKeys = [
    "和名 / 英名",
    "入手方法",
    "種類",
    "サブステータス",
    "実装バージョン",
  ];

  const passive = statusData.list.find((item) => !fixedKeys.includes(item.key));

  const weaponType = getStatusValue("種類");

  if (!weaponType) {
    throw new Error(`${weaponDetail.name}: 武器種を取得できません`);
  }

  const rarity = Number(
    weaponDetail.filter_values.weapon_rarity.value_types[0].enum_string,
  );

  if (!Number.isInteger(rarity) || rarity < 1 || rarity > 5) {
    throw new Error(`${weaponDetail.name}: レアリティが不正です`);
  }

  return {
    name: weaponDetail.name,
    description: weaponDetail.desc || null,
    icon: weaponDetail.icon_url || null,

    weapon_type: weaponType,

    rarity,

    sub_stat_type: getStatusValue("サブステータス"),

    acquisition_method: getStatusValue("入手方法"),

    passive_name: passive?.key ?? null,
    passive_effect: passive?.value[0] ?? null,

    ascension_data: ascensionData.list,

    release_version: getStatusValue("実装バージョン"),
  };
}

// ========================================
// 5. Database：武器マスター保存
// ========================================

async function upsertWeaponMaster(weapon: WeaponMaster) {
  await pool.query(
    `
      INSERT INTO weapon_masters (
        name,
        description,
        icon,
        weapon_type,
        rarity,
        sub_stat_type,
        acquisition_method,
        passive_name,
        passive_effect,
        ascension_data,
        release_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (name)
      DO UPDATE SET
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        weapon_type = EXCLUDED.weapon_type,
        rarity = EXCLUDED.rarity,
        sub_stat_type = EXCLUDED.sub_stat_type,
        acquisition_method = EXCLUDED.acquisition_method,
        passive_name = EXCLUDED.passive_name,
        passive_effect = EXCLUDED.passive_effect,
        ascension_data = EXCLUDED.ascension_data,
        release_version = EXCLUDED.release_version,
        updated_at = NOW()
    `,
    [
      weapon.name,
      weapon.description,
      weapon.icon,
      weapon.weapon_type,
      weapon.rarity,
      weapon.sub_stat_type,
      weapon.acquisition_method,
      weapon.passive_name,
      weapon.passive_effect,
      JSON.stringify(weapon.ascension_data),
      weapon.release_version,
    ],
  );
}

// ========================================
// 6. Main：Seed処理
// ========================================

async function seedWeapons() {
  const entryPageIds = await getWeaponEntryPageIds();

  for (const entryPageId of entryPageIds) {
    const rawWeapon = await getWeaponDetail(entryPageId);

    const weaponDetail = weaponDetailSchema.parse(rawWeapon);

    const weapon = parseWeaponDetail(weaponDetail);

    await upsertWeaponMaster(weapon);

    console.log(`登録完了: ${weapon.name}`);
  }
}

async function main() {
  await seedWeapons();
}

main();
