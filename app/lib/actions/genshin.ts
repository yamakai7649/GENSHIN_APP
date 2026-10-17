"use server";

import { genshinSyncDataSchema } from "@/lib/genshin/sync-schema";
import { getCurrentUser } from "@/lib/auth/user";
import { saveGenshinData } from "@/lib/genshin/sync";

export async function syncGenshin(rawData: unknown) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, message: "ログインが必要です" };
  }

  const data = genshinSyncDataSchema.parse(rawData);

  await saveGenshinData(user.id, data);

  return {
    success: true,
    message: "同期しました",
  };
}
