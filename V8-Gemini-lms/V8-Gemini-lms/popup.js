chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateStatus') {
    document.getElementById('status').innerText = message.status;
  }
  if(message.type === 'showApiStatus'){
    document.getElementById('apiStatus').innerText = message.apiStatus;
  }
});