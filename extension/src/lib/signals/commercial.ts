import { DetectionResult } from '../detectors/cms';
import { CompanyProfile } from '../company/identity';

export interface Signal {
  id: string;
  type: 'commercial' | 'operational' | 'negative';
  title: string;
  description: string;
  confidence: 'strong' | 'inferred' | 'low';
  sourceDetections: string[];
}

export function detectCommercialSignals(detections: DetectionResult[], company: CompanyProfile): Signal[] {
  const signals: Signal[] = [];
  const detected = new Set(detections.map(d => d.name.toLowerCase()));
  const categories = new Set(detections.map(d => d.category));

  // Weak conversion path
  const hasChat = detections.some(d => d.category === 'Sales / Support');
  const hasForms = detections.some(d => d.name.includes('Forms'));
  const hasDemoPage = company.hasDemoPage;
  if (!hasChat && !hasForms && !hasDemoPage) {
    signals.push({
      id: 'weak-conversion', type: 'commercial', title: 'Weak conversion path',
      description: 'No live chat, forms, or demo booking detected. Visitors may not have a clear way to convert.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // No live chat on demo-driven site
  if (!hasChat && hasDemoPage) {
    signals.push({
      id: 'no-chat-demo-site', type: 'commercial', title: 'No live chat on demo-driven site',
      description: 'Site has demo booking but no live chat widget to capture inbound interest immediately.',
      confidence: 'strong', sourceDetections: ['Demo/booking form'],
    });
  }

  // Fragmented martech stack
  const marketingTools = detections.filter(d => d.category === 'Marketing');
  if (marketingTools.length >= 3) {
    signals.push({
      id: 'fragmented-martech', type: 'commercial', title: 'Fragmented marketing stack',
      description: `${marketingTools.length} marketing tools detected. Possible integration overhead and data silos.`,
      confidence: 'inferred', sourceDetections: marketingTools.map(d => d.name),
    });
  }

  // Heavy analytics setup
  const analyticsTools = detections.filter(d => d.category === 'Analytics');
  if (analyticsTools.length >= 3) {
    signals.push({
      id: 'heavy-analytics', type: 'commercial', title: 'Heavy analytics stack',
      description: `${analyticsTools.length} analytics tools detected. Data may be fragmented across platforms.`,
      confidence: 'inferred', sourceDetections: analyticsTools.map(d => d.name),
    });
  }

  // Shopify + slow signals
  if (detected.has('shopify')) {
    const shopifyApps = detections.filter(d => d.category === 'Ecommerce / Payments');
    if (shopifyApps.length >= 2) {
      signals.push({
        id: 'shopify-app-bloat', type: 'commercial', title: 'Shopify with multiple apps/payment tools',
        description: 'Multiple ecommerce tools on Shopify store. Potential for app bloat affecting performance.',
        confidence: 'inferred', sourceDetections: shopifyApps.map(d => d.name),
      });
    }
  }

  // Pricing page present = growth stage
  if (company.hasPricingPage) {
    signals.push({
      id: 'pricing-page-exists', type: 'commercial', title: 'Self-serve pricing page detected',
      description: 'Company has a public pricing page, indicating product-led or hybrid growth motion.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // Free trial = PLG motion
  if (company.hasFreeTrial) {
    signals.push({
      id: 'free-trial', type: 'commercial', title: 'Free trial available',
      description: 'Company offers a free trial, typical of product-led growth companies.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // Career page = hiring
  if (company.hasCareerPage) {
    signals.push({
      id: 'careers-active', type: 'commercial', title: 'Active hiring detected',
      description: 'Career/jobs page found. Company is likely growing and investing in headcount.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Blog active = content motion
  if (company.hasBlog) {
    signals.push({
      id: 'content-motion', type: 'commercial', title: 'Active content/blog',
      description: 'Blog detected. Company is investing in content marketing.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Case studies = proof points
  if (company.hasCaseStudies) {
    signals.push({
      id: 'case-studies', type: 'commercial', title: 'Case studies/customer stories present',
      description: 'Company publishes case studies, indicating a mature sales motion.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // API/docs = developer audience
  if (company.hasApiDocs) {
    signals.push({
      id: 'developer-audience', type: 'commercial', title: 'Developer/API documentation',
      description: 'API docs detected. Company targets a developer audience.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // Integrations page = ecosystem play
  if (company.hasIntegrationsPage) {
    signals.push({
      id: 'integrations-play', type: 'commercial', title: 'Integrations/marketplace page',
      description: 'Integrations page detected. Company has an ecosystem-driven strategy.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // HubSpot + many marketing tools = campaign ops opportunity
  if (detected.has('hubspot') && marketingTools.length >= 2) {
    signals.push({
      id: 'hubspot-complex-stack', type: 'commercial', title: 'HubSpot with complex marketing stack',
      description: 'HubSpot detected alongside other marketing tools. Campaign operations may be complex.',
      confidence: 'inferred', sourceDetections: ['HubSpot', ...marketingTools.map(d => d.name)],
    });
  }

  // Webflow + weak CTA
  if (detected.has('webflow') && !hasForms && !hasDemoPage) {
    signals.push({
      id: 'webflow-weak-cta', type: 'commercial', title: 'Webflow site with weak CTA',
      description: 'Webflow-built site without clear forms or demo booking. CRO opportunity.',
      confidence: 'strong', sourceDetections: ['Webflow'],
    });
  }

  // --- Signals that fire on common/minimal patterns ---

  // Small team signal
  if (company.estimatedSize === '1-10' || company.estimatedSize === '11-50') {
    signals.push({
      id: 'small-team', type: 'commercial', title: 'Small/growing team',
      description: `Estimated ${company.estimatedSize} employees. Likely wearing multiple hats and open to efficiency tools.`,
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Agency type
  if (company.type === 'agency') {
    signals.push({
      id: 'agency-business', type: 'commercial', title: 'Agency business model',
      description: 'Agency detected. Likely managing multiple clients with need for scalable processes.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // No demo or free trial (SaaS/services only)
  if (!company.hasDemoPage && !company.hasFreeTrial && company.type !== 'ecommerce') {
    signals.push({
      id: 'no-demo-or-trial', type: 'commercial', title: 'No demo or trial offering visible',
      description: 'No demo booking or free trial detected. May be missing inbound conversion opportunities.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // No case studies
  if (!company.hasCaseStudies && company.type !== 'ecommerce') {
    signals.push({
      id: 'no-case-studies-commercial', type: 'commercial', title: 'No visible social proof',
      description: 'No case studies or customer stories found. Trust-building content may be missing.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Minimal tech stack (< 3 detections beyond SEO)
  const nonSeoDetections = detections.filter(d => d.category !== 'SEO');
  if (nonSeoDetections.length <= 2) {
    signals.push({
      id: 'minimal-stack', type: 'commercial', title: 'Minimal tech stack',
      description: `Only ${nonSeoDetections.length} tools detected. Site may be underinvesting in digital infrastructure.`,
      confidence: 'inferred', sourceDetections: nonSeoDetections.map(d => d.name),
    });
  }

  // No marketing automation
  if (marketingTools.length === 0) {
    signals.push({
      id: 'no-marketing-automation', type: 'commercial', title: 'No marketing automation detected',
      description: 'No email marketing or automation tools found. Lead nurturing may be manual.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Basic/template site builder
  if (detected.has('wix') || detected.has('squarespace')) {
    signals.push({
      id: 'template-builder', type: 'commercial', title: 'Template site builder in use',
      description: `Site built on ${detected.has('wix') ? 'Wix' : 'Squarespace'}. May be outgrowing the platform as business scales.`,
      confidence: 'inferred', sourceDetections: [detected.has('wix') ? 'Wix' : 'Squarespace'],
    });
  }

  // Has structured data = SEO-aware
  if (detections.some(d => d.name.includes('Structured data'))) {
    signals.push({
      id: 'seo-aware', type: 'commercial', title: 'SEO-aware setup',
      description: 'Structured data (schema markup) detected. Company is investing in organic search.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // AI opportunity - always fires (every company can benefit from AI)
  signals.push({
    id: 'ai-opportunity', type: 'commercial', title: 'AI integration opportunity',
    description: 'Every business can benefit from AI-powered automation, content generation, customer support, or data analysis.',
    confidence: 'strong', sourceDetections: [],
  });

  return signals;
}
