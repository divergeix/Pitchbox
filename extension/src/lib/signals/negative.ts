import { DetectionResult } from '../detectors/cms';
import { CompanyProfile } from '../company/identity';
import { Signal } from './commercial';

export function detectNegativeSignals(detections: DetectionResult[], company: CompanyProfile): Signal[] {
  const signals: Signal[] = [];
  const seoIssues = detections.filter(d => d.category === 'SEO' && (
    d.name.includes('Missing') || d.name.includes('weak') || d.name.includes('No ')
  ));

  // SEO issues
  if (seoIssues.length >= 2) {
    signals.push({
      id: 'seo-issues', type: 'negative', title: 'Multiple SEO gaps',
      description: `${seoIssues.length} SEO issues found: ${seoIssues.map(d => d.name).join(', ')}.`,
      confidence: 'strong', sourceDetections: seoIssues.map(d => d.name),
    });
  }

  // No case studies for SaaS
  if (company.type === 'saas' && !company.hasCaseStudies) {
    signals.push({
      id: 'no-case-studies', type: 'negative', title: 'No case studies or social proof',
      description: 'SaaS company without visible case studies. May struggle with enterprise trust.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // No pricing transparency
  if (company.type === 'saas' && !company.hasPricingPage) {
    signals.push({
      id: 'no-pricing', type: 'negative', title: 'No public pricing page',
      description: 'No pricing page detected. Buyers may face friction in self-qualifying.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Outdated copyright year
  const doc = typeof document !== 'undefined' ? document : null;
  if (doc) {
    const bodyText = doc.body?.innerText || '';
    const copyrightMatch = bodyText.match(/©\s*(\d{4})/);
    if (copyrightMatch) {
      const year = parseInt(copyrightMatch[1]);
      const currentYear = new Date().getFullYear();
      if (year < currentYear - 1) {
        signals.push({
          id: 'outdated-copyright', type: 'negative', title: 'Outdated copyright year',
          description: `Copyright year is ${year}. Site may not be actively maintained.`,
          confidence: 'strong', sourceDetections: [],
        });
      }
    }
  }

  // No trust badges on ecommerce
  if (company.type === 'ecommerce') {
    const hasTrust = detections.some(d => d.category === 'Trust / Compliance');
    if (!hasTrust) {
      signals.push({
        id: 'ecom-no-trust', type: 'negative', title: 'No trust signals on ecommerce site',
        description: 'Ecommerce site without visible compliance or trust badges. May hurt buyer confidence.',
        confidence: 'inferred', sourceDetections: [],
      });
    }
  }

  // Cookie consent without GDPR
  const hasCookieBanner = detections.some(d => d.name.includes('Cookie consent'));
  const hasGDPR = detections.some(d => d.name.includes('GDPR'));
  if (!hasCookieBanner && !hasGDPR) {
    signals.push({
      id: 'no-cookie-consent', type: 'negative', title: 'No cookie consent detected',
      description: 'No cookie banner or GDPR compliance signals found. May be a compliance gap for EU visitors.',
      confidence: 'low', sourceDetections: [],
    });
  }

  return signals;
}
