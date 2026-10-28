import { pool } from "../app/lib/db";
import { fetchHoyolabJson } from "./hoyolab-fetch";

type ArtifactSetMaster = {
  name: string;
  icon: string | null;
  single_set_effect: string | null;
  two_set_effect: string | null;
  four_set_effect: string | null;
};

type ArtifactSetListItem = {
  name: string;
  icon_url: string;
  display_field: {
    single_set_effect: string;
    two_set_effect: string;
    four_set_effect: string;
  };
};

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

    const list: ArtifactSetListItem[] = data.list;

    artifactSets.push(...list);

    if (list.length < pageSize) {
      break;
    }

    pageNum++;
  }

  return artifactSets;
}

function parseArtifactSet(item: ArtifactSetListItem): ArtifactSetMaster {
  return {
    name: item.name,
    icon: item.icon_url || null,
    single_set_effect: item.display_field.single_set_effect || null,
    two_set_effect: item.display_field.two_set_effect || null,
    four_set_effect: item.display_field.four_set_effect || null,
  };
}

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
