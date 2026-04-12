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
  const marketingTools = detections.filter(d => d.category === 'Marketing');
  const analyticsTools = detections.filter(d => d.category === 'Analytics');
  const isB2B = company.type === 'saas' || company.type === 'agency' || company.type === 'services';
  const isNonCommercial = company.type === 'government' || company.type === 'education' || company.type === 'nonprofit';
  const isLocalBusiness = (company.type === 'hospitality' || company.type === 'restaurant' || company.type === 'healthcare' || company.type === 'realestate')
    && company.estimatedSize !== '51-200' && company.estimatedSize !== '201-1000' && company.estimatedSize !== '1000+'
    && !(company as any).aiClassified;
  const isPlatform = company.type === 'travel' || company.type === 'fintech' || company.type === 'media' || company.type === 'entertainment' || company.type === 'logistics';

  // Weak conversion path (only if we detected enough tech to trust the scan - skip for SPA sites with few detections)
  const hasChat = detections.some(d => d.category === 'Sales / Support' || d.category === 'Chat / Support');
  const hasForms = detections.some(d => d.name.includes('Forms'));
  const hasDemoPage = company.hasDemoPage;
  const hasSufficientDetections = detections.filter(d => d.category !== 'SEO').length >= 3;
  if (!hasChat && !hasForms && !hasDemoPage && hasSufficientDetections && !isPlatform) {
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
  if (marketingTools.length >= 3) {
    signals.push({
      id: 'fragmented-martech', type: 'commercial', title: 'Fragmented marketing stack',
      description: `${marketingTools.length} marketing tools detected. Possible integration overhead and data silos.`,
      confidence: 'inferred', sourceDetections: marketingTools.map(d => d.name),
    });
  }

  // Heavy analytics setup
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

  // --- Context-aware signals (only fire when relevant to company type + stack) ---

  // Small team signal (only for B2B companies where it's an actionable insight)
  if ((company.estimatedSize === '1-10' || company.estimatedSize === '11-50') && isB2B) {
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

  // No demo or free trial (SaaS/services ONLY - not government, media, etc.)
  if (!company.hasDemoPage && !company.hasFreeTrial && (company.type === 'saas' || company.type === 'services')) {
    signals.push({
      id: 'no-demo-or-trial', type: 'commercial', title: 'No demo or trial offering visible',
      description: 'No demo booking or free trial detected. May be missing inbound conversion opportunities.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // No case studies (B2B only)
  if (!company.hasCaseStudies && isB2B) {
    signals.push({
      id: 'no-case-studies-commercial', type: 'commercial', title: 'No visible social proof',
      description: 'No case studies or customer stories found. Trust-building content may be missing.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Minimal tech stack (only when company SHOULD have more tools - B2B/ecommerce)
  const nonSeoDetections = detections.filter(d => d.category !== 'SEO');
  if (nonSeoDetections.length <= 2 && (isB2B || company.type === 'ecommerce')) {
    signals.push({
      id: 'minimal-stack', type: 'commercial', title: 'Minimal tech stack',
      description: `Only ${nonSeoDetections.length} tools detected. Site may be underinvesting in digital infrastructure.`,
      confidence: 'inferred', sourceDetections: nonSeoDetections.map(d => d.name),
    });
  }

  // No marketing automation (B2B/ecommerce only)
  if (marketingTools.length === 0 && (isB2B || company.type === 'ecommerce')) {
    signals.push({
      id: 'no-marketing-automation', type: 'commercial', title: 'No marketing automation detected',
      description: 'No email marketing or automation tools found. Lead nurturing may be manual.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // Template site builder (only for B2B/agency where it matters)
  if ((detected.has('wix') || detected.has('squarespace')) && isB2B) {
    signals.push({
      id: 'template-builder', type: 'commercial', title: 'Template site builder in use',
      description: `Site built on ${detected.has('wix') ? 'Wix' : 'Squarespace'}. May be outgrowing the platform as business scales.`,
      confidence: 'inferred', sourceDetections: [detected.has('wix') ? 'Wix' : 'Squarespace'],
    });
  }

  // SEO-aware (relevant for any company investing in organic)
  if (detections.some(d => d.name.includes('Structured data'))) {
    signals.push({
      id: 'seo-aware', type: 'commercial', title: 'SEO-aware setup',
      description: 'Structured data (schema markup) detected. Company is investing in organic search.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // --- TECH-STACK-SPECIFIC signals ---

  // WordPress without security plugin
  if (detected.has('wordpress') && !detected.has('wordfence')) {
    signals.push({
      id: 'wp-security-gap', type: 'commercial', title: 'WordPress without visible security plugin',
      description: 'WordPress detected but no security plugin (Wordfence, Sucuri) found. Potential vulnerability.',
      confidence: 'inferred', sourceDetections: ['WordPress'],
    });
  }

  // WordPress with many plugins (jQuery UI, multiple form plugins, etc.)
  if (detected.has('wordpress') && detections.filter(d => d.name.includes('Forms') || d.name.includes('WPForms') || d.name.includes('Gravity') || d.name.includes('Ninja')).length >= 1) {
    signals.push({
      id: 'wp-plugin-stack', type: 'commercial', title: 'WordPress with plugin stack',
      description: 'WordPress site with form plugins detected. Performance and maintenance may need attention.',
      confidence: 'inferred', sourceDetections: ['WordPress'],
    });
  }

  // React/Next.js without analytics = developer-built, may lack marketing
  if ((detected.has('react') || detected.has('next.js')) && analyticsTools.length === 0) {
    signals.push({
      id: 'modern-stack-no-analytics', type: 'commercial', title: 'Modern dev stack without analytics',
      description: 'React/Next.js site without analytics. Likely developer-led build that may lack marketing infrastructure.',
      confidence: 'strong', sourceDetections: ['React', 'Next.js'],
    });
  }

  // Multiple analytics tools = data may be fragmented
  if (analyticsTools.length >= 2) {
    signals.push({
      id: 'multi-analytics', type: 'commercial', title: 'Multiple analytics tools',
      description: `${analyticsTools.length} analytics tools detected (${analyticsTools.map(d => d.name).join(', ')}). Data may be fragmented across platforms.`,
      confidence: 'strong', sourceDetections: analyticsTools.map(d => d.name),
    });
  }

  // Has ad pixels but no CRM = spending on ads without proper lead tracking
  const adPixels = detections.filter(d => d.category === 'Ad Pixel');
  const hasCRM = ['hubspot', 'marketo', 'pardot', 'activecampaign', 'salesforce'].some(t => detected.has(t));
  if (adPixels.length >= 1 && !hasCRM && isB2B) {
    signals.push({
      id: 'ads-no-crm', type: 'commercial', title: 'Running ads without visible CRM',
      description: `${adPixels.length} ad pixel(s) detected (${adPixels.map(d => d.name).join(', ')}) but no CRM. Leads from ads may not be tracked properly.`,
      confidence: 'strong', sourceDetections: adPixels.map(d => d.name),
    });
  }

  // Has chat widget but no CRM = conversations not being tracked
  if (hasChat && !hasCRM && isB2B) {
    signals.push({
      id: 'chat-no-crm', type: 'commercial', title: 'Chat widget without CRM',
      description: 'Live chat detected but no CRM. Chat conversations and leads may not be tracked or followed up.',
      confidence: 'inferred', sourceDetections: detections.filter(d => d.category === 'Sales / Support' || d.category === 'Chat / Support').map(d => d.name),
    });
  }

  // Ecommerce without reviews/ratings
  if (company.type === 'ecommerce' && !detections.some(d => d.name.includes('Yotpo') || d.name.includes('Judge.me') || d.name.includes('Stamped') || d.name.includes('Trustpilot'))) {
    signals.push({
      id: 'ecom-no-reviews', type: 'commercial', title: 'Ecommerce without review system',
      description: 'No product review tool detected. Social proof from reviews significantly impacts conversion rates.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // Has reCAPTCHA/security = getting form spam (may need better lead qualification)
  if (detections.some(d => d.name.includes('reCAPTCHA') || d.name.includes('hCaptcha'))) {
    signals.push({
      id: 'captcha-present', type: 'commercial', title: 'Anti-spam measures active',
      description: 'CAPTCHA detected on forms. Company is getting enough traffic/submissions to need spam protection.',
      confidence: 'strong', sourceDetections: [],
    });
  }

  // Local business specific signals
  if (isLocalBusiness) {
    if (!hasChat && !hasForms) {
      signals.push({
        id: 'local-no-booking', type: 'commercial', title: 'No online booking/inquiry form',
        description: 'No visible booking form or inquiry path. Visitors may call instead of converting online.',
        confidence: 'strong', sourceDetections: [],
      });
    }
    if (marketingTools.length === 0) {
      signals.push({
        id: 'local-no-email-marketing', type: 'commercial', title: 'No email marketing for repeat customers',
        description: 'No email marketing tool detected. Missing opportunity to drive repeat visits via email campaigns.',
        confidence: 'inferred', sourceDetections: [],
      });
    }
    if (!detections.some(d => d.name.includes('Google Maps') || d.name.includes('Mapbox'))) {
      signals.push({
        id: 'local-no-map', type: 'commercial', title: 'No embedded map detected',
        description: 'No Google Maps or map embed found. Visitors may struggle to find the location.',
        confidence: 'inferred', sourceDetections: [],
      });
    }
    if (analyticsTools.length === 0) {
      signals.push({
        id: 'local-no-analytics', type: 'commercial', title: 'No website analytics',
        description: 'No analytics detected. Cannot measure which marketing channels drive bookings.',
        confidence: 'strong', sourceDetections: [],
      });
    }
    signals.push({
      id: 'local-online-presence', type: 'commercial', title: 'Local business online presence',
      description: 'Local business that could benefit from better online visibility, review management, and digital marketing.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  // AI opportunity - ONLY for B2B/ecommerce/local business, NOT government/education/nonprofit
  if ((isB2B || company.type === 'ecommerce' || isLocalBusiness) && !isNonCommercial) {
    signals.push({
      id: 'ai-opportunity', type: 'commercial', title: 'AI integration opportunity',
      description: 'Business type suggests potential for AI-powered automation in workflows, customer engagement, or data analysis.',
      confidence: 'inferred', sourceDetections: [],
    });
  }

  return signals;
}
