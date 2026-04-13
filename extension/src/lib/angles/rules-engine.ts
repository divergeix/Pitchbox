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
  aiGenerated?: boolean;
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

  // --- Local business angles ---
  {
    id: 'local-online-visibility',
    title: 'Local business online visibility',
    category: 'marketing',
    description: 'Local business that could improve online presence through Google Business, local SEO, and review management.',
    suggestedOpener: "How are customers finding you online right now? Local SEO and review management can significantly increase walk-ins and bookings.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'local-online-presence');
      return { match, confidence: 72, sources: ['local-online-presence'] };
    },
  },
  {
    id: 'local-email-repeat',
    title: 'Email marketing for repeat customers',
    category: 'marketing',
    description: 'No email marketing detected. Repeat customers are the most profitable segment for local businesses.',
    suggestedOpener: "Are you staying in touch with past customers? A simple email campaign can drive repeat visits and referrals.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'local-no-email-marketing');
      return { match, confidence: 70, sources: ['local-no-email-marketing'] };
    },
  },
  {
    id: 'local-booking-online',
    title: 'Online booking and inquiry optimization',
    category: 'design-cro',
    description: 'No clear online booking or inquiry form. Converting website visitors into customers requires a frictionless path.',
    suggestedOpener: "Visited your site but couldn't easily book or inquire online. Are most customers calling in instead?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'local-no-booking');
      return { match, confidence: 76, sources: ['local-no-booking'] };
    },
  },
  {
    id: 'local-map-directions',
    title: 'Location and directions visibility',
    category: 'design-cro',
    description: 'No embedded map found. Making it easy for customers to find you can increase visits.',
    suggestedOpener: "I didn't see a map on your site. Making directions easy to find can reduce no-shows and increase footfall.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'local-no-map');
      return { match, confidence: 62, sources: ['local-no-map'] };
    },
  },

  // --- AI angles (only for B2B companies, tied to specific tech gaps) ---
  {
    id: 'ai-automation',
    title: 'AI-powered workflow automation',
    category: 'operations',
    description: 'AI can automate repetitive tasks. Particularly relevant given their current tech stack and team size.',
    suggestedOpener: "Quick question — how much time does your team spend on repetitive tasks? AI can cut that significantly.",
    condition: (signals, _d, company) => {
      const match = signals.some(s => s.id === 'ai-opportunity') && signals.some(s => s.id === 'small-team');
      return { match, confidence: 76, sources: ['ai-opportunity', 'small-team'] };
    },
  },
  {
    id: 'ai-customer-support',
    title: 'AI-enhanced customer support',
    category: 'support',
    description: 'No chat/support widget detected. AI chatbot could handle first-line customer queries automatically.',
    suggestedOpener: "I didn't spot a chat widget on your site. An AI chatbot could handle common questions 24/7 without adding headcount.",
    condition: (signals, detections, company) => {
      const noChat = !detections.some(d => d.category === 'Chat / Support' || d.category === 'Sales / Support');
      const match = signals.some(s => s.id === 'ai-opportunity') && noChat;
      return { match, confidence: 74, sources: ['ai-opportunity'] };
    },
  },
  {
    id: 'ai-content-scale',
    title: 'AI-powered content scaling',
    category: 'marketing',
    description: 'Active blog detected. AI can help scale content production and distribution without more writers.',
    suggestedOpener: "Your blog is active. AI can help you produce more high-quality content and repurpose it across channels.",
    condition: (signals, _d, company) => {
      const match = signals.some(s => s.id === 'ai-opportunity') && company.hasBlog;
      return { match, confidence: 72, sources: ['ai-opportunity', 'content-motion'] };
    },
  },
  {
    id: 'ai-lead-scoring',
    title: 'AI-driven lead scoring and routing',
    category: 'revops',
    description: 'Running ads or getting form submissions but no CRM detected. AI can qualify and route leads automatically.',
    suggestedOpener: "You're generating leads but I didn't see a CRM. AI can score, qualify, and route leads so your team only talks to the best ones.",
    condition: (signals, detections, company) => {
      const match = signals.some(s => s.id === 'ads-no-crm' || s.id === 'chat-no-crm');
      return { match, confidence: 78, sources: ['ads-no-crm', 'chat-no-crm'] };
    },
  },

  // --- NEW tech-stack-specific angles ---
  {
    id: 'wp-security',
    title: 'WordPress security hardening',
    category: 'engineering',
    description: 'WordPress site without visible security plugin. Vulnerable to common attacks.',
    suggestedOpener: "Your WordPress site doesn't seem to have a security plugin. WordPress sites get targeted constantly - worth a quick audit.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'wp-security-gap');
      return { match, confidence: 80, sources: ['wp-security-gap'] };
    },
  },
  {
    id: 'wp-performance',
    title: 'WordPress performance optimization',
    category: 'engineering',
    description: 'WordPress with multiple plugins. Site speed and performance may be affected.',
    suggestedOpener: "Noticed your WordPress site has a few plugins stacked up. That can slow things down and hurt conversions.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'wp-plugin-stack');
      return { match, confidence: 72, sources: ['wp-plugin-stack'] };
    },
  },
  {
    id: 'modern-stack-marketing-gap',
    title: 'Developer-built site needs marketing layer',
    category: 'marketing',
    description: 'Modern tech stack (React/Next.js) but no analytics or marketing tools. Developer-led build that needs marketing infrastructure.',
    suggestedOpener: "Your site is built on a modern stack but I didn't see analytics or marketing tools. Are you tracking what's working?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'modern-stack-no-analytics');
      return { match, confidence: 82, sources: ['modern-stack-no-analytics'] };
    },
  },
  {
    id: 'analytics-consolidation',
    title: 'Analytics stack consolidation',
    category: 'operations',
    description: 'Multiple analytics tools detected. Data may be inconsistent across platforms.',
    suggestedOpener: "I see multiple analytics tools on your site. Are you getting a single source of truth or fighting fragmented data?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'multi-analytics');
      return { match, confidence: 74, sources: ['multi-analytics'] };
    },
  },
  {
    id: 'ads-crm-gap',
    title: 'Ad spend without lead tracking',
    category: 'revops',
    description: 'Running paid ads but no CRM detected. Ad spend may be wasted without proper lead tracking.',
    suggestedOpener: "You're running paid ads but I didn't see a CRM. How are you tracking which ads actually generate revenue?",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'ads-no-crm');
      return { match, confidence: 82, sources: ['ads-no-crm'] };
    },
  },
  {
    id: 'ecom-reviews',
    title: 'Product reviews and ratings',
    category: 'ecommerce',
    description: 'Ecommerce site without review system. Product reviews directly impact conversion rates.',
    suggestedOpener: "Your store doesn't seem to have product reviews enabled. Reviews can boost conversion rates significantly.",
    condition: (signals) => {
      const match = signals.some(s => s.id === 'ecom-no-reviews');
      return { match, confidence: 80, sources: ['ecom-no-reviews'] };
    },
  },

  // ============ INDUSTRY-SPECIFIC ANGLES ============

  // --- HOSPITALITY ---
  {
    id: 'hotel-direct-booking',
    title: 'Direct booking optimization',
    category: 'growth',
    description: 'Hotels lose 15-25% commission to OTAs. Improving direct booking can significantly increase margins.',
    suggestedOpener: "How much of your bookings come from OTAs vs direct? Most hotels can shift 10-20% to direct with the right website strategy.",
    condition: (_s, _d, company) => ({ match: company.type === 'hospitality', confidence: 82, sources: [] }),
  },
  {
    id: 'hotel-guest-experience',
    title: 'Digital guest experience',
    category: 'operations',
    description: 'Pre-arrival emails, digital check-in, and post-stay review requests can transform guest satisfaction.',
    suggestedOpener: "Are you sending pre-arrival emails or collecting reviews post-checkout? That touchpoint can drive repeat bookings.",
    condition: (_s, _d, company) => ({ match: company.type === 'hospitality', confidence: 76, sources: [] }),
  },
  {
    id: 'hotel-reputation',
    title: 'Online reputation management',
    category: 'marketing',
    description: 'Reviews on Google, TripAdvisor, and Booking.com directly impact occupancy rates.',
    suggestedOpener: "Your Google reviews are the first thing guests see. Are you actively managing and responding to them?",
    condition: (_s, _d, company) => ({ match: company.type === 'hospitality', confidence: 74, sources: [] }),
  },

  // --- HEALTHCARE ---
  {
    id: 'health-patient-acquisition',
    title: 'Digital patient acquisition',
    category: 'marketing',
    description: 'Patients search online before choosing a doctor or hospital. SEO and Google Business Profile are critical.',
    suggestedOpener: "Most patients Google their symptoms before calling. Is your clinic showing up for the right search terms?",
    condition: (_s, _d, company) => ({ match: company.type === 'healthcare', confidence: 80, sources: [] }),
  },
  {
    id: 'health-appointment-booking',
    title: 'Online appointment scheduling',
    category: 'design-cro',
    description: 'Online booking reduces phone calls and no-shows. Patients prefer self-service scheduling.',
    suggestedOpener: "Do patients have to call to book an appointment? Online scheduling can cut phone load by 40% and reduce no-shows.",
    condition: (signals, _d, company) => {
      const noBooking = !signals.some(s => s.id === 'local-no-booking');
      return { match: company.type === 'healthcare' && noBooking, confidence: 78, sources: [] };
    },
  },
  {
    id: 'health-patient-reviews',
    title: 'Patient review management',
    category: 'growth',
    description: 'Healthcare decisions are heavily influenced by patient reviews. Managing them is critical.',
    suggestedOpener: "Patient reviews on Google can make or break a practice. Are you actively collecting and responding to them?",
    condition: (_s, _d, company) => ({ match: company.type === 'healthcare', confidence: 74, sources: [] }),
  },

  // --- SAAS SPECIFIC ---
  {
    id: 'saas-onboarding',
    title: 'User onboarding optimization',
    category: 'growth',
    description: 'SaaS companies lose 40-60% of trial users in the first week. Onboarding is the biggest lever.',
    suggestedOpener: "What does your trial-to-paid conversion look like? Most SaaS companies leave a lot on the table in onboarding.",
    condition: (signals, _d, company) => {
      const hasTrial = signals.some(s => s.id === 'free-trial');
      return { match: company.type === 'saas' && hasTrial, confidence: 80, sources: ['free-trial'] };
    },
  },
  {
    id: 'saas-churn-reduction',
    title: 'Churn reduction strategy',
    category: 'revops',
    description: 'Reducing churn by even 5% can increase profits by 25-95%. Usage data and health scores are key.',
    suggestedOpener: "What's your current churn rate? Even a small improvement in retention has an outsized impact on revenue.",
    condition: (_s, _d, company) => ({ match: company.type === 'saas', confidence: 72, sources: [] }),
  },
  {
    id: 'saas-product-led',
    title: 'Product-led growth acceleration',
    category: 'growth',
    description: 'Self-serve pricing and free trial suggest a PLG motion. In-app growth loops can accelerate it.',
    suggestedOpener: "Your PLG setup looks solid. Are you using in-app prompts and usage triggers to drive expansion revenue?",
    condition: (signals, _d, company) => {
      const hasTrial = signals.some(s => s.id === 'free-trial');
      const hasPricing = signals.some(s => s.id === 'pricing-page-exists');
      return { match: company.type === 'saas' && hasTrial && hasPricing, confidence: 76, sources: [] };
    },
  },

  // --- AGENCY SPECIFIC ---
  {
    id: 'agency-lead-gen',
    title: 'Agency lead generation beyond referrals',
    category: 'growth',
    description: 'Most agencies rely on referrals. Building a predictable lead pipeline is the #1 growth challenge.',
    suggestedOpener: "How do you generate new clients right now? Most agencies want to grow beyond referrals but struggle with outbound.",
    condition: (_s, _d, company) => ({ match: company.type === 'agency', confidence: 78, sources: [] }),
  },
  {
    id: 'agency-case-study-machine',
    title: 'Case study production system',
    category: 'marketing',
    description: 'Agencies live and die by their portfolio. Systematizing case study production builds a sales asset library.',
    suggestedOpener: "Your work speaks for itself, but are you turning every project into a case study? That's the best sales asset an agency can have.",
    condition: (signals, _d, company) => {
      const noCaseStudies = signals.some(s => s.id === 'no-case-studies-commercial');
      return { match: company.type === 'agency' && noCaseStudies, confidence: 76, sources: [] };
    },
  },
  {
    id: 'agency-positioning',
    title: 'Agency positioning and differentiation',
    category: 'marketing',
    description: 'Generic agency messaging makes it hard to stand out. Clear positioning wins better clients at higher rates.',
    suggestedOpener: "What makes your agency different from the 10,000 others? If the answer isn't immediately clear on your site, positioning might be worth revisiting.",
    condition: (_s, _d, company) => ({ match: company.type === 'agency', confidence: 72, sources: [] }),
  },

  // --- ECOMMERCE SPECIFIC ---
  {
    id: 'ecom-cart-abandonment',
    title: 'Cart abandonment recovery',
    category: 'ecommerce',
    description: 'Average cart abandonment is 70%. Email and retargeting sequences can recover 10-15% of lost sales.',
    suggestedOpener: "Are you recovering abandoned carts? Most stores leave 70% of their revenue on the table without a recovery flow.",
    condition: (_s, _d, company) => ({ match: company.type === 'ecommerce', confidence: 80, sources: [] }),
  },
  {
    id: 'ecom-retention',
    title: 'Customer retention and LTV',
    category: 'ecommerce',
    description: 'Acquiring a new customer costs 5-25x more than retaining one. Post-purchase email flows drive repeat revenue.',
    suggestedOpener: "What percentage of your customers buy a second time? Post-purchase email flows can significantly increase repeat purchases.",
    condition: (_s, _d, company) => ({ match: company.type === 'ecommerce', confidence: 76, sources: [] }),
  },

  // --- SERVICES/CONSULTING ---
  {
    id: 'services-thought-leadership',
    title: 'Thought leadership content strategy',
    category: 'marketing',
    description: 'Services companies win on trust. Regular thought leadership content positions you as the expert.',
    suggestedOpener: "Are your founders or consultants publishing thought leadership content? That's the #1 trust builder for services firms.",
    condition: (_s, _d, company) => ({ match: company.type === 'services', confidence: 74, sources: [] }),
  },
  {
    id: 'services-proposal-automation',
    title: 'Proposal and sales process automation',
    category: 'operations',
    description: 'Services companies spend too much time on proposals. Automating the process frees up selling time.',
    suggestedOpener: "How long does it take your team to put together a proposal? Automation can cut that from days to hours.",
    condition: (_s, _d, company) => ({ match: company.type === 'services', confidence: 70, sources: [] }),
  },

  // --- EDUCATION ---
  {
    id: 'edu-enrollment',
    title: 'Digital enrollment funnel',
    category: 'growth',
    description: 'Student enrollment is increasingly digital. A strong online presence directly impacts admissions.',
    suggestedOpener: "How are prospective students finding and applying to your institution? Most admissions teams are going digital-first.",
    condition: (_s, _d, company) => ({ match: company.type === 'education', confidence: 74, sources: [] }),
  },

  // --- TRAVEL ---
  {
    id: 'travel-personalization',
    title: 'Travel personalization engine',
    category: 'growth',
    description: 'Personalized recommendations based on search history and preferences increase booking conversion.',
    suggestedOpener: "Are you personalizing travel recommendations based on user behavior? That can significantly lift booking rates.",
    condition: (_s, _d, company) => ({ match: company.type === 'travel', confidence: 78, sources: [] }),
  },
  {
    id: 'travel-loyalty',
    title: 'Loyalty and rewards program',
    category: 'revops',
    description: 'Travel loyalty programs drive repeat bookings and increase customer lifetime value.',
    suggestedOpener: "Do you have a loyalty program? Repeat travelers are your most profitable segment.",
    condition: (_s, _d, company) => ({ match: company.type === 'travel', confidence: 74, sources: [] }),
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
