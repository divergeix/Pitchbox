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
      const match = signals.some(s => s.id === 'no-case-studies' || s.id === 'no-case-studies-commercial' || s.id === 'ecom-no-trust');
      return { match, confidence: 70, sources: ['no-case-studies', 'no-case-studies-commercial', 'ecom-no-trust'] };
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

  // --- New angles for smaller/minimal sites ---

  {
    id: 'agency-growth',
    title: 'Agency scaling and client acquisition',
    category: 'founder',
    description: 'Agency business detected. Opportunity to help with lead gen, positioning, or client delivery.',
    suggestedOpener: "Running an agency is tough. Curious how you're handling lead gen beyond referrals right now.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'agency-business');
      return { match, confidence: 72, sources: ['agency-business'] };
    },
  },
  {
    id: 'small-team-efficiency',
    title: 'Small team efficiency play',
    category: 'operations',
    description: 'Small team that could benefit from automation and better tooling.',
    suggestedOpener: "With a lean team, every hour matters. Are there workflows you wish ran on autopilot?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'small-team');
      return { match, confidence: 62, sources: ['small-team'] };
    },
  },
  {
    id: 'platform-upgrade',
    title: 'Website platform upgrade',
    category: 'design-cro',
    description: 'Template builder detected. Business may be outgrowing the platform.',
    suggestedOpener: "Noticed your site is on a template builder. As you grow, that can start limiting what you can do.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'template-builder');
      return { match, confidence: 68, sources: ['template-builder'] };
    },
  },
  {
    id: 'marketing-automation-gap',
    title: 'Marketing automation opportunity',
    category: 'marketing',
    description: 'No marketing automation detected. Email nurturing and lead scoring could be set up.',
    suggestedOpener: "I didn't see any marketing automation on your site. How are you following up with leads today?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'no-marketing-automation');
      return { match, confidence: 70, sources: ['no-marketing-automation'] };
    },
  },
  {
    id: 'social-proof-gap',
    title: 'Social proof and case study opportunity',
    category: 'design-cro',
    description: 'No case studies or customer stories visible. Adding proof points could boost conversions.',
    suggestedOpener: "Your offering looks strong, but I didn't see case studies. Even one or two can make a big difference.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'no-case-studies-commercial');
      return { match, confidence: 68, sources: ['no-case-studies-commercial'] };
    },
  },
  {
    id: 'minimal-stack-buildout',
    title: 'Digital infrastructure buildout',
    category: 'growth',
    description: 'Very few tools detected. Opportunity to build out analytics, CRM, and marketing stack.',
    suggestedOpener: "Your site is clean but running light on tools. Are you tracking visitor behavior and converting leads effectively?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'minimal-stack');
      return { match, confidence: 65, sources: ['minimal-stack'] };
    },
  },
  {
    id: 'lead-capture-missing',
    title: 'Lead capture improvement',
    category: 'design-cro',
    description: 'No demo, trial, or clear conversion path. Visitors may leave without engaging.',
    suggestedOpener: "Visited your site but couldn't find an easy way to get started or reach out. Is that intentional?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'no-demo-or-trial');
      return { match, confidence: 66, sources: ['no-demo-or-trial'] };
    },
  },
  {
    id: 'seo-investment',
    title: 'SEO and organic growth investment',
    category: 'marketing',
    description: 'Structured data detected. Company is SEO-aware and may be ready to scale organic efforts.',
    suggestedOpener: "Saw you have structured data set up. Looks like organic is on your radar. What's your traffic goal?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'seo-aware');
      return { match, confidence: 58, sources: ['seo-aware'] };
    },
  },

  // AI angles - always available
  {
    id: 'ai-automation',
    title: 'AI-powered workflow automation',
    category: 'operations',
    description: 'AI can automate repetitive tasks like data entry, email responses, report generation, and customer routing. Reduces manual work by 40-60%.',
    suggestedOpener: "Quick question — how much time does your team spend on repetitive tasks like data entry or reporting? AI can cut that in half.",
    condition: (signals, _d, company) => {
      const match = signals.some(s => s.id === 'ai-opportunity');
      return { match, confidence: 78, sources: ['ai-opportunity'] };
    },
  },
  {
    id: 'ai-customer-experience',
    title: 'AI-enhanced customer experience',
    category: 'growth',
    description: 'AI chatbots, personalized recommendations, and intelligent support can transform customer interactions. Reduces response time and increases satisfaction.',
    suggestedOpener: "Are your customers getting instant answers when they need them? AI-powered support can handle 70% of queries without human intervention.",
    condition: (signals, detections) => {
      const noChat = !detections.some(d => d.category === 'Sales / Support');
      const match = signals.some(s => s.id === 'ai-opportunity') && noChat;
      return { match, confidence: 75, sources: ['ai-opportunity'] };
    },
  },
  {
    id: 'ai-content-marketing',
    title: 'AI-powered content and marketing',
    category: 'marketing',
    description: 'AI can scale content production, personalize email campaigns, optimize ad copy, and generate social media content. 10x output without 10x headcount.',
    suggestedOpener: "Content is king but creating it is expensive. AI can help you produce 10x more high-quality content without hiring a bigger team.",
    condition: (signals, _d, company) => {
      const match = signals.some(s => s.id === 'ai-opportunity') && (company.hasBlog || company.type === 'agency');
      return { match, confidence: 76, sources: ['ai-opportunity', 'content-motion'] };
    },
  },
  {
    id: 'ai-sales-intelligence',
    title: 'AI-driven sales intelligence',
    category: 'revops',
    description: 'AI can qualify leads automatically, predict deal outcomes, draft personalized outreach, and surface buying signals from prospect behavior.',
    suggestedOpener: "How are you prioritizing which leads to call first? AI can score and rank your pipeline so your team focuses on the highest-value prospects.",
    condition: (signals, _d, company) => {
      const match = signals.some(s => s.id === 'ai-opportunity') && (company.type === 'saas' || company.type === 'services');
      return { match, confidence: 74, sources: ['ai-opportunity'] };
    },
  },
  {
    id: 'ai-data-analytics',
    title: 'AI-powered analytics and insights',
    category: 'operations',
    description: 'AI can turn raw data into actionable insights, build dashboards that explain themselves, and predict trends before they happen.',
    suggestedOpener: "Are you making decisions based on data or gut feel? AI analytics can surface patterns your team would never spot manually.",
    condition: (signals, detections) => {
      const hasAnalytics = detections.some(d => d.category === 'Analytics');
      const match = signals.some(s => s.id === 'ai-opportunity') && hasAnalytics;
      return { match, confidence: 70, sources: ['ai-opportunity'] };
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
