document.getElementById('saveButton').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKeyInput').value;
  chrome.storage.local.set({apiKey}, () => {
    window.close();
  });
});

chrome.storage.local.get(['apiKey'], function(result) {
  document.getElementById('apiKeyInput').value = result.apiKey;
});
