"use client";

import { useState } from "react";
import { syncGenshin } from "@/lib/actions/genshin";
import { prepareGenshinSyncData } from "@/lib/genshin/prepare-sync-data";
import { rawGenshinSyncDataSchema } from "@/lib/genshin/sync-schema";
import { UserFacingError } from "@/lib/errors";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setMessage(null);

      const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;

      if (!extensionId) {
        throw new UserFacingError("Extension IDが設定されていません");
      }

      if (typeof chrome === "undefined" || !chrome.runtime.sendMessage) {
        throw new UserFacingError("Chrome拡張機能を利用できません");
      }

      const result = await chrome.runtime.sendMessage(extensionId, {
        type: "SYNC",
      });

      if (!result) {
        throw new UserFacingError("拡張機能から応答がありませんでした");
      }

      if (!result.success) {
        throw new UserFacingError(result.message);
      }

      const parsedBody = rawGenshinSyncDataSchema.parse(result.body);

      const data = prepareGenshinSyncData(parsedBody);

      console.log("HoYoLABから取得したアカウント:", data.account);
      console.log("同期するキャラ数:", data.characters.length);
      console.log("同期するキャラ一覧:", data.characters);

      const syncResult = await syncGenshin(data);

      if (!syncResult.success) {
        throw new UserFacingError(syncResult.message);
      }

      console.log("同期結果:", syncResult);

      setMessage({ type: "success", text: syncResult.message });
    } catch (error) {
      if (error instanceof UserFacingError) {
        setMessage({ type: "error", text: error.message });
      } else {
        console.error("同期エラー:", error);

        setMessage({
          type: "error",
          text: "同期に失敗しました。しばらくしてからもう一度お試しください。",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
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

      {message && (
        <p
          className={
            message.type === "error"
              ? "text-sm text-red-500"
              : "text-sm text-green-600"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
