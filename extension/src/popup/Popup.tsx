import React, { useEffect, useState } from 'react';
import { getScanHistory, getUserPlan } from '../lib/storage';
import { checkScanAllowed, UsageCheck } from '../lib/usage-meter';

export default function Popup() {
  const [usage, setUsage] = useState<UsageCheck | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ domain: string; timestamp: number; detectionCount: number }>>([]);

  useEffect(() => {
    checkScanAllowed().then(setUsage);
    getScanHistory().then(setRecentScans);
  }, []);

  const openSidePanel = () => {
    chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB' }, (tab: chrome.tabs.Tab | null) => {
      if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id });
        window.close();
      }
    });
  };

  return (
    <div className="w-72 bg-pitch-bg text-pitch-text p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-pitch-accent flex items-center justify-center text-white font-bold">P</div>
        <div>
          <h1 className="font-semibold text-sm">PitchBox</h1>
          <p className="text-[10px] text-pitch-text-muted">Website intelligence to outreach</p>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="card mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-pitch-text-muted">Plan</span>
            <span className={usage.plan === 'pro' ? 'text-pitch-accent' : 'text-pitch-text-muted'}>
              {usage.plan === 'pro' ? 'Pro' : 'Free'}
            </span>
          </div>
          {usage.plan === 'free' && (
            <>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-pitch-text-muted">Scans left today</span>
                <span>{usage.scansRemaining}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-pitch-text-muted">Drafts left today</span>
                <span>{usage.draftsRemaining}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Open sidebar */}
      <button onClick={openSidePanel} className="btn-primary w-full text-sm mb-3">
        Open PitchBox Panel
      </button>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div>
          <p className="section-title">Recent Scans</p>
          <div className="space-y-1">
            {recentScans.slice(0, 5).map((scan, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-pitch-text truncate max-w-[160px]">{scan.domain}</span>
                <span className="text-pitch-text-muted">{scan.detectionCount} found</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
