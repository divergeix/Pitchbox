/// <reference types="chrome"/>

import { addToScanHistory, trackScan } from '../lib/storage';

// Open side panel on extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Set side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'pitchbox-scan',
    title: 'Analyze with PitchBox',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pitchbox-scan' && tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
    // Trigger scan
    chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' }, (response) => {
      if (response) {
        chrome.runtime.sendMessage({ type: 'SCAN_COMPLETE', data: response });
      }
    });
  }
});

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_COMPLETE') {
    // Store scan result and track usage
    trackScan();
    addToScanHistory(message.data.domain, message.data.detections.length);
  }

  if (message.type === 'REQUEST_SCAN') {
    const tabId = message.tabId;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { type: 'SCAN_PAGE' }, (response) => {
        sendResponse(response);
      });
      return true; // async
    }
  }

  if (message.type === 'GET_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs[0] || null);
    });
    return true;
  }
});

// Badge update on scan
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SCAN_COMPLETE' && message.data) {
    const count = message.data.detections?.length || 0;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  }
});
