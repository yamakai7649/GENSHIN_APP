import { z } from "zod";
import { pool } from "../app/lib/db";
import { fetchHoyolabJson } from "./hoyolab-fetch";

// ========================================
// 1. Schema：HoYoWikiのRawデータ
// ========================================

const artifactSetListItemSchema = z.object({
  name: z.string(),
  icon_url: z.string(),

  display_field: z.object({
    single_set_effect: z.string(),
    two_set_effect: z.string(),
    four_set_effect: z.string(),
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
  icon: string | null;
  single_set_effect: string | null;
  two_set_effect: string | null;
  four_set_effect: string | null;
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
  return {
    name: item.name,
    icon: item.icon_url || null,
    single_set_effect: item.display_field.single_set_effect || null,
    two_set_effect: item.display_field.two_set_effect || null,
    four_set_effect: item.display_field.four_set_effect || null,
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
        four_set_effect
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name)
      DO UPDATE SET
        icon = EXCLUDED.icon,
        single_set_effect = EXCLUDED.single_set_effect,
        two_set_effect = EXCLUDED.two_set_effect,
        four_set_effect = EXCLUDED.four_set_effect,
        updated_at = NOW()
    `,
    [
      artifactSet.name,
      artifactSet.icon,
      artifactSet.single_set_effect,
      artifactSet.two_set_effect,
      artifactSet.four_set_effect,
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
