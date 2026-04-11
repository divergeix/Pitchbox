export interface CompanyProfile {
  name: string;
  domain: string;
  tagline: string;
  description: string;
  industry: string;
  type: 'saas' | 'ecommerce' | 'agency' | 'services' | 'media' | 'unknown';
  hasCareerPage: boolean;
  hasBlog: boolean;
  hasPricingPage: boolean;
  hasFreeTrial: boolean;
  hasDemoPage: boolean;
  hasCaseStudies: boolean;
  hasApiDocs: boolean;
  hasIntegrationsPage: boolean;
  estimatedSize: string;
}

export function extractCompanyIdentity(doc: Document, domain: string): Pick<CompanyProfile, 'name' | 'domain' | 'tagline' | 'description' | 'industry' | 'type'> {
  const title = doc.querySelector('title')?.textContent?.trim() || '';
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

  // Company name: prefer og:site_name, then parse from title
  let name = ogSiteName;
  if (!name) {
    // Common title patterns: "Company - Tagline" or "Tagline | Company"
    const titleParts = title.split(/\s*[-|]\s*/);
    name = titleParts.length > 1 ? titleParts[0].trim() : domain.split('.')[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  const tagline = ogTitle || (title.includes(' - ') ? title.split(' - ').slice(1).join(' - ').trim() : '');
  const description = metaDesc || ogDesc;

  // Industry guess from content
  const industry = guessIndustry(doc);

  // Business type guess
  const type = guessBusinessType(doc);

  return { name, domain, tagline, description, industry, type };
}

export function extractBusinessContext(doc: Document): Omit<CompanyProfile, 'name' | 'domain' | 'tagline' | 'description' | 'industry' | 'type'> {
  const html = doc.documentElement.outerHTML.toLowerCase();
  const links = Array.from(doc.querySelectorAll('a')).map(a => a.href.toLowerCase());
  const text = doc.body?.innerText?.toLowerCase() || '';

  return {
    hasCareerPage: links.some(l => l.includes('/careers') || l.includes('/jobs') || l.includes('greenhouse.io') || l.includes('lever.co')),
    hasBlog: links.some(l => l.includes('/blog') || l.includes('/articles') || l.includes('/news')),
    hasPricingPage: links.some(l => l.includes('/pricing') || l.includes('/plans')),
    hasFreeTrial: text.includes('free trial') || text.includes('start free') || text.includes('try free') || text.includes('try for free'),
    hasDemoPage: text.includes('book a demo') || text.includes('request demo') || text.includes('schedule demo') || text.includes('get a demo'),
    hasCaseStudies: links.some(l => l.includes('/case-stud') || l.includes('/customers') || l.includes('/success-stories')),
    hasApiDocs: links.some(l => l.includes('/docs') || l.includes('/api') || l.includes('/developers')),
    hasIntegrationsPage: links.some(l => l.includes('/integrations') || l.includes('/marketplace') || l.includes('/apps')),
    estimatedSize: estimateCompanySize(doc),
  };
}

function guessIndustry(doc: Document): string {
  const text = (doc.body?.innerText || '').toLowerCase();
  const industryKeywords: Record<string, string[]> = {
    'SaaS': ['saas', 'software as a service', 'cloud platform', 'subscription'],
    'Fintech': ['fintech', 'financial technology', 'payments', 'banking', 'lending'],
    'Healthtech': ['health tech', 'healthcare', 'telemedicine', 'patient', 'clinical'],
    'Edtech': ['edtech', 'education', 'learning platform', 'courses', 'students'],
    'Ecommerce': ['ecommerce', 'online store', 'shopping', 'retail', 'products'],
    'Marketing': ['marketing', 'advertising', 'campaign', 'seo', 'content marketing'],
    'HR Tech': ['hr tech', 'recruiting', 'talent', 'hiring', 'human resources'],
    'Cybersecurity': ['cybersecurity', 'security platform', 'threat detection', 'vulnerability'],
    'AI/ML': ['artificial intelligence', 'machine learning', 'ai-powered', 'deep learning'],
    'DevTools': ['developer tools', 'devops', 'ci/cd', 'infrastructure', 'deployment'],
  };

  let bestMatch = '';
  let bestScore = 0;
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = industry;
    }
  }
  return bestMatch || 'Unknown';
}

function guessBusinessType(doc: Document): CompanyProfile['type'] {
  const html = doc.documentElement.outerHTML.toLowerCase();
  const text = (doc.body?.innerText || '').toLowerCase();

  if (html.includes('shopify') || html.includes('woocommerce') || html.includes('add to cart') || html.includes('shop now')) return 'ecommerce';
  if (text.includes('agency') || text.includes('our clients') || text.includes('our work') || text.includes('portfolio')) return 'agency';
  if (text.includes('saas') || text.includes('free trial') || text.includes('subscription') || text.includes('per month')) return 'saas';
  if (text.includes('consulting') || text.includes('professional services') || text.includes('our expertise')) return 'services';
  if (text.includes('news') || text.includes('media') || text.includes('publication') || text.includes('editorial')) return 'media';
  return 'unknown';
}

function estimateCompanySize(doc: Document): string {
  const text = (doc.body?.innerText || '').toLowerCase();
  const links = Array.from(doc.querySelectorAll('a')).map(a => a.href.toLowerCase());

  // Strong signals
  if (text.includes('enterprise') && (text.includes('fortune 500') || text.includes('global team'))) return '1000+';
  if (text.includes('ipo') || text.includes('publicly traded')) return '1000+';

  // Career page signals
  const hasCareerPage = links.some(l => l.includes('/careers') || l.includes('/jobs'));
  const jobBoardLinks = links.filter(l => l.includes('greenhouse.io') || l.includes('lever.co') || l.includes('ashbyhq.com'));

  if (jobBoardLinks.length > 0) return '51-200';
  if (hasCareerPage) return '11-50';

  // Team page signals
  if (links.some(l => l.includes('/team') || l.includes('/about'))) return '11-50';

  return '1-10';
}
