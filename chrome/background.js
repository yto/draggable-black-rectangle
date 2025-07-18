chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;
    chrome.tabs.sendMessage(tab.id, { action: 'addRect' });
});

chrome.commands.onCommand.addListener((command) => {
    if (command === 'add-rectangle') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) return;
            chrome.tabs.sendMessage(tabs[0].id, { action: 'addRect' });
        });
    }
});
