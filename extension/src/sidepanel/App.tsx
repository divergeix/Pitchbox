import React, { useState, useEffect, useCallback } from 'react';
import { ScanResult } from '../content/detector';
import { Signal } from '../lib/signals/commercial';
import { detectCommercialSignals } from '../lib/signals/commercial';
import { detectOperationalSignals } from '../lib/signals/operational';
import { detectNegativeSignals } from '../lib/signals/negative';
import { generateAngles, OutreachAngle } from '../lib/angles/rules-engine';
import { CompanyCard } from './components/CompanyCard';
import { StackCard } from './components/StackCard';
import { SignalCard } from './components/SignalCard';
import { AngleCard } from './components/AngleCard';
import { DraftCard } from './components/DraftCard';
import { ProspectList } from './components/ProspectList';
import { Settings } from './components/Settings';
import { checkScanAllowed, UsageCheck } from '../lib/usage-meter';
import { getSettings, UserSettings, trackScan, addToScanHistory, saveProspect, isProspectSaved, SavedProspect, getScanHistory } from '../lib/storage';
import { injectableScanner } from '../lib/injectable-scanner';
import { classifyCompanyWithAI } from '../lib/ai-classifier';

type Tab = 'scan' | 'prospects' | 'history' | 'settings';

interface ScanHistoryEntry {
  domain: string;
  timestamp: number;
  detectionCount: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [angles, setAngles] = useState<OutreachAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<OutreachAngle | null>(null);
  const [scanning, setScanning] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [usageCheck, setUsageCheck] = useState<UsageCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [prospectSaved, setProspectSaved] = useState(false);
  const [savingProspect, setSavingProspect] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);

  useEffect(() => {
    getSettings().then(setSettings);
    checkScanAllowed().then(setUsageCheck);
    getScanHistory().then(setScanHistory);
    // Load saved theme
    chrome.storage.local.get('pitchbox_theme', (result) => {
      if (result.pitchbox_theme) setTheme(result.pitchbox_theme);
    });
    // Restore last scan from session storage
    chrome.storage.session?.get('pitchbox_last_scan', (result) => {
      if (result?.pitchbox_last_scan) {
        processScanResult(result.pitchbox_last_scan);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    chrome.storage.local.set({ pitchbox_theme: theme });
  }, [theme]);

  const processScanResult = useCallback((result: ScanResult) => {
    setScanResult(result);
    setProspectSaved(false);
    if (result.isCompanyWebsite) {
      const commercial = detectCommercialSignals(result.detections, result.company);
      const operational = detectOperationalSignals(result.detections, result.company);
      const negative = detectNegativeSignals(result.detections, result.company);
      const allSignals = [...commercial, ...operational, ...negative];
      setSignals(allSignals);
      const generatedAngles = generateAngles(allSignals, result.detections, result.company);
      setAngles(generatedAngles);
      setSelectedAngle(generatedAngles[0] || null);
      // Check if already saved
      isProspectSaved(result.domain).then(setProspectSaved);
    } else {
      setSignals([]);
      setAngles([]);
      setSelectedAngle(null);
    }
    setScanning(false);
    setError(null);
  }, []);

  const handleScan = async () => {
    const usage = await checkScanAllowed();
    setUsageCheck(usage);
    if (!usage.allowed) {
      setError('Daily scan limit reached. Upgrade to Pro for unlimited scans.');
      return;
    }

    setScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

      if (!tab?.id || !tab.url) {
        setError('No active tab found. Make sure you have a website open.');
        setScanning(false);
        return;
      }

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
        setError('Cannot scan browser internal pages. Navigate to a company website first.');
        setScanning(false);
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectableScanner,
      });

      const scanData = results?.[0]?.result;
      if (scanData) {
        trackScan();
        addToScanHistory(scanData.domain, scanData.detections.length);
        chrome.storage.session?.set({ pitchbox_last_scan: scanData });
        processScanResult(scanData as ScanResult);
        checkScanAllowed().then(setUsageCheck);
        getScanHistory().then(setScanHistory);

        // AI-assisted classification (runs in background, updates when done)
        const currentSettings = await getSettings();
        if (currentSettings.apiKey && scanData.isCompanyWebsite) {
          classifyCompanyWithAI(
            currentSettings.apiKey,
            scanData.company,
            scanData.detections,
            scanData.company.type
          ).then((aiResult) => {
            if (aiResult.type !== scanData.company.type || aiResult.industry !== 'Unknown') {
              const updatedScan = {
                ...scanData,
                company: {
                  ...scanData.company,
                  type: aiResult.type,
                  industry: aiResult.industry,
                  aiClassified: true,
                  aiConfidence: aiResult.confidence,
                },
              };
              chrome.storage.session?.set({ pitchbox_last_scan: updatedScan });
              processScanResult(updatedScan as ScanResult);
            }
          }).catch(() => {}); // Silent fail - local classification still works
        }
      } else {
        setError('Could not scan this page. The site may be blocking scripts.');
        setScanning(false);
      }
    } catch (e: any) {
      setError(e.message || 'Scan failed');
      setScanning(false);
    }
  };

  const handleSaveProspect = async () => {
    if (!scanResult || !scanResult.isCompanyWebsite) return;
    setSavingProspect(true);
    const prospect: SavedProspect = {
      id: `${scanResult.domain}_${Date.now()}`,
      domain: scanResult.domain,
      companyName: scanResult.company.name,
      industry: scanResult.company.industry,
      type: scanResult.company.type,
      estimatedSize: scanResult.company.estimatedSize,
      detections: scanResult.detections,
      signals: signals,
      angles: angles,
      notes: '',
      tags: [],
      status: 'new',
      savedAt: Date.now(),
      lastVisited: Date.now(),
    };
    await saveProspect(prospect);
    setProspectSaved(true);
    setSavingProspect(false);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-pitch-bg text-pitch-text' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 px-4 py-3 border-b ${
        theme === 'dark' ? 'bg-pitch-bg border-pitch-border' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pitch-accent flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="font-semibold text-base">PitchBox</span>
          </div>
          <div className="flex items-center gap-3">
            {usageCheck && usageCheck.plan === 'free' && (
              <span className={`text-xs ${theme === 'dark' ? 'text-pitch-text-muted' : 'text-gray-500'}`}>
                {usageCheck.scansRemaining} scans left
              </span>
            )}
            <button
              onClick={toggleTheme}
              className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-pitch-border hover:bg-pitch-accent/20 text-pitch-text-muted'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '\u2600' : '\u263D'}
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 mt-3">
          {(['scan', 'history', 'prospects', 'settings'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-pitch-accent text-white'
                  : theme === 'dark'
                    ? 'text-pitch-text-muted hover:bg-pitch-border'
                    : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4">
        {activeTab === 'scan' && (
          <>
            {/* Scan button */}
            <button
              onClick={handleScan}
              disabled={scanning}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Scanning...
                </>
              ) : (
                'Scan This Page'
              )}
            </button>

            {error && (
              <div className={`border rounded-lg p-3 text-sm ${
                theme === 'dark'
                  ? 'bg-red-900/20 border-red-800/50 text-red-400'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {error}
              </div>
            )}

            {scanResult && !scanResult.isCompanyWebsite && (
              <div className={`rounded-lg text-center text-sm py-8 ${
                theme === 'dark' ? 'card text-pitch-text-muted' : 'bg-gray-50 border border-gray-200 text-gray-500'
              }`}>
                This doesn't look like a company website.<br />
                Try visiting a company's homepage (e.g. hubspot.com, shopify.com).
              </div>
            )}

            {scanResult && scanResult.isCompanyWebsite && (
              <>
                <CompanyCard company={scanResult.company} detectionCount={scanResult.detections.length} />

                {/* Save Prospect Button */}
                <button
                  onClick={handleSaveProspect}
                  disabled={prospectSaved || savingProspect}
                  className={`w-full text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-150 ${
                    prospectSaved
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-default'
                      : 'bg-pitch-accent hover:bg-pitch-accent-hover text-white'
                  }`}
                >
                  {savingProspect ? 'Saving...' : prospectSaved ? 'Prospect Saved' : 'Save Prospect'}
                </button>

                <StackCard detections={scanResult.detections} />
                <SignalCard signals={signals} />
                {angles.length > 0 && (
                  <AngleCard
                    angles={angles}
                    selectedAngle={selectedAngle}
                    onSelectAngle={setSelectedAngle}
                  />
                )}
                {selectedAngle && settings && (
                  <DraftCard
                    angle={selectedAngle}
                    company={scanResult.company}
                    signals={signals}
                    detections={scanResult.detections}
                    settings={settings}
                  />
                )}
              </>
            )}

            {!scanResult && !scanning && !error && (
              <div className={`rounded-lg text-center text-sm py-8 ${
                theme === 'dark' ? 'card text-pitch-text-muted' : 'bg-gray-50 border border-gray-200 text-gray-500'
              }`}>
                Visit a company website and click <strong>Scan This Page</strong> to analyze it.
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <p className="section-title">Recent Scans (Last 5)</p>
            {scanHistory.length === 0 ? (
              <div className={`rounded-lg text-center text-sm py-8 ${
                theme === 'dark' ? 'card text-pitch-text-muted' : 'bg-gray-50 border border-gray-200 text-gray-500'
              }`}>
                No scan history yet. Scan a website to get started.
              </div>
            ) : (
              scanHistory.slice(0, 5).map((entry, i) => (
                <div key={i} className="card flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-pitch-text' : 'text-gray-900'}`}>
                      {entry.domain}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-pitch-text-muted' : 'text-gray-500'}`}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="badge bg-pitch-accent/20 text-pitch-accent border border-pitch-accent/30">
                    {entry.detectionCount} found
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'prospects' && <ProspectList />}
        {activeTab === 'settings' && <Settings onSave={() => getSettings().then(setSettings)} />}
      </main>
    </div>
  );
}
