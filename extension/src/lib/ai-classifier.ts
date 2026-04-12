import { callClaude } from './claude-api';

const VALID_TYPES = [
  'saas', 'ecommerce', 'agency', 'services', 'hospitality',
  'restaurant', 'education', 'government', 'healthcare',
  'nonprofit', 'realestate', 'media', 'fintech', 'logistics',
  'manufacturing', 'legal', 'entertainment', 'unknown',
];

export async function classifyCompanyWithAI(
  apiKey: string,
  company: { name: string; domain: string; tagline: string; description: string },
  detections: Array<{ name: string; category: string }>,
  currentType: string
): Promise<{ type: string; industry: string; confidence: string }> {
  const techList = detections.slice(0, 15).map(d => d.name).join(', ');

  const prompt = `Classify this company. Return ONLY a JSON object, nothing else.

Company: ${company.name}
Domain: ${company.domain}
Tagline: ${company.tagline || 'N/A'}
Description: ${company.description || 'N/A'}
Tech detected: ${techList || 'minimal'}
Current guess: ${currentType}

Return this exact JSON format:
{"type":"<one of: saas, ecommerce, agency, services, hospitality, restaurant, education, government, healthcare, nonprofit, realestate, media, fintech, logistics, manufacturing, legal, entertainment, unknown>","industry":"<specific industry like Digital Marketing, Cloud Infrastructure, Hotel Chain, etc>","confidence":"<high, medium, or low>"}`;

  try {
    const response = await callClaude(apiKey, 'You are a company classifier. Return ONLY valid JSON, no markdown, no explanation.', prompt);

    // Parse JSON from response
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (!jsonMatch) return { type: currentType, industry: 'Unknown', confidence: 'low' };

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate type
    const type = VALID_TYPES.includes(parsed.type) ? parsed.type : currentType;
    const industry = parsed.industry || 'Unknown';
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium';

    return { type, industry, confidence };
  } catch {
    return { type: currentType, industry: 'Unknown', confidence: 'low' };
  }
}
