chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "flamoid",
    title: "Flamoid",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "flamoid") {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    });
  }
});
