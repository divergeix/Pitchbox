export interface SavedProspect {
  id: string;
  domain: string;
  companyName: string;
  industry: string;
  type: string;
  estimatedSize: string;
  detections: any[];
  signals: any[];
  angles: any[];
  chosenAngle?: string;
  sentCopy?: string;
  notes: string;
  tags: string[];
  status: 'new' | 'researched' | 'contacted' | 'follow-up' | 'replied' | 'closed';
  savedAt: number;
  lastVisited: number;
}

export interface UserSettings {
  apiKey: string;
  userName: string;
  companyName: string;
  role: string;
  serviceOffering: string;
  defaultTone: string;
  defaultPersona: string;
  icpDescription: string;
}

export interface UsageData {
  scansToday: number;
  draftsToday: number;
  lastResetDate: string;
  totalScans: number;
  totalDrafts: number;
}

const STORAGE_KEYS = {
  PROSPECTS: 'pitchbox_prospects',
  SETTINGS: 'pitchbox_settings',
  USAGE: 'pitchbox_usage',
  SCAN_HISTORY: 'pitchbox_scan_history',
  AUTH_TOKEN: 'pitchbox_auth_token',
  USER_PLAN: 'pitchbox_user_plan',
};

// Settings
export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || {
    apiKey: '', userName: '', companyName: '', role: '',
    serviceOffering: '', defaultTone: 'direct', defaultPersona: 'marketing', icpDescription: '',
  };
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: { ...current, ...settings } });
}

// Prospects
export async function getProspects(): Promise<SavedProspect[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PROSPECTS);
  return result[STORAGE_KEYS.PROSPECTS] || [];
}

export async function saveProspect(prospect: SavedProspect): Promise<void> {
  const prospects = await getProspects();
  const existingIdx = prospects.findIndex(p => p.domain === prospect.domain);
  if (existingIdx >= 0) {
    prospects[existingIdx] = { ...prospects[existingIdx], ...prospect, lastVisited: Date.now() };
  } else {
    prospects.unshift(prospect);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.PROSPECTS]: prospects });
}

export async function deleteProspect(id: string): Promise<void> {
  const prospects = await getProspects();
  await chrome.storage.local.set({ [STORAGE_KEYS.PROSPECTS]: prospects.filter(p => p.id !== id) });
}

export async function isProspectSaved(domain: string): Promise<boolean> {
  const prospects = await getProspects();
  return prospects.some(p => p.domain === domain);
}

// Usage tracking
export async function getUsage(): Promise<UsageData> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USAGE);
  const usage: UsageData = result[STORAGE_KEYS.USAGE] || {
    scansToday: 0, draftsToday: 0, lastResetDate: '', totalScans: 0, totalDrafts: 0,
  };

  // Reset daily counters
  const today = new Date().toISOString().split('T')[0];
  if (usage.lastResetDate !== today) {
    usage.scansToday = 0;
    usage.draftsToday = 0;
    usage.lastResetDate = today;
    await chrome.storage.local.set({ [STORAGE_KEYS.USAGE]: usage });
  }

  return usage;
}

export async function trackScan(): Promise<UsageData> {
  const usage = await getUsage();
  usage.scansToday++;
  usage.totalScans++;
  await chrome.storage.local.set({ [STORAGE_KEYS.USAGE]: usage });
  return usage;
}

export async function trackDraft(): Promise<UsageData> {
  const usage = await getUsage();
  usage.draftsToday++;
  usage.totalDrafts++;
  await chrome.storage.local.set({ [STORAGE_KEYS.USAGE]: usage });
  return usage;
}

// Plan
export type UserPlan = 'free' | 'pro';

export async function getUserPlan(): Promise<UserPlan> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USER_PLAN);
  return result[STORAGE_KEYS.USER_PLAN] || 'free';
}

export async function setUserPlan(plan: UserPlan): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.USER_PLAN]: plan });
}

// Auth token
export async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
  return result[STORAGE_KEYS.AUTH_TOKEN] || null;
}

export async function setAuthToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.AUTH_TOKEN]: token });
}

export async function clearAuthToken(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
}

// Scan history
export async function getScanHistory(): Promise<Array<{ domain: string; timestamp: number; detectionCount: number }>> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SCAN_HISTORY);
  return result[STORAGE_KEYS.SCAN_HISTORY] || [];
}

export async function addToScanHistory(domain: string, detectionCount: number): Promise<void> {
  const history = await getScanHistory();
  history.unshift({ domain, timestamp: Date.now(), detectionCount });
  // Keep last 20
  const trimmed = history.slice(0, 20);
  await chrome.storage.local.set({ [STORAGE_KEYS.SCAN_HISTORY]: trimmed });
}
