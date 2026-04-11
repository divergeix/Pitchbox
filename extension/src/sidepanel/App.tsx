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
import { getSettings, UserSettings, trackScan, addToScanHistory } from '../lib/storage';

type Tab = 'scan' | 'prospects' | 'settings';

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

  useEffect(() => {
    getSettings().then(setSettings);
    checkScanAllowed().then(setUsageCheck);
  }, []);

  // Listen for auto-scan results
  useEffect(() => {
    const handler = (message: any) => {
      if (message.type === 'SCAN_COMPLETE' && message.data) {
        processScanResult(message.data);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const processScanResult = useCallback((result: ScanResult) => {
    setScanResult(result);
    if (result.isCompanyWebsite) {
      const commercial = detectCommercialSignals(result.detections, result.company);
      const operational = detectOperationalSignals(result.detections, result.company);
      const negative = detectNegativeSignals(result.detections, result.company);
      const allSignals = [...commercial, ...operational, ...negative];
      setSignals(allSignals);
      const generatedAngles = generateAngles(allSignals, result.detections, result.company);
      setAngles(generatedAngles);
      setSelectedAngle(generatedAngles[0] || null);
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

    try {
      chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB' }, (tab: chrome.tabs.Tab | null) => {
        if (!tab?.id) {
          setError('No active tab found');
          setScanning(false);
          return;
        }
        chrome.runtime.sendMessage({ type: 'REQUEST_SCAN', tabId: tab.id }, (response: ScanResult) => {
          if (chrome.runtime.lastError) {
            setError('Could not scan this page. Try refreshing the page.');
            setScanning(false);
            return;
          }
          if (response) {
            trackScan();
            addToScanHistory(response.domain, response.detections.length);
            processScanResult(response);
            checkScanAllowed().then(setUsageCheck);
          } else {
            setError('No scan data returned. This page may not be supported.');
            setScanning(false);
          }
        });
      });
    } catch (e: any) {
      setError(e.message || 'Scan failed');
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-pitch-bg text-pitch-text">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-pitch-bg border-b border-pitch-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pitch-accent flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="font-semibold text-base">PitchBox</span>
          </div>
          {usageCheck && usageCheck.plan === 'free' && (
            <span className="text-xs text-pitch-text-muted">
              {usageCheck.scansRemaining} scans left today
            </span>
          )}
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 mt-3">
          {(['scan', 'prospects', 'settings'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-pitch-accent text-white'
                  : 'text-pitch-text-muted hover:bg-pitch-border'
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
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {scanResult && !scanResult.isCompanyWebsite && (
              <div className="card text-center text-pitch-text-muted text-sm py-8">
                This doesn't look like a company website. Try visiting a company's homepage.
              </div>
            )}

            {scanResult && scanResult.isCompanyWebsite && (
              <>
                <CompanyCard company={scanResult.company} detectionCount={scanResult.detections.length} />
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
              <div className="card text-center text-pitch-text-muted text-sm py-8">
                Visit a company website and click <strong>Scan This Page</strong> to analyze it.
              </div>
            )}
          </>
        )}

        {activeTab === 'prospects' && <ProspectList />}
        {activeTab === 'settings' && <Settings onSave={() => getSettings().then(setSettings)} />}
      </main>
    </div>
  );
}
