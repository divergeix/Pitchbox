// Scans raw HTML string (from fetch) for tech detections
// Used by Deep Scan to analyze subpages without navigating to them

export interface SubpageScanResult {
  url: string;
  detections: Array<{ name: string; category: string; source: string; confidence: string }>;
  title: string;
  hasCareerPage: boolean;
  hasBlog: boolean;
  hasPricingPage: boolean;
  hasCaseStudies: boolean;
  hasApiDocs: boolean;
  hasDemoPage: boolean;
  hasFreeTrial: boolean;
  teamMembers: Array<{ name: string; role: string }>;
  customerLogos: string[];
  emails: string[];
  phones: string[];
}

export function scanHTML(html: string, url: string): SubpageScanResult {
  const detections: SubpageScanResult['detections'] = [];
  const lowerHtml = html.toLowerCase();

  function ck(name: string, category: string, test: () => boolean, source: string) {
    try { if (test()) detections.push({ name, category, source, confidence: 'strong' }); } catch {}
  }

  // CMS
  ck('WordPress', 'CMS / Site Builder', () => html.includes('wp-content') || html.includes('wp-includes'), 'WordPress');
  ck('Drupal', 'CMS / Site Builder', () => html.includes('Drupal') || html.includes('drupal.js') || html.includes('sites/default/files'), 'Drupal');
  ck('Shopify', 'CMS / Site Builder', () => html.includes('Shopify.theme') || html.includes('myshopify.com'), 'Shopify');
  ck('Webflow', 'CMS / Site Builder', () => html.includes('webflow.com'), 'Webflow');
  ck('Wix', 'CMS / Site Builder', () => html.includes('static.wixstatic.com') || html.includes('parastorage.com'), 'Wix');

  // Frontend
  ck('React', 'Frontend Framework', () => html.includes('react.production') || html.includes('react-dom') || html.includes('data-reactroot'), 'React');
  ck('Next.js', 'Frontend Framework', () => html.includes('__NEXT_DATA__') || html.includes('/_next/'), 'Next.js');
  ck('Vue.js', 'Frontend Framework', () => html.includes('vue.js') || html.includes('vue.min.js') || html.includes('data-v-'), 'Vue.js');
  ck('Angular', 'Frontend Framework', () => html.includes('ng-version'), 'Angular');

  // CSS/Libraries
  ck('Bootstrap', 'CSS Framework', () => html.includes('bootstrap.min.css') || html.includes('bootstrap.min.js'), 'Bootstrap');
  ck('Tailwind CSS', 'CSS Framework', () => html.includes('tailwindcss'), 'Tailwind');
  ck('jQuery', 'Library', () => html.includes('jquery.min.js') || html.includes('jquery.js'), 'jQuery');

  // Analytics
  ck('Google Analytics (GA4)', 'Analytics', () => html.includes('gtag/js?id=G-'), 'GA4');
  ck('Google Tag Manager', 'Analytics', () => html.includes('googletagmanager.com/gtm.js'), 'GTM');
  ck('Hotjar', 'Analytics', () => html.includes('static.hotjar.com'), 'Hotjar');
  ck('Segment', 'Analytics', () => html.includes('cdn.segment.com'), 'Segment');
  ck('Mixpanel', 'Analytics', () => html.includes('cdn.mxpnl.com'), 'Mixpanel');
  ck('Microsoft Clarity', 'Analytics', () => html.includes('clarity.ms'), 'Clarity');
  ck('Adobe Analytics', 'Analytics', () => html.includes('adobedtm.com') || html.includes('omtrdc.net'), 'Adobe');

  // Marketing
  ck('HubSpot', 'Marketing', () => html.includes('js.hs-scripts.com') || html.includes('hsforms.com'), 'HubSpot');
  ck('Mailchimp', 'Marketing', () => html.includes('mailchimp.com') || html.includes('chimpstatic.com'), 'Mailchimp');
  ck('Klaviyo', 'Marketing', () => html.includes('static.klaviyo.com'), 'Klaviyo');
  ck('Intercom', 'Marketing', () => html.includes('widget.intercom.io') || html.includes('intercomSettings'), 'Intercom');
  ck('ActiveCampaign', 'Marketing', () => html.includes('trackcmp.net'), 'ActiveCampaign');

  // Chat
  ck('Zendesk', 'Chat / Support', () => html.includes('static.zdassets.com'), 'Zendesk');
  ck('Crisp', 'Chat / Support', () => html.includes('client.crisp.chat'), 'Crisp');
  ck('Tawk.to', 'Chat / Support', () => html.includes('embed.tawk.to'), 'Tawk.to');
  ck('Drift', 'Chat / Support', () => html.includes('js.driftt.com'), 'Drift');
  ck('Calendly', 'Chat / Support', () => html.includes('calendly.com'), 'Calendly');

  // Payments
  ck('Stripe', 'Ecommerce / Payments', () => html.includes('js.stripe.com'), 'Stripe');
  ck('PayPal', 'Ecommerce / Payments', () => html.includes('paypalobjects.com'), 'PayPal');
  ck('Razorpay', 'Ecommerce / Payments', () => html.includes('checkout.razorpay.com') || html.includes('api.razorpay.com'), 'Razorpay');

  // Pixels
  ck('Meta Pixel', 'Ad Pixel', () => html.includes('connect.facebook.net') || html.includes('fbevents.js'), 'Meta Pixel');
  ck('Google Ads', 'Ad Pixel', () => html.includes('gtag/js?id=AW-'), 'Google Ads');
  ck('LinkedIn Insight', 'Ad Pixel', () => html.includes('px.ads.linkedin.com'), 'LinkedIn');

  // Infra
  ck('Cloudflare', 'Infrastructure', () => html.includes('cdnjs.cloudflare.com') || html.includes('challenges.cloudflare.com'), 'Cloudflare');
  ck('AWS', 'Infrastructure', () => html.includes('.amazonaws.com') || html.includes('cloudfront.net'), 'AWS');
  ck('Vercel', 'Infrastructure', () => html.includes('vercel-analytics'), 'Vercel');

  // Monitoring
  ck('Sentry', 'Monitoring', () => html.includes('sentry.io') || html.includes('browser.sentry-cdn.com'), 'Sentry');
  ck('New Relic', 'Monitoring', () => html.includes('newrelic.com') || html.includes('NREUM'), 'New Relic');

  // Security
  ck('reCAPTCHA', 'Security', () => html.includes('google.com/recaptcha'), 'reCAPTCHA');

  // Cookie
  ck('OneTrust', 'Cookie Consent', () => html.includes('onetrust.com') || html.includes('cdn.cookielaw.org'), 'OneTrust');
  ck('Cookiebot', 'Cookie Consent', () => html.includes('cookiebot.com'), 'Cookiebot');

  // Push
  ck('OneSignal', 'Push Notifications', () => html.includes('onesignal.com'), 'OneSignal');
  ck('WebEngage', 'Push Notifications', () => html.includes('webengage.com'), 'WebEngage');
  ck('CleverTap', 'Push Notifications', () => html.includes('clevertap.com') || html.includes('wzrkt.com'), 'CleverTap');

  // Trust
  if (lowerHtml.includes('soc 2') || lowerHtml.includes('soc2')) detections.push({ name: 'SOC 2 compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
  if (lowerHtml.includes('gdpr')) detections.push({ name: 'GDPR compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
  if (lowerHtml.includes('hipaa')) detections.push({ name: 'HIPAA compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
  if (lowerHtml.includes('iso 27001')) detections.push({ name: 'ISO 27001', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });

  // Extract page title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Page context signals
  const pathLower = url.toLowerCase();
  const bodyText = html.replace(/<[^>]*>/g, ' ').toLowerCase();

  const hasCaseStudies = ['/case-stud','/casestud','/customers','/customer-stor','/success-stor','/testimonial','/results','/portfolio','/our-work','/projects','/use-case','/usecases','/client-stor'].some(p => pathLower.includes(p)) ||
    ['case study','case studies','success story','customer story','client story'].some(k => bodyText.includes(k));
  const hasApiDocs = ['/api-reference','/api-docs','/api-documentation','/developers','/developer','/docs','/documentation','/sdk','/swagger','/redoc','/openapi'].some(p => pathLower.includes(p));
  const hasDemoPage = ['book a demo','request demo','schedule demo','get a demo','request a demo','schedule a demo','contact sales','talk to sales','book a call','free consultation'].some(k => bodyText.includes(k));
  const hasFreeTrial = ['free trial','start free','try free','try for free','free plan','get started free','sign up free','no credit card','14-day trial','30-day trial','free forever'].some(k => bodyText.includes(k));
  const hasPricingPage = ['/pricing','/plans','/packages','/price','/billing','/subscriptions','/compare-plans','/editions','/tiers'].some(p => pathLower.includes(p));
  const hasBlog = ['/blog','/blogs','/articles','/news','/resources','/insights','/updates','/journal','/newsroom','/stories','/learn','/library','/guides','/whitepapers','/posts'].some(p => pathLower.includes(p));
  const hasCareerPage = ['/careers','/career','/jobs','/job-opening','/join-us','/join','/work-with-us','/openings','/vacancies','/hiring','/opportunities','/positions'].some(p => pathLower.includes(p));

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emails = (bodyText.match(emailRegex) || []).filter((e: string, i: number, a: string[]) => a.indexOf(e) === i).slice(0, 5);

  // Extract phones
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  const phones = (bodyText.match(phoneRegex) || []).filter((p: string) => {
    const digits = p.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }).filter((p: string, i: number, a: string[]) => a.indexOf(p) === i).slice(0, 3);

  // Extract team members from team/about pages
  const teamMembers: Array<{ name: string; role: string }> = [];
  if (pathLower.includes('/team') || pathLower.includes('/about') || pathLower.includes('/leadership')) {
    // Look for name-role patterns in HTML
    const nameRoleRegex = /<h[2-5][^>]*>([^<]{2,50})<\/h[2-5]>\s*(?:<[^>]*>)*\s*<(?:p|span|div)[^>]*>([^<]{2,80})<\/(?:p|span|div)>/gi;
    let match;
    while ((match = nameRoleRegex.exec(html)) !== null && teamMembers.length < 15) {
      const name = match[1].replace(/<[^>]*>/g, '').trim();
      const role = match[2].replace(/<[^>]*>/g, '').trim();
      if (name.length > 2 && name.length < 50 && !name.includes('{') && !name.includes('<')) {
        teamMembers.push({ name, role });
      }
    }
  }

  // Extract customer logos from case study/customer pages
  const customerLogos: string[] = [];
  if (hasCaseStudies || pathLower.includes('/partner') || pathLower.includes('/client')) {
    const imgRegex = /<img[^>]*alt=["']([^"']{2,60})["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null && customerLogos.length < 15) {
      const alt = imgMatch[1].trim();
      if (alt.length > 1 && alt.length < 60 && !alt.includes('{') && !alt.toLowerCase().includes('icon') && !alt.toLowerCase().includes('arrow')) {
        customerLogos.push(alt);
      }
    }
  }

  return {
    url, detections, title,
    hasCareerPage, hasBlog, hasPricingPage, hasCaseStudies, hasApiDocs, hasDemoPage, hasFreeTrial,
    teamMembers, customerLogos, emails, phones,
  };
}
