/// <reference types="chrome"/>

const activePanelTabs = new Set<number>();

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ enabled: false });
  chrome.contextMenus.create({
    id: 'pitchbox-scan',
    title: 'Analyze with PitchBox',
    contexts: ['page'],
  });
});

// User clicks extension icon - open sidepanel immediately (no await before open!)
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  const tabId = tab.id;
  // Set options and open in parallel - open() must be called synchronously in the gesture handler
  chrome.sidePanel.setOptions({ tabId, path: 'src/sidepanel/index.html', enabled: true });
  chrome.sidePanel.open({ tabId });
  activePanelTabs.add(tabId);
});

// Tab switch - just toggle enabled, never open
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (activePanelTabs.has(activeInfo.tabId)) {
    chrome.sidePanel.setOptions({ tabId: activeInfo.tabId, path: 'src/sidepanel/index.html', enabled: true }).catch(() => {});
  } else {
    chrome.sidePanel.setOptions({ tabId: activeInfo.tabId, enabled: false }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activePanelTabs.delete(tabId);
});

// Context menu - also a user gesture
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pitchbox-scan' && tab?.id) {
    const tabId = tab.id;
    chrome.sidePanel.setOptions({ tabId, path: 'src/sidepanel/index.html', enabled: true });
    chrome.sidePanel.open({ tabId });
    activePanelTabs.add(tabId);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SCAN_COMPLETE' && message.data) {
    const count = message.data.detections?.length || 0;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  }
});
