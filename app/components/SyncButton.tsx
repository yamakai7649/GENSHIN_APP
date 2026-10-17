"use client";

import { useState } from "react";
import { syncGenshin } from "@/lib/actions/genshin";
import { prepareGenshinSyncData } from "@/lib/genshin/prepare-sync-data";
import { rawGenshinSyncDataSchema } from "@/lib/genshin/sync-schema";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);

      const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;

      if (!extensionId) {
        throw new Error("Extension IDが設定されていません");
      }

      if (typeof chrome === "undefined" || !chrome.runtime.sendMessage) {
        throw new Error("Chrome拡張機能を利用できません");
      }

      const result = await chrome.runtime.sendMessage(extensionId, {
        type: "SYNC",
      });

      if (!result) {
        throw new Error("拡張機能から応答がありませんでした");
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      const parsedBody = rawGenshinSyncDataSchema.parse(result.body);

      const data = prepareGenshinSyncData(parsedBody);

      const syncResult = await syncGenshin(data);

      console.log(syncResult);
    } catch (error) {
      console.error("同期エラー:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isSyncing}
      className="
        rounded-lg
        bg-black
        px-5
        py-2.5
        text-sm
        font-medium
        text-white
        transition
        hover:bg-gray-800
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {isSyncing ? "同期中..." : "原神データを同期"}
    </button>
  );
}
