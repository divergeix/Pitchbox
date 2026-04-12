// Content script - minimal, only for badge updates
// Actual scanning is done via chrome.scripting.executeScript from the sidepanel

export interface ScanResult {
  url: string;
  domain: string;
  timestamp: number;
  detections: any[];
  company: any;
  isCompanyWebsite: boolean;
}

// Listen for messages (kept for backward compatibility)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ alive: true });
  }
  return true;
});
