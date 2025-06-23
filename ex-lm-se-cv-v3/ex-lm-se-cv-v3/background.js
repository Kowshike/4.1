chrome.runtime.onInstalled.addListener(() => {
    loadRulesFromURL();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'refreshRules') {
        loadRulesFromURL();
        sendResponse({ message: 'Data has been refreshed successfully!' });
    }
});

function loadRulesFromURL() {
    fetch('https://softpage.live/extensions/lms/seb/config.json?r=' + Math.random())
        .then(response => response.json())
        .then(rules => {
            if (rules) {
                applyRules(rules);
            }
        })
        .catch(error => {
            console.error('Error fetching rules from URL:', error);
        });
}

function applyRules(rules) {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(rule => rule.id)
    }, () => {
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: rules.map(rule => ({
                id: rule.id,
                action: rule.action,
                condition: rule.condition
            }))
        });
    });
}

chrome.runtime.onSuspend.addListener(() => {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ['header_rules']
    });
});
