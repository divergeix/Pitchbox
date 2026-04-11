import { DetectionResult } from '../detectors/cms';
import { CompanyProfile } from '../company/identity';
import { Signal } from './commercial';

export function detectOperationalSignals(detections: DetectionResult[], company: CompanyProfile): Signal[] {
  const signals: Signal[] = [];
  const detected = new Set(detections.map(d => d.name.toLowerCase()));

  // No CRM layer detected
  const hasCRM = ['hubspot', 'marketo', 'pardot', 'activecampaign', 'customer.io'].some(t => detected.has(t));
  if (!hasCRM && company.type === 'saas') {
    signals.push({
      id: 'missing-crm', type: 'operational', title: 'No CRM/marketing automation detected',
      description: 'SaaS company without visible CRM or marketing automation. Potential for lead nurturing gaps.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Multiple support tools
  const supportTools = detections.filter(d => d.category === 'Sales / Support');
  if (supportTools.length >= 2) {
    signals.push({
      id: 'multiple-support', type: 'operational', title: 'Multiple support/chat tools',
      description: `${supportTools.length} support tools detected. Potential for consolidation.`,
      confidence: 'inferred', sourceDetections: supportTools.map(d => d.name),
    });
  }

  // Old school stack on modern site
  const hasModernBuilder = ['webflow', 'framer'].some(t => detected.has(t));
  const hasLegacyAnalytics = detected.has('google analytics (universal)');
  if (hasModernBuilder && hasLegacyAnalytics) {
    signals.push({
      id: 'legacy-analytics-modern-site', type: 'operational', title: 'Modern site with legacy analytics',
      description: 'Modern site builder with Universal Analytics. GA4 migration may be pending.',
      confidence: 'inferred', sourceDetections: ['Google Analytics (Universal)'],
    });
  }

  // No analytics at all
  const hasAnyAnalytics = detections.some(d => d.category === 'Analytics');
  if (!hasAnyAnalytics) {
    signals.push({
      id: 'no-analytics', type: 'operational', title: 'No analytics detected',
      description: 'No analytics tools found. Company may lack visibility into website performance.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // Enterprise signals
  const hasCompliance = detections.some(d => d.category === 'Trust / Compliance');
  const hasEnterpriseName = detections.some(d => d.name.includes('SOC 2') || d.name.includes('HIPAA'));
  if (hasEnterpriseName) {
    signals.push({
      id: 'enterprise-compliance', type: 'operational', title: 'Enterprise compliance posture',
      description: 'Compliance certifications detected. Company is enterprise-ready or enterprise-focused.',
      confidence: 'strong', sourceDetections: detections.filter(d => d.category === 'Trust / Compliance').map(d => d.name),
    });
  }

  // Ecommerce without proper payment
  if (company.type === 'ecommerce' && !detections.some(d => d.category === 'Ecommerce / Payments')) {
    signals.push({
      id: 'ecommerce-no-payment', type: 'operational', title: 'Ecommerce site without visible payment stack',
      description: 'Ecommerce site detected but no payment processor found. May use a non-standard solution.',
      confidence: 'low', sourceDetections: [],
    });
  }

  return signals;
}
