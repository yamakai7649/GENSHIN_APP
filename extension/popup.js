const syncButton = document.querySelector("#syncButton");

syncButton.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
      type: "SYNC",
  });
  
  console.log(response);
});
