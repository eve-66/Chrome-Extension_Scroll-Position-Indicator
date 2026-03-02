const tabState = new Map();

chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    const current = tabState.get(tab.id) ?? false;
    const next = !current;
    tabState.set(tab.id, next);

    try {
        await chrome.tabs.sendMessage(tab.id, {
            type: "TOGGLE_SCROLL_INDICATOR",
            enabled: next,
        });
    } catch (e) {
        console.warn("Message send failed:", e);
    }

    chrome.action.setBadgeText({
        tabId: tab.id,
        text: next ? "ON" : "OFF",
    });

    chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: next ? "#16a34a" : "#6b7280"
    });
}) 

chrome.tabs.onRemoved.addListener((tabId) => {
    tabState.delete(tabId);
})
