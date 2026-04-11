import { DetectionResult } from './cms';

export function detectTrustCompliance(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];
  const text = doc.body?.innerText?.toLowerCase() || '';
  const html = doc.documentElement.outerHTML.toLowerCase();

  const signals: Array<{
    name: string;
    keywords: string[];
    source: string;
  }> = [
    { name: 'SOC 2 compliance', keywords: ['soc 2', 'soc2', 'soc-2'], source: 'SOC 2 mention in page text' },
    { name: 'GDPR compliance', keywords: ['gdpr'], source: 'GDPR mention in page' },
    { name: 'HIPAA compliance', keywords: ['hipaa'], source: 'HIPAA mention in page' },
    { name: 'ISO certification', keywords: ['iso 27001', 'iso27001', 'iso-27001'], source: 'ISO 27001 mention' },
    { name: 'PCI DSS compliance', keywords: ['pci dss', 'pci-dss', 'pci compliant'], source: 'PCI DSS mention' },
    { name: 'CCPA compliance', keywords: ['ccpa'], source: 'CCPA mention in page' },
  ];

  for (const sig of signals) {
    if (sig.keywords.some(kw => text.includes(kw))) {
      results.push({ name: sig.name, category: 'Trust / Compliance', source: sig.source, confidence: 'strong' });
    }
  }

  // GDPR cookie banner
  const cookieBannerSelectors = [
    '[class*="cookie"]', '[id*="cookie"]', '[class*="consent"]',
    '[id*="consent"]', '[class*="gdpr"]', '[id*="gdpr"]',
  ];
  if (cookieBannerSelectors.some(sel => !!doc.querySelector(sel))) {
    results.push({ name: 'Cookie consent banner', category: 'Trust / Compliance', source: 'Cookie/consent DOM element', confidence: 'strong' });
  }

  // Security page
  if (html.includes('/security') || html.includes('/trust')) {
    results.push({ name: 'Security/trust page exists', category: 'Trust / Compliance', source: 'Link to /security or /trust', confidence: 'inferred' });
  }

  // Trust badges
  const trustBadgeKeywords = ['trust badge', 'verified by', 'secured by', 'norton secured', 'mcafee secure', 'ssl certificate'];
  if (trustBadgeKeywords.some(kw => text.includes(kw))) {
    results.push({ name: 'Trust badges detected', category: 'Trust / Compliance', source: 'Trust badge text', confidence: 'inferred' });
  }

  return results;
}
