const button = document.querySelector("#fetch-roles");
const result = document.querySelector("#result");

button.addEventListener("click", async () => {
  result.textContent = "取得中...";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_GAME_ROLES",
    });

    result.textContent = JSON.stringify(response, null, 2);
  } catch (error) {
    result.textContent = String(error);
  }
});
