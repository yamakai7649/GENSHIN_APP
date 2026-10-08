"use client";

import { useState } from "react";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);

      const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;

      if (!extensionId) {
        console.error("Extension IDが設定されていません");
        return;
      }

      if (
        typeof chrome === "undefined" ||
        !chrome.runtime?.sendMessage
      ) {
        console.error("Chrome拡張機能を利用できません");
        return;
      }

      const result = await chrome.runtime.sendMessage(
        extensionId,
        {
          type: "SYNC",
        }
      );

      console.log(result);
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
