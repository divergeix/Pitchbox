import { Signal } from '../signals/commercial';
import { DetectionResult } from '../detectors/cms';
import { CompanyProfile } from '../company/identity';

export interface OutreachAngle {
  id: string;
  title: string;
  category: AngleCategory;
  description: string;
  strength: 'strong' | 'medium' | 'weak';
  confidence: number; // 0-100
  sourceSignals: string[];
  suggestedOpener: string;
}

export type AngleCategory =
  | 'marketing'
  | 'engineering'
  | 'operations'
  | 'ecommerce'
  | 'revops'
  | 'design-cro'
  | 'support'
  | 'growth'
  | 'founder';

interface AngleRule {
  id: string;
  title: string;
  category: AngleCategory;
  description: string;
  suggestedOpener: string;
  condition: (signals: Signal[], detections: DetectionResult[], company: CompanyProfile) => { match: boolean; confidence: number; sources: string[] };
}

const rules: AngleRule[] = [
  // CRO angles
  {
    id: 'webflow-cro',
    title: 'Landing page CRO opportunity',
    category: 'design-cro',
    description: 'Webflow site with weak CTA hierarchy. Opportunity to improve conversion path.',
    suggestedOpener: "Noticed your site is built on Webflow but the conversion path could be stronger.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'webflow-weak-cta');
      return { match, confidence: 80, sources: ['webflow-weak-cta'] };
    },
  },
  {
    id: 'weak-conversion-fix',
    title: 'Inbound lead capture improvement',
    category: 'design-cro',
    description: 'No clear conversion path detected. Visitors may leave without engaging.',
    suggestedOpener: "Your site looks great but I couldn't find an easy way for visitors to reach out.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'weak-conversion');
      return { match, confidence: 85, sources: ['weak-conversion'] };
    },
  },
  {
    id: 'no-chat-lead-capture',
    title: 'Live chat for inbound capture',
    category: 'growth',
    description: 'Demo-driven site without live chat. Missing warm inbound conversations.',
    suggestedOpener: "You have demo booking set up, but no live chat to catch visitors who aren't ready to book yet.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'no-chat-demo-site');
      return { match, confidence: 75, sources: ['no-chat-demo-site'] };
    },
  },

  // Marketing angles
  {
    id: 'martech-consolidation',
    title: 'Marketing stack consolidation',
    category: 'marketing',
    description: 'Multiple overlapping marketing tools creating potential data silos.',
    suggestedOpener: "I noticed you're running several marketing tools. Curious if the data flows between them cleanly.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'fragmented-martech');
      return { match, confidence: 70, sources: ['fragmented-martech'] };
    },
  },
  {
    id: 'hubspot-campaign-ops',
    title: 'Campaign ops efficiency with HubSpot',
    category: 'marketing',
    description: 'HubSpot detected with complex stack. Campaign operations may need streamlining.',
    suggestedOpener: "Saw you're on HubSpot with a few other tools. That setup can create campaign friction.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'hubspot-complex-stack');
      return { match, confidence: 72, sources: ['hubspot-complex-stack'] };
    },
  },
  {
    id: 'content-growth',
    title: 'Content marketing acceleration',
    category: 'marketing',
    description: 'Active blog detected. Opportunity to scale content velocity or distribution.',
    suggestedOpener: "Your blog looks active. Curious if you're seeing the traffic and conversion numbers you want from it.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'content-motion');
      return { match, confidence: 55, sources: ['content-motion'] };
    },
  },
  {
    id: 'seo-gap-fix',
    title: 'SEO and organic growth gaps',
    category: 'marketing',
    description: 'Multiple SEO issues detected. Organic growth may be limited.',
    suggestedOpener: "Ran a quick scan on your site and found a few SEO gaps that might be holding back organic traffic.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'seo-issues');
      return { match, confidence: 78, sources: ['seo-issues'] };
    },
  },

  // Engineering angles
  {
    id: 'analytics-migration',
    title: 'Analytics stack modernization',
    category: 'engineering',
    description: 'Legacy analytics detected on modern site. Migration opportunity.',
    suggestedOpener: "Your site is on a modern stack but still running older analytics. Planning a migration?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'legacy-analytics-modern-site');
      return { match, confidence: 65, sources: ['legacy-analytics-modern-site'] };
    },
  },
  {
    id: 'developer-growth',
    title: 'Developer experience and growth',
    category: 'engineering',
    description: 'API docs detected. Developer audience needs specific growth strategies.',
    suggestedOpener: "Saw you have public API docs. Developer adoption is a unique growth channel.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'developer-audience');
      return { match, confidence: 68, sources: ['developer-audience'] };
    },
  },

  // Operations angles
  {
    id: 'missing-crm-ops',
    title: 'CRM implementation opportunity',
    category: 'operations',
    description: 'No CRM detected. Lead management may be manual or fragmented.',
    suggestedOpener: "Couldn't spot a CRM on your stack. How are you tracking leads and pipeline right now?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'missing-crm');
      return { match, confidence: 75, sources: ['missing-crm'] };
    },
  },
  {
    id: 'analytics-blindspot',
    title: 'Website analytics blindspot',
    category: 'operations',
    description: 'No analytics tools detected. Decisions may lack data.',
    suggestedOpener: "I didn't detect any analytics on your site. Are you tracking visitor behavior elsewhere?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'no-analytics');
      return { match, confidence: 82, sources: ['no-analytics'] };
    },
  },
  {
    id: 'support-consolidation',
    title: 'Support tool consolidation',
    category: 'support',
    description: 'Multiple support tools detected. Consolidation could improve efficiency.',
    suggestedOpener: "Noticed a few different support tools on your site. Curious if that's intentional or leftover from growth.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'multiple-support');
      return { match, confidence: 65, sources: ['multiple-support'] };
    },
  },

  // Ecommerce angles
  {
    id: 'shopify-performance',
    title: 'Shopify performance optimization',
    category: 'ecommerce',
    description: 'Shopify store with multiple apps. Potential performance and conversion impact.',
    suggestedOpener: "Your Shopify store has a few apps running. That can slow things down and hurt conversion.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'shopify-app-bloat');
      return { match, confidence: 74, sources: ['shopify-app-bloat'] };
    },
  },

  // Growth angles
  {
    id: 'hiring-infrastructure',
    title: 'Growth infrastructure for scaling team',
    category: 'growth',
    description: 'Active hiring detected. Growing teams need better tools and processes.',
    suggestedOpener: "Looks like you're hiring. Scaling the team usually means scaling the tools too.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'careers-active');
      return { match, confidence: 60, sources: ['careers-active'] };
    },
  },
  {
    id: 'plg-optimization',
    title: 'Product-led growth optimization',
    category: 'growth',
    description: 'Free trial and self-serve pricing detected. PLG motion can be optimized.',
    suggestedOpener: "Your PLG setup with free trial and public pricing is solid. Are you optimizing the trial-to-paid funnel?",
    condition: (signals, _d, company) => {
      const match = signals.some(s => s.id === 'free-trial') && company.hasPricingPage;
      return { match, confidence: 72, sources: ['free-trial', 'pricing-page-exists'] };
    },
  },
  {
    id: 'ecosystem-leverage',
    title: 'Ecosystem and integration growth',
    category: 'growth',
    description: 'Integrations page detected. Partnership-driven growth opportunity.',
    suggestedOpener: "Your integrations page shows you're building an ecosystem. That's a powerful growth lever.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'integrations-play');
      return { match, confidence: 63, sources: ['integrations-play'] };
    },
  },

  // Compliance angles
  {
    id: 'compliance-readiness',
    title: 'Enterprise compliance readiness',
    category: 'operations',
    description: 'Compliance certifications detected. May be moving upmarket.',
    suggestedOpener: "Saw your compliance badges. Moving upmarket into enterprise usually means tightening more than just security.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'enterprise-compliance');
      return { match, confidence: 68, sources: ['enterprise-compliance'] };
    },
  },

  // Negative signal angles
  {
    id: 'trust-gap',
    title: 'Trust and credibility improvement',
    category: 'design-cro',
    description: 'Missing social proof or trust signals. Conversion may suffer.',
    suggestedOpener: "Your product looks solid but the site could do more to build trust with new visitors.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'no-case-studies' || s.id === 'ecom-no-trust');
      return { match, confidence: 70, sources: ['no-case-studies', 'ecom-no-trust'] };
    },
  },
  {
    id: 'outdated-site',
    title: 'Website refresh opportunity',
    category: 'design-cro',
    description: 'Outdated signals detected. Site may not reflect current brand or offering.',
    suggestedOpener: "Your site might benefit from a refresh to match where the business is today.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'outdated-copyright');
      return { match, confidence: 72, sources: ['outdated-copyright'] };
    },
  },
  {
    id: 'gdpr-gap',
    title: 'GDPR/Privacy compliance gap',
    category: 'operations',
    description: 'No cookie consent or GDPR signals. Potential compliance risk for EU visitors.',
    suggestedOpener: "Quick note — I didn't spot a cookie consent banner. If you get EU traffic, that could be a compliance risk.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'no-cookie-consent');
      return { match, confidence: 55, sources: ['no-cookie-consent'] };
    },
  },
];

export function generateAngles(signals: Signal[], detections: DetectionResult[], company: CompanyProfile): OutreachAngle[] {
  const angles: OutreachAngle[] = [];

  for (const rule of rules) {
    const result = rule.condition(signals, detections, company);
    if (result.match) {
      angles.push({
        id: rule.id,
        title: rule.title,
        category: rule.category,
        description: rule.description,
        strength: result.confidence >= 75 ? 'strong' : result.confidence >= 60 ? 'medium' : 'weak',
        confidence: result.confidence,
        sourceSignals: result.sources,
        suggestedOpener: rule.suggestedOpener,
      });
    }
  }

  // Sort by confidence descending
  return angles.sort((a, b) => b.confidence - a.confidence);
}
