import { callClaude } from '../claude-api';
import { OutreachAngle, AngleCategory } from './rules-engine';

export async function generateAIAngles(
  apiKey: string,
  company: any,
  detections: any[],
  existingAngles: OutreachAngle[],
  signals: any[],
): Promise<OutreachAngle[]> {
  const techList = detections.filter((d: any) => d.category !== 'SEO').map((d: any) => d.name).join(', ');
  const signalList = signals.slice(0, 5).map((s: any) => s.title).join(', ');
  const existingTitles = existingAngles.map(a => a.title).join(', ');

  const prompt = `You are a senior SDR strategist. Based on this company scan data, generate 3-5 UNIQUE outreach angles that are SPECIFIC to this company. Do NOT repeat generic angles.

Company: ${company.name} (${company.domain})
Industry: ${company.industry || company.type || 'Unknown'}
Type: ${company.type}
Description: ${company.description || 'N/A'}
Tech stack: ${techList || 'minimal'}
Key signals: ${signalList || 'none'}
Already suggested (DO NOT REPEAT THESE): ${existingTitles}

Requirements:
- Each angle must be SPECIFIC to THIS company, not generic
- Reference their actual tech stack, industry, or business model
- Include a concrete, non-generic opener that mentions their company by name or domain
- Focus on VALUE, not criticism
- Each angle should target a different pain point

Return ONLY a JSON array, no markdown:
[{"title":"<specific angle title>","category":"<marketing|operations|growth|revops|design-cro|engineering>","description":"<why this matters for THIS company>","opener":"<specific first line of outreach>","confidence":<60-90>}]`;

  try {
    const response = await callClaude(apiKey, 'Return ONLY valid JSON array. No markdown. No explanation.', prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 5).map((item: any, i: number) => ({
      id: `ai-custom-${i}`,
      title: item.title || 'Custom angle',
      category: (['marketing', 'operations', 'growth', 'revops', 'design-cro', 'engineering', 'ecommerce', 'support', 'founder'].includes(item.category) ? item.category : 'growth') as AngleCategory,
      description: item.description || '',
      strength: (item.confidence >= 75 ? 'strong' : item.confidence >= 60 ? 'medium' : 'weak') as 'strong' | 'medium' | 'weak',
      confidence: Math.min(90, Math.max(50, item.confidence || 70)),
      sourceSignals: [],
      suggestedOpener: item.opener || '',
      aiGenerated: true,
    }));
  } catch {
    return [];
  }
}
