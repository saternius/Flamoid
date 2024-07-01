document.getElementById('saveButton').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKeyInput').value;
  const promptInstructions = document.getElementById('promptInstructions').value;
  console.log(promptInstructions)
  chrome.storage.local.set({apiKey, promptInstructions}, () => {
    window.close();
  });
});

chrome.storage.local.get(['apiKey', 'promptInstructions'], function(result) {
  document.getElementById('apiKeyInput').value = (result.apiKey)?(result.apiKey):"";
  document.getElementById('promptInstructions').value = (result.promptInstructions)?(result.promptInstructions):"";
});
