// background.js

function safeSend(tabId, msg) {
    chrome.tabs.sendMessage(tabId, msg, response => {
        // エラーなら何もしない
        if (chrome.runtime.lastError) {
            // console.warn(chrome.runtime.lastError);
        }
    });
}

chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;
    safeSend(tab.id, { action: 'addRect' });
});

chrome.commands.onCommand.addListener((command) => {
    if (command !== 'add-rectangle') return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) return;
        safeSend(tab.id, { action: 'addRect' });
    });
});

// Handle saving and retrieving rectangle states
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const tabId = sender.tab?.id;
    if (!tabId) return;
    const key = 'tab_' + tabId;
    if (msg.type === 'saveState') {
        chrome.storage.local.get(key, data => {
            const all = data[key] || {};
            if (msg.state) {
                all[msg.id] = msg.state;
            } else {
                delete all[msg.id];
            }
            chrome.storage.local.set({ [key]: all });
        });
    } else if (msg.type === 'getTabStates') {
        chrome.storage.local.get(key, data => {
            sendResponse({ states: data[key] || {} });
        });
        return true;
    }
});

// On navigation or reload, trigger reload in content script
chrome.webNavigation.onCommitted.addListener(details => {
    if (details.frameId !== 0) return;
    safeSend(details.tabId, { type: 'reloadRects' });
});

