chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "flamoid",
    title: "Flamoid",
    contexts: ["selection"]
  });
  // chrome.contextMenus.create({
  //   id: "ask",
  //   title: "Ask",
  //   contexts: ["selection"]
  // });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "flamoid") {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['flamoid.js']
    });
  }
  
  // if (info.menuItemId === "ask") {
  //   chrome.scripting.executeScript({
  //     target: {tabId: tab.id},
  //     files: ['utils.js', 'ask.js']
  //   });
  // }
});
