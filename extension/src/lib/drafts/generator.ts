import { OutreachAngle } from '../angles/rules-engine';
import { CompanyProfile } from '../company/identity';
import { Signal } from '../signals/commercial';
import { DetectionResult } from '../detectors/cms';
import { Persona, PERSONAS } from './personas';
import { Tone, TONES } from './tones';
import { TemplateType } from './templates';
import { callClaude } from '../claude-api';

export type EmailLength = 'shorter' | 'medium' | 'longer' | 'custom';

export interface DraftRequest {
  angle: OutreachAngle;
  company: CompanyProfile;
  signals: Signal[];
  detections: DetectionResult[];
  personaId: string;
  toneId: string;
  templateType: TemplateType;
  emailLength?: EmailLength;
  customInput?: string;
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

  const systemPrompt = buildSystemPrompt(persona, tone, request.templateType, request.emailLength);
  const userPrompt = buildUserPrompt(request);

  const response = await callClaude(apiKey, systemPrompt, userPrompt);

  return parseDraftResponse(response, request);
}

function buildSystemPrompt(persona: Persona, tone: Tone, type: TemplateType, emailLength?: EmailLength): string {
  const emailLengthInstructions: Record<EmailLength, string> = {
    shorter: 'Keep the email body concise - around 60-80 words (under 500 characters). Short, punchy, one key idea.',
    medium: 'Write a medium-length email body - around 150-200 words (800-1200 characters). Include the insight, value prop, and a CTA.',
    longer: 'Write a detailed, high-value email body - around 300-400 words (1500-2000 characters). Include specific insights, a clear value proposition, proof points, and a compelling CTA. Make every paragraph earn its place.',
    custom: 'Follow the custom instructions provided by the user for length and content.',
  };

  const typeInstructions: Record<TemplateType, string> = {
    'cold-email': `Generate a cold email. Include a subject line on the first line prefixed with "Subject: ". Then a blank line. Then the email body. ${emailLengthInstructions[emailLength || 'medium']} No greeting like "Hi [Name]" - start with the hook. End with a soft CTA (question, not a demand).`,
    'linkedin-dm': `Generate a LinkedIn direct message. No subject line needed. Keep it under 50 words. Conversational, not formal. One clear idea. End with a question.`,
    'cold-call-opener': `Generate a cold call opening script. Keep it under 40 words. It should be what you say in the first 15 seconds. Natural, not scripted-sounding. Mention the signal immediately.`,
    'whatsapp': `Generate a WhatsApp message. No subject line needed. Keep it under 80 words. Casual and conversational - like texting a professional contact. Use short paragraphs (1-2 sentences each). No formal greetings. Start with the key insight. End with a simple question. Do not use bullet points or formatting.`,
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
  const { angle, company, signals, detections, userContext, customInput } = request;

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

  if (customInput) {
    prompt += `\n\nAdditional instructions from the user:\n${customInput}`;
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
