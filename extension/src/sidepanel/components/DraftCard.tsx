import React, { useState } from 'react';
import { OutreachAngle } from '../../lib/angles/rules-engine';
import { CompanyProfile } from '../../lib/company/identity';
import { Signal } from '../../lib/signals/commercial';
import { DetectionResult } from '../../lib/detectors/cms';
import { UserSettings } from '../../lib/storage';
import { generateDraft, DraftResult } from '../../lib/drafts/generator';
import { PERSONAS } from '../../lib/drafts/personas';
import { TONES } from '../../lib/drafts/tones';
import { TemplateType } from '../../lib/drafts/templates';
import { checkDraftAllowed } from '../../lib/usage-meter';
import { trackDraft } from '../../lib/storage';

export type EmailLength = 'shorter' | 'medium' | 'longer' | 'custom';

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
  const [emailLength, setEmailLength] = useState<EmailLength>('medium');
  const [customInput, setCustomInput] = useState('');
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  // Restore saved draft from session storage on mount
  React.useEffect(() => {
    const key = 'pitchbox_draft_' + angle.id;
    chrome.storage.session?.get(key, (result) => {
      if (result?.[key]) setDraft(result[key]);
    });
  }, [angle.id]);

  // Save draft to session storage whenever it changes
  React.useEffect(() => {
    if (draft) {
      const key = 'pitchbox_draft_' + draft.angleId;
      chrome.storage.session?.set({ [key]: draft });
    }
  }, [draft]);

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
        emailLength,
        customInput: customInput.trim() || undefined,
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

  const getDraftText = () => {
    if (!draft) return '';
    return draft.subjectLine
      ? `Subject: ${draft.subjectLine}\n\n${draft.body}`
      : draft.body;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getDraftText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft.body);
    setWhatsappCopied(true);
    setTimeout(() => setWhatsappCopied(false), 2000);
  };

  const isEmail = templateType === 'cold-email';

  return (
    <div className="card">
      <div className="section-title">Generate Outreach</div>

      {/* Row 1: Type, Persona, Tone */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-pitch-text-muted uppercase block mb-1">Type</label>
          <select
            value={templateType}
            onChange={e => setTemplateType(e.target.value as TemplateType)}
            className="input-field text-xs py-1.5"
          >
            <option value="cold-email">Email</option>
            <option value="linkedin-dm">LinkedIn</option>
            <option value="whatsapp">WhatsApp</option>
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

      {/* Row 2: Email length (only for emails) */}
      {isEmail && (
        <div className="mb-2">
          <label className="text-[10px] text-pitch-text-muted uppercase block mb-1">Length</label>
          <div className="flex gap-1">
            {([
              { id: 'shorter', label: 'Shorter', desc: '~80 words' },
              { id: 'medium', label: 'Medium', desc: '~200 words' },
              { id: 'longer', label: 'Longer', desc: '~400 words' },
              { id: 'custom', label: 'Custom', desc: '' },
            ] as const).map(opt => (
              <button
                key={opt.id}
                onClick={() => setEmailLength(opt.id)}
                className={`flex-1 py-1 text-[10px] rounded-md transition-colors ${
                  emailLength === opt.id
                    ? 'bg-pitch-accent text-white'
                    : 'bg-pitch-border text-pitch-text-muted hover:bg-pitch-accent/20'
                }`}
                title={opt.desc}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom input */}
      <div className="mb-3">
        <label className="text-[10px] text-pitch-text-muted uppercase block mb-1">
          {emailLength === 'custom' && isEmail ? 'Custom instructions (required)' : 'Additional context (optional)'}
        </label>
        <textarea
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          placeholder={emailLength === 'custom' && isEmail
            ? "e.g. Focus on AI automation, mention we helped a similar agency save 20hrs/week..."
            : "e.g. Mention our free audit offer, reference their recent blog post..."}
          className="input-field text-xs h-14 resize-none"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || (emailLength === 'custom' && isEmail && !customInput.trim())}
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
            <div className="bg-pitch-bg border border-pitch-border rounded-lg p-3 text-sm text-pitch-text whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {draft.body}
            </div>
          </div>

          <p className="text-[10px] text-pitch-text-muted text-right">
            {getDraftText().length} characters
          </p>

          <div className="flex gap-2">
            <button onClick={handleCopy} className="btn-primary text-xs flex-1">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {draft.type === 'whatsapp' && (
              <button
                onClick={handleWhatsAppCopy}
                className="text-xs flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-150 bg-green-600 hover:bg-green-700 text-white"
              >
                {whatsappCopied ? 'Copied!' : 'Copy for WhatsApp'}
              </button>
            )}
            <button onClick={handleGenerate} disabled={loading} className="btn-secondary text-xs flex-1">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
