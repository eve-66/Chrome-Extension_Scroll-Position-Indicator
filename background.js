let globalEnabled = true;

function iconPathsForCurrentState() {
  if (globalEnabled) {
    return {
      16: "icons/icon_active_16.png",
      32: "icons/icon_active_32.png",
    };
  }
  return {
    16: "icons/icon_inactive_16.png",
    32: "icons/icon_inactive_32.png",
  };
}

async function setIcon(tabId) {
  if (!tabId) return;
  try {
    await chrome.action.setIcon({
      tabId,
      path: iconPathsForCurrentState(),
    });
  } catch (e) {
    // 無視でOK
  }
}

async function notifyTab(tabId) {
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "TOGGLE_SCROLL_INDICATOR",
      enabled: globalEnabled,
    });
  } catch (e) {
    // content script未注入ページなど
  }
}

async function syncAllTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    await setIcon(tab.id);
    await notifyTab(tab.id);
  }
}

chrome.action.onClicked.addListener(async () => {
  globalEnabled = !globalEnabled;
  await syncAllTabs();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_GLOBAL_SCROLL_INDICATOR_STATE") {
    sendResponse({ enabled: globalEnabled });
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.id) await setIcon(tab.id);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === "loading" || changeInfo.status === "complete") {
    await setIcon(tabId);

    if (changeInfo.status === "complete") {
      await notifyTab(tabId);
    }
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await setIcon(tabId);
});
