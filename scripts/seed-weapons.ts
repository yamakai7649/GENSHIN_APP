import { pool } from "../app/lib/db";

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

type WeaponDetail = {
  name: string;
  desc: string;
  icon_url: string;

  modules: {
    name: string;
    components: {
      data: string;
    }[];
  }[];

  filter_values: {
    weapon_rarity: {
      value_types: {
        enum_string: string;
      }[];
    };
  };
};

type StatusItem = {
  key: string;
  value: string[];
};

type StatusData = {
  list: StatusItem[];
};

type AscensionResponse = {
  list: unknown[];
};

async function getWeaponEntryPageIds(): Promise<string[]> {
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
          menu_id: "4",
          page_num: pageNum,
          page_size: pageSize,
          use_es: true,
        }),
      },
    );

    const result = await res.json();

    const list: { entry_page_id: string }[] = result.data.list;

    entryPageIds.push(...list.map((weapon) => weapon.entry_page_id));

    if (list.length < pageSize) {
      break;
    }

    pageNum++;
  }

  return entryPageIds;
}

async function getWeaponDetail(entryPageId: string): Promise<WeaponDetail> {
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

  const statusData: StatusData = JSON.parse(statusModule.components[0].data);

  const ascensionData: AscensionResponse = JSON.parse(
    ascensionModule.components[0].data,
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

  return {
    name: weaponDetail.name,
    description: weaponDetail.desc || null,
    icon: weaponDetail.icon_url || null,

    weapon_type: weaponType,

    rarity: Number(
      weaponDetail.filter_values.weapon_rarity.value_types[0].enum_string,
    ),

    sub_stat_type: getStatusValue("サブステータス"),

    acquisition_method: getStatusValue("入手方法"),

    passive_name: passive?.key ?? null,
    passive_effect: passive?.value[0] ?? null,

    ascension_data: ascensionData.list,

    release_version: getStatusValue("実装バージョン"),
  };
}

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

async function seedWeapons() {
  const entryPageIds = await getWeaponEntryPageIds();

  for (const entryPageId of entryPageIds) {
    const weaponDetail = await getWeaponDetail(entryPageId);

    const weapon = parseWeaponDetail(weaponDetail);

    await upsertWeaponMaster(weapon);
  }
}

async function main() {
  await seedWeapons();
}

main();
