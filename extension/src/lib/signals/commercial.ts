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

  return signals;
}
