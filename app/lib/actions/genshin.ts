"use server";

import type { GenshinSyncData } from "@/types/genshin";
import { getCurrentUser } from "@/lib/auth/user";
import { saveGenshinData } from "@/lib/genshin/sync";

export async function syncGenshin(data: GenshinSyncData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("ログインが必要です");
  }

  await saveGenshinData(user.id, data);

  return {
    success: true,
    message: "同期しました",
  };
}
