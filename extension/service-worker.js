chrome.runtime.onMessageExternal.addListener(async (message) => {
  if (message.type !== "SYNC") return;

  try {
    return await syncGenshin();
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "同期に失敗しました",
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

  // 全所持キャラ
  const characters = await getCharacters(uid, region);

  // 全キャラID
  const characterIds = characters.map(
    (character) => character.id
  );

  // 全キャラ詳細
  const characterDetails = await getCharacterDetails(
    uid,
    region,
    characterIds
  );

  return {
    success: true,
    body: {
      account: genshinAccount,
      characters: characterDetails,
    },
    message: "同期完了",
  };
}


async function getHoyolabUid() {
  const cookie = await chrome.cookies.get({
    url: "https://act.hoyolab.com/",
    name: "ltuid_v2",
  });

  return cookie?.value;
}


async function getGenshinAccount(hoyolabUid) {
  const res = await fetch(
    `https://sg-act-public-api.hoyolab.com/event/game_record/card/wapi/getGameRecordCard?uid=${hoyolabUid}`,
    {
      credentials: "include",
      headers: {
        "x-rpc-lang": "ja-jp",
        "x-rpc-language": "ja-jp",
      },
    }
  );

  const result = await res.json();

  return result.data.list.find(
    (account) => account.game_id === 2
  );
}


async function getCharacters(uid, region) {
  const res = await fetch(
    "https://sg-act-public-api.hoyolab.com/event/game_record/genshin/api/character/list",
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
      }),
    }
  );

  const result = await res.json();

  return result.data.list;
}


async function getCharacterDetails(uid, region, characterIds) {
  const res = await fetch(
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
    }
  );

  const result = await res.json();

  return result.data.list;
}
