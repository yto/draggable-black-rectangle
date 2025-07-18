// background.js

// 安全に sendMessage を投げるヘルパー
function safeSend(tabId, msg) {
    chrome.tabs.sendMessage(tabId, msg, response => {
        // 受信側がいないときのエラーは握りつぶす
        if (chrome.runtime.lastError) {
            // console.warn(chrome.runtime.lastError);
        }
    });
}

// まずコンテンツスクリプトを注入してからメッセージ送信
function injectAndSend(tabId, message) {
    // content.js を対象タブにインジェクト
    chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
    }).then(() => {
        safeSend(tabId, message);
    }).catch(err => {
        // console.error('injectScript failed:', err);
    });
}

// ツールバーアイコンクリック
chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;
    injectAndSend(tab.id, { action: 'addRect' });
});

// コマンドショートカット
chrome.commands.onCommand.addListener((command) => {
    if (command !== 'add-rectangle') return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) return;
        injectAndSend(tab.id, { action: 'addRect' });
    });
});

// On navigation or reload, trigger reload in content script
chrome.webNavigation.onCommitted.addListener(details => {
    if (details.frameId !== 0) return;
    chrome.scripting.insertCSS({
        target: { tabId: details.tabId, allFrames: false },
        files: ["overlay.css"],
    });
    injectAndSend(details.tabId, { type: 'reloadRects' });
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
