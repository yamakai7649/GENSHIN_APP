chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC") {
    sendResponse({
      success: true,
      message: "同期完了",
    });
  }
});
