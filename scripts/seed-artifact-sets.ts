import { z } from "zod";
import { pool } from "../app/lib/db";
import { fetchHoyolabJson } from "./hoyolab-fetch";

// ========================================
// 1. Schema：HoYoWikiのRawデータ
// ========================================

const artifactSetListItemSchema = z.object({
  name: z.string().min(1),
  icon_url: z.string().min(1),

  display_field: z.object({
    single_set_effect: z.string(),
    two_set_effect: z.string(),
    four_set_effect: z.string(),

    flower_of_life_icon_url: z.string().optional(),
    plume_of_death_icon_url: z.string().optional(),
    sands_of_eon_icon_url: z.string().optional(),
    goblet_of_eonothem_icon_url: z.string().optional(),
    circlet_of_logos_icon_url: z.string().optional(),
  }),
});

const artifactSetListSchema = z.object({
  list: z.array(artifactSetListItemSchema),
});

type ArtifactSetListItem = z.infer<typeof artifactSetListItemSchema>;

// ========================================
// 2. Type：DBに保存するデータ
// ========================================

type ArtifactSetMaster = {
  name: string;
  icon: string;

  single_set_effect: string | null;
  two_set_effect: string | null;
  four_set_effect: string | null;

  flower_icon: string | null;
  plume_icon: string | null;
  sands_icon: string | null;
  goblet_icon: string | null;
  circlet_icon: string | null;
};

// ========================================
// 3. Fetch：HoYoWikiからデータ取得
// ========================================

async function getArtifactSetList(): Promise<ArtifactSetListItem[]> {
  const artifactSets: ArtifactSetListItem[] = [];
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
          menu_id: "5",
          page_num: pageNum,
          page_size: pageSize,
          use_es: true,
        }),
      },
    );

    const { list } = artifactSetListSchema.parse(data);

    artifactSets.push(...list);

    if (list.length < pageSize) {
      break;
    }

    pageNum++;
  }

  return artifactSets;
}

// ========================================
// 4. Transform：必要な情報を選択・変換
// ========================================

function parseArtifactSet(item: ArtifactSetListItem): ArtifactSetMaster {
  const field = item.display_field;

  return {
    name: item.name,
    icon: item.icon_url,

    single_set_effect: field.single_set_effect || null,
    two_set_effect: field.two_set_effect || null,
    four_set_effect: field.four_set_effect || null,

    flower_icon: field.flower_of_life_icon_url || null,
    plume_icon: field.plume_of_death_icon_url || null,
    sands_icon: field.sands_of_eon_icon_url || null,
    goblet_icon: field.goblet_of_eonothem_icon_url || null,
    circlet_icon: field.circlet_of_logos_icon_url || null,
  };
}

// ========================================
// 5. Database：聖遺物セットマスター保存
// ========================================

async function upsertArtifactSetMaster(artifactSet: ArtifactSetMaster) {
  await pool.query(
    `
      INSERT INTO artifact_set_masters (
        name,
        icon,
        single_set_effect,
        two_set_effect,
        four_set_effect,
        flower_icon,
        plume_icon,
        sands_icon,
        goblet_icon,
        circlet_icon
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (name)
      DO UPDATE SET
        icon = EXCLUDED.icon,
        single_set_effect = EXCLUDED.single_set_effect,
        two_set_effect = EXCLUDED.two_set_effect,
        four_set_effect = EXCLUDED.four_set_effect,
        flower_icon = EXCLUDED.flower_icon,
        plume_icon = EXCLUDED.plume_icon,
        sands_icon = EXCLUDED.sands_icon,
        goblet_icon = EXCLUDED.goblet_icon,
        circlet_icon = EXCLUDED.circlet_icon,
        updated_at = NOW()
    `,
    [
      artifactSet.name,
      artifactSet.icon,
      artifactSet.single_set_effect,
      artifactSet.two_set_effect,
      artifactSet.four_set_effect,
      artifactSet.flower_icon,
      artifactSet.plume_icon,
      artifactSet.sands_icon,
      artifactSet.goblet_icon,
      artifactSet.circlet_icon,
    ],
  );
}

// ========================================
// 6. Main：Seed処理
// ========================================

async function seedArtifactSets() {
  const artifactSetList = await getArtifactSetList();

  for (const item of artifactSetList) {
    const artifactSet = parseArtifactSet(item);

    await upsertArtifactSetMaster(artifactSet);

    console.log(`登録完了: ${artifactSet.name}`);
  }
}

async function main() {
  await seedArtifactSets();
}

main();
