import React, { useState } from 'react';
import { OutreachAngle } from '../../lib/angles/rules-engine';
import { CompanyProfile } from '../../lib/company/identity';
import { Signal } from '../../lib/signals/commercial';
import { DetectionResult } from '../../lib/detectors/cms';
import { UserSettings } from '../../lib/storage';
import { generateDraft, DraftResult } from '../../lib/drafts/generator';
import { PERSONAS } from '../../lib/drafts/personas';
import { TONES } from '../../lib/drafts/tones';
import { TEMPLATES, TemplateType } from '../../lib/drafts/templates';
import { checkDraftAllowed } from '../../lib/usage-meter';
import { trackDraft } from '../../lib/storage';

interface Props {
  angle: OutreachAngle;
  company: CompanyProfile;
  signals: Signal[];
  detections: DetectionResult[];
  settings: UserSettings;
}

export function DraftCard({ angle, company, signals, detections, settings }: Props) {
  const [personaId, setPersonaId] = useState(settings.defaultPersona || 'marketing');
  const [toneId, setToneId] = useState(settings.defaultTone || 'direct');
  const [templateType, setTemplateType] = useState<TemplateType>('cold-email');
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!settings.apiKey) {
      setError('Add your Claude API key in Settings first.');
      return;
    }

    const usage = await checkDraftAllowed();
    if (!usage.allowed) {
      setError('Daily draft limit reached. Upgrade to Pro for unlimited drafts.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateDraft({
        angle, company, signals, detections, personaId, toneId, templateType,
        userContext: {
          userName: settings.userName,
          companyName: settings.companyName,
          role: settings.role,
          serviceOffering: settings.serviceOffering,
        },
      }, settings.apiKey);

      setDraft(result);
      await trackDraft();
    } catch (e: any) {
      setError(e.message || 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!draft) return;
    const text = draft.subjectLine
      ? `Subject: ${draft.subjectLine}\n\n${draft.body}`
      : draft.body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      <div className="section-title">Generate Outreach</div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <label className="text-[10px] text-pitch-text-muted uppercase block mb-1">Type</label>
          <select
            value={templateType}
            onChange={e => setTemplateType(e.target.value as TemplateType)}
            className="input-field text-xs py-1.5"
          >
            <option value="cold-email">Email</option>
            <option value="linkedin-dm">LinkedIn</option>
            <option value="cold-call-opener">Call</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-pitch-text-muted uppercase block mb-1">Persona</label>
          <select
            value={personaId}
            onChange={e => setPersonaId(e.target.value)}
            className="input-field text-xs py-1.5"
          >
            {PERSONAS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-pitch-text-muted uppercase block mb-1">Tone</label>
          <select
            value={toneId}
            onChange={e => setToneId(e.target.value)}
            className="input-field text-xs py-1.5"
          >
            {TONES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary w-full text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
            Generating...
          </>
        ) : (
          'Generate Draft'
        )}
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-2.5 text-red-400 text-xs mt-2">
          {error}
        </div>
      )}

      {/* Draft output */}
      {draft && (
        <div className="mt-3 space-y-2">
          {draft.subjectLine && (
            <div>
              <p className="text-[10px] text-pitch-text-muted uppercase mb-0.5">Subject</p>
              <p className="text-sm text-pitch-text font-medium">{draft.subjectLine}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-pitch-text-muted uppercase mb-0.5">Body</p>
            <div className="bg-pitch-bg border border-pitch-border rounded-lg p-3 text-sm text-pitch-text whitespace-pre-wrap leading-relaxed">
              {draft.body}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleCopy} className="btn-primary text-xs flex-1">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleGenerate} disabled={loading} className="btn-secondary text-xs flex-1">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
