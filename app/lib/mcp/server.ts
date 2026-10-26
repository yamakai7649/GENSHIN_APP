import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  getGenshinAccount,
  getGenshinAccountId,
} from "@/lib/genshin/queries/account";

import { getCharacter, listCharacters } from "@/lib/genshin/queries/characters";

import { listEquippedWeapons } from "@/lib/genshin/queries/weapons";

function success(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function failure(message: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
}

export function createMcpServer(userId: number) {
  const server = new McpServer({
    name: "genshin-app",
    version: "0.1.0",
  });

  server.registerTool(
    "get_account",
    {
      description: "ユーザーの同期済み原神アカウント情報を取得する。",
      inputSchema: z.object({}),
    },
    async () => {
      const account = await getGenshinAccount(userId);

      if (!account) {
        return failure("同期済みの原神アカウントがありません。");
      }

      return success(account);
    },
  );

  server.registerTool(
    "list_characters",
    {
      description:
        "ユーザーが所有している同期済みキャラクター一覧を取得する。レベル、凸数、好感度、装備武器の概要を含む。",
      inputSchema: z.object({}),
    },
    async () => {
      const accountId = await getGenshinAccountId(userId);

      if (!accountId) {
        return failure("同期済みの原神アカウントがありません。");
      }

      const characters = await listCharacters(accountId);

      return success(characters);
    },
  );

  server.registerTool(
    "get_character",
    {
      description:
        "指定したキャラクターの詳細な育成情報を取得する。ステータス、天賦、聖遺物、凸数、装備武器などを含む。",
      inputSchema: z.object({
        name: z
          .string()
          .min(1)
          .describe("取得するキャラクター名。例: 楓原万葉"),
      }),
    },
    async ({ name }) => {
      const accountId = await getGenshinAccountId(userId);

      if (!accountId) {
        return failure("同期済みの原神アカウントがありません。");
      }

      const character = await getCharacter(accountId, name);

      if (!character) {
        return failure(`キャラクター「${name}」が見つかりません。`);
      }

      return success(character);
    },
  );

  server.registerTool(
    "list_weapons",
    {
      description:
        "同期済みキャラクターが現在装備している武器一覧を取得する。武器インベントリ全体ではない。",
      inputSchema: z.object({}),
    },
    async () => {
      const accountId = await getGenshinAccountId(userId);

      if (!accountId) {
        return failure("同期済みの原神アカウントがありません。");
      }

      const weapons = await listEquippedWeapons(accountId);

      return success(weapons);
    },
  );

  return server;
}
