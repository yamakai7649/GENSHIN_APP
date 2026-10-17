chrome.runtime.onMessageExternal.addListener(async (message) => {
  if (message.type !== "SYNC") return;

  try {
    return await syncGenshin();
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "同期に失敗しました",
    };
  }
});

async function syncGenshin() {
  const hoyolabUid = await getHoyolabUid();

  if (!hoyolabUid) {
    return {
      success: false,
      message: "HoYoLAB UIDを取得できませんでした",
    };
  }

  const genshinAccount = await getGenshinAccount(hoyolabUid);

  if (!genshinAccount) {
    return {
      success: false,
      message: "原神アカウントを取得できませんでした",
    };
  }

  const uid = genshinAccount.game_role_id;
  const region = genshinAccount.region;

  // アカウント詳細
  const accountOverview = await getAccountOverview(uid, region);

  // indexのavatarsから全所持キャラIDを取得
  const characterIds = accountOverview.avatars.map((character) => character.id);

  // 全キャラ詳細
  const characterDetails = await getCharacterDetails(uid, region, characterIds);

  return {
    success: true,
    body: {
      account: genshinAccount,
      overview: accountOverview,
      characters: characterDetails,
    },
    message: "同期完了",
  };
}

async function fetchHoyolabJson(url, options) {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`HoYoLAB APIエラー: HTTP ${res.status}`);
  }

  const result = await res.json();

  if (result.retcode !== 0) {
    throw new Error(`HoYoLAB APIエラー: ${result.message ?? result.retcode}`);
  }

  return result.data;
}

async function getHoyolabUid() {
  const cookie = await chrome.cookies.get({
    url: "https://act.hoyolab.com/",
    name: "ltuid_v2",
  });

  return cookie?.value;
}

async function getGenshinAccount(hoyolabUid) {
  const data = await fetchHoyolabJson(
    `https://sg-act-public-api.hoyolab.com/event/game_record/card/wapi/getGameRecordCard?uid=${hoyolabUid}`,
    {
      credentials: "include",
      headers: {
        "x-rpc-lang": "ja-jp",
        "x-rpc-language": "ja-jp",
      },
    },
  );

  return data.list.find((account) => account.game_id === 2);
}

async function getAccountOverview(uid, region) {
  return await fetchHoyolabJson(
    `https://sg-act-public-api.hoyolab.com/event/game_record/genshin/api/index?avatar_list_type=0&server=${region}&role_id=${uid}`,
    {
      credentials: "include",
      headers: {
        "x-rpc-lang": "ja-jp",
        "x-rpc-language": "ja-jp",
      },
    },
  );
}

async function getCharacterDetails(uid, region, characterIds) {
  return await fetchHoyolabJson(
    "https://sg-act-public-api.hoyolab.com/event/game_record/genshin/api/character/detail",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-rpc-lang": "ja-jp",
        "x-rpc-language": "ja-jp",
      },
      body: JSON.stringify({
        role_id: uid,
        server: region,
        character_ids: characterIds,
      }),
    },
  );
}
