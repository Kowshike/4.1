document.getElementById('refreshButton').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'refreshRules' }, function(response) {
        alert(response.message);  // Show a message after the refresh
    });
});


