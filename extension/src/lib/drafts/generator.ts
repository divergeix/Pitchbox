import { OutreachAngle } from '../angles/rules-engine';
import { CompanyProfile } from '../company/identity';
import { Signal } from '../signals/commercial';
import { DetectionResult } from '../detectors/cms';
import { Persona, PERSONAS } from './personas';
import { Tone, TONES } from './tones';
import { TemplateType } from './templates';
import { callClaude } from '../claude-api';

export interface DraftRequest {
  angle: OutreachAngle;
  company: CompanyProfile;
  signals: Signal[];
  detections: DetectionResult[];
  personaId: string;
  toneId: string;
  templateType: TemplateType;
  userContext?: {
    userName?: string;
    companyName?: string;
    role?: string;
    serviceOffering?: string;
  };
}

export interface DraftResult {
  subjectLine: string;
  body: string;
  type: TemplateType;
  personaId: string;
  toneId: string;
  angleId: string;
}

export async function generateDraft(request: DraftRequest, apiKey: string): Promise<DraftResult> {
  const persona = PERSONAS.find(p => p.id === request.personaId) || PERSONAS[0];
  const tone = TONES.find(t => t.id === request.toneId) || TONES[0];

  const systemPrompt = buildSystemPrompt(persona, tone, request.templateType);
  const userPrompt = buildUserPrompt(request);

  const response = await callClaude(apiKey, systemPrompt, userPrompt);

  return parseDraftResponse(response, request);
}

function buildSystemPrompt(persona: Persona, tone: Tone, type: TemplateType): string {
  const typeInstructions: Record<TemplateType, string> = {
    'cold-email': `Generate a cold email. Include a subject line on the first line prefixed with "Subject: ". Then a blank line. Then the email body. Keep it under 80 words. No greeting like "Hi [Name]" - start with the hook. End with a soft CTA (question, not a demand).`,
    'linkedin-dm': `Generate a LinkedIn direct message. No subject line needed. Keep it under 50 words. Conversational, not formal. One clear idea. End with a question.`,
    'cold-call-opener': `Generate a cold call opening script. Keep it under 40 words. It should be what you say in the first 15 seconds. Natural, not scripted-sounding. Mention the signal immediately.`,
  };

  return `You are an expert SDR copywriter. You write cold outreach that gets replies.

${tone.systemInstruction}

Target persona: ${persona.label} (${persona.description})

Format requirements:
${typeInstructions[type]}

Rules:
- Never use em dashes
- Never use "I hope this finds you well" or similar filler
- Never use "leverage" or "synergy" or "game-changer" or "revolutionary"
- Never start with a compliment about their website
- Always reference the specific signal or data point in the first 2 lines
- Never use more than one exclamation mark in the entire message
- Do not include [placeholder brackets] - use the actual company data provided
- Sound like a real human, not an AI
- Do not include any signature or sign-off name`;
}

function buildUserPrompt(request: DraftRequest): string {
  const { angle, company, signals, detections, userContext } = request;

  const techStack = detections.map(d => `${d.name} (${d.category})`).slice(0, 10).join(', ');
  const signalSummary = signals.slice(0, 5).map(s => `- ${s.title}: ${s.description}`).join('\n');

  let prompt = `Generate outreach for this prospect:

Company: ${company.name}
Domain: ${company.domain}
Industry: ${company.industry || 'Unknown'}
Type: ${company.type}
Estimated size: ${company.estimatedSize}

Tech stack detected: ${techStack || 'Minimal stack detected'}

Key signals:
${signalSummary || '- No specific signals detected'}

Selected angle: ${angle.title}
Angle insight: ${angle.description}
Suggested opener direction: ${angle.suggestedOpener}`;

  if (userContext?.companyName) {
    prompt += `\n\nSender's company: ${userContext.companyName}`;
  }
  if (userContext?.serviceOffering) {
    prompt += `\nSender's offering: ${userContext.serviceOffering}`;
  }
  if (userContext?.userName) {
    prompt += `\nSender's name: ${userContext.userName}`;
  }

  return prompt;
}

function parseDraftResponse(response: string, request: DraftRequest): DraftResult {
  let subjectLine = '';
  let body = response.trim();

  if (request.templateType === 'cold-email') {
    const lines = body.split('\n');
    const subjectIdx = lines.findIndex(l => l.toLowerCase().startsWith('subject:'));
    if (subjectIdx !== -1) {
      subjectLine = lines[subjectIdx].replace(/^subject:\s*/i, '').trim();
      body = lines.slice(subjectIdx + 1).join('\n').trim();
    }
  }

  return {
    subjectLine,
    body,
    type: request.templateType,
    personaId: request.personaId,
    toneId: request.toneId,
    angleId: request.angle.id,
  };
}
