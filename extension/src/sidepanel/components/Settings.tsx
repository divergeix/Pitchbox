import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, UserSettings, getUserPlan, UserPlan } from '../../lib/storage';
import { getUsage, UsageData } from '../../lib/storage';

interface Props {
  onSave: () => void;
}

export function Settings({ onSave }: Props) {
  const [form, setForm] = useState<UserSettings>({
    apiKey: '', userName: '', companyName: '', role: '',
    serviceOffering: '', defaultTone: 'direct', defaultPersona: 'marketing', icpDescription: '',
  });
  const [plan, setPlan] = useState<UserPlan>('free');
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'none' | 'checking' | 'valid' | 'invalid'>('none');

  useEffect(() => {
    getSettings().then((s) => {
      setForm(s);
      if (s.apiKey) validateApiKey(s.apiKey);
    });
    getUserPlan().then(setPlan);
    getUsage().then(setUsage);
  }, []);

  const validateApiKey = async (key: string) => {
    if (!key || !key.startsWith('sk-ant-')) {
      setApiKeyStatus(key ? 'invalid' : 'none');
      return;
    }
    setApiKeyStatus('checking');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      setApiKeyStatus(res.ok ? 'valid' : 'invalid');
    } catch {
      setApiKeyStatus('invalid');
    }
  };

  const handleSave = async () => {
    await saveSettings(form);
    setSaved(true);
    onSave();
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (field: keyof UserSettings, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Plan & Usage */}
      <div className="card">
        <div className="section-title">Plan & Usage</div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-pitch-text">Current plan</span>
          <span className={`badge ${plan === 'pro' ? 'bg-pitch-accent/20 text-pitch-accent' : 'bg-pitch-border text-pitch-text-muted'}`}>
            {plan === 'pro' ? 'Pro' : 'Free'}
          </span>
        </div>
        {usage && (
          <div className="space-y-1 text-xs text-pitch-text-muted">
            <div className="flex justify-between">
              <span>Scans today</span>
              <span>{usage.scansToday}{plan === 'free' ? ' / 5' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Drafts today</span>
              <span>{usage.draftsToday}{plan === 'free' ? ' / 3' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Total scans</span>
              <span>{usage.totalScans}</span>
            </div>
          </div>
        )}
        {plan === 'free' && (
          <button className="btn-primary w-full mt-3 text-sm">
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* API Key */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <div className="section-title mb-0">Claude API Key</div>
          {apiKeyStatus === 'valid' && (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400"></span> Connected
            </span>
          )}
          {apiKeyStatus === 'invalid' && (
            <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400"></span> Invalid
            </span>
          )}
          {apiKeyStatus === 'checking' && (
            <span className="inline-flex items-center gap-1 text-[10px] text-yellow-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span> Checking...
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={form.apiKey}
            onChange={e => {
              updateField('apiKey', e.target.value);
              if (e.target.value.length > 10) validateApiKey(e.target.value);
              else setApiKeyStatus(e.target.value ? 'invalid' : 'none');
            }}
            placeholder="sk-ant-..."
            className={`input-field text-sm pr-16 ${
              apiKeyStatus === 'valid' ? 'border-green-500/50' :
              apiKeyStatus === 'invalid' ? 'border-red-500/50' : ''
            }`}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-pitch-accent"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-[10px] text-pitch-text-muted mt-1">
          Used for generating outreach drafts. Stored locally only.
        </p>
      </div>

      {/* User Profile */}
      <div className="card">
        <div className="section-title">Your Profile</div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-pitch-text-muted uppercase block mb-0.5">Name</label>
            <input
              type="text"
              value={form.userName}
              onChange={e => updateField('userName', e.target.value)}
              placeholder="Your name"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-pitch-text-muted uppercase block mb-0.5">Company</label>
            <input
              type="text"
              value={form.companyName}
              onChange={e => updateField('companyName', e.target.value)}
              placeholder="Your company name"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-pitch-text-muted uppercase block mb-0.5">Role</label>
            <input
              type="text"
              value={form.role}
              onChange={e => updateField('role', e.target.value)}
              placeholder="e.g. SDR, Founder, Agency Owner"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-pitch-text-muted uppercase block mb-0.5">Service Offering</label>
            <textarea
              value={form.serviceOffering}
              onChange={e => updateField('serviceOffering', e.target.value)}
              placeholder="What you sell or offer (used in draft personalization)"
              className="input-field text-sm h-16 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="card">
        <div className="section-title">Defaults</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-pitch-text-muted uppercase block mb-0.5">Tone</label>
            <select
              value={form.defaultTone}
              onChange={e => updateField('defaultTone', e.target.value)}
              className="input-field text-sm"
            >
              <option value="direct">Direct</option>
              <option value="consultative">Consultative</option>
              <option value="punchy">Punchy</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-pitch-text-muted uppercase block mb-0.5">Persona</label>
            <select
              value={form.defaultPersona}
              onChange={e => updateField('defaultPersona', e.target.value)}
              className="input-field text-sm"
            >
              <option value="marketing">Marketing</option>
              <option value="engineering">Engineering</option>
              <option value="operations">Operations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} className="btn-primary w-full text-sm">
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
