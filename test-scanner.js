// Test script: Fetches 100 websites and runs scanner logic against them
// Usage: node test-scanner.js

const https = require('https');
const http = require('http');

const SITES = [
  // SaaS (15)
  { url: 'https://hubspot.com', expected: { type: 'saas', mustDetect: ['HubSpot'] } },
  { url: 'https://stripe.com', expected: { type: 'saas', mustDetect: ['Stripe'] } },
  { url: 'https://slack.com', expected: { type: 'saas' } },
  { url: 'https://notion.so', expected: { type: 'saas' } },
  { url: 'https://linear.app', expected: { type: 'saas' } },
  { url: 'https://vercel.com', expected: { type: 'saas', mustDetect: ['Vercel'] } },
  { url: 'https://netlify.com', expected: { type: 'saas' } },
  { url: 'https://datadog.com', expected: { type: 'saas' } },
  { url: 'https://mixpanel.com', expected: { type: 'saas' } },
  { url: 'https://postman.com', expected: { type: 'saas' } },
  { url: 'https://figma.com', expected: { type: 'saas' } },
  { url: 'https://calendly.com', expected: { type: 'saas', mustDetect: ['Calendly'] } },
  { url: 'https://intercom.com', expected: { type: 'saas', mustDetect: ['Intercom'] } },
  { url: 'https://freshworks.com', expected: { type: 'saas' } },
  { url: 'https://zendesk.com', expected: { type: 'saas', mustDetect: ['Zendesk'] } },

  // Ecommerce (10)
  { url: 'https://gymshark.com', expected: { type: 'ecommerce', mustDetect: ['Shopify'] } },
  { url: 'https://allbirds.com', expected: { type: 'ecommerce', mustDetect: ['Shopify'] } },
  { url: 'https://bombas.com', expected: { type: 'ecommerce', mustDetect: ['Shopify'] } },
  { url: 'https://store.google.com', expected: { type: 'ecommerce' } },
  { url: 'https://www.etsy.com', expected: { type: 'ecommerce' } },
  { url: 'https://www.zappos.com', expected: { type: 'ecommerce' } },
  { url: 'https://www.wayfair.com', expected: { type: 'ecommerce' } },
  { url: 'https://www.target.com', expected: { type: 'ecommerce' } },
  { url: 'https://www.bestbuy.com', expected: { type: 'ecommerce' } },
  { url: 'https://www.nike.com', expected: { type: 'ecommerce' } },

  // Agency (10)
  { url: 'https://www.hashengage.com', expected: { type: 'agency' } },
  { url: 'https://www.webfx.com', expected: { type: 'agency' } },
  { url: 'https://www.wpromote.com', expected: { type: 'agency' } },
  { url: 'https://www.singlegrain.com', expected: { type: 'agency' } },
  { url: 'https://neilpatel.com', expected: { type: 'agency' } },
  { url: 'https://www.socialmediaexaminer.com', expected: { type: 'agency' } },
  { url: 'https://www.lyfemarketing.com', expected: { type: 'agency' } },
  { url: 'https://www.ignitevisibility.com', expected: { type: 'agency' } },
  { url: 'https://www.disruptiveadvertising.com', expected: { type: 'agency' } },
  { url: 'https://eximworx.com', expected: { type: 'agency' } },

  // Hospitality (8)
  { url: 'https://www.thepresidencyindia.com', expected: { type: 'hospitality', mustNotDetect: ['Shopify'] } },
  { url: 'https://www.marriott.com', expected: { type: 'hospitality' } },
  { url: 'https://www.hilton.com', expected: { type: 'hospitality' } },
  { url: 'https://www.hyatt.com', expected: { type: 'hospitality' } },
  { url: 'https://www.ihg.com', expected: { type: 'hospitality' } },
  { url: 'https://www.tajhotels.com', expected: { type: 'hospitality' } },
  { url: 'https://www.oberoihotels.com', expected: { type: 'hospitality' } },
  { url: 'https://www.lemonTreehotels.com', expected: { type: 'hospitality' } },

  // Government (6)
  { url: 'https://www.ocac.in/en', expected: { type: 'government', mustDetect: ['Drupal'] } },
  { url: 'https://www.india.gov.in', expected: { type: 'government' } },
  { url: 'https://www.mygov.in', expected: { type: 'government' } },
  { url: 'https://www.digitalindia.gov.in', expected: { type: 'government' } },
  { url: 'https://www.makeinindia.com', expected: { type: 'government' } },
  { url: 'https://www.startupindia.gov.in', expected: { type: 'government' } },

  // Education (6)
  { url: 'https://www.iitb.ac.in', expected: { type: 'education' } },
  { url: 'https://www.harvard.edu', expected: { type: 'education' } },
  { url: 'https://www.mit.edu', expected: { type: 'education' } },
  { url: 'https://www.coursera.org', expected: { type: 'education' } },
  { url: 'https://www.udemy.com', expected: { type: 'education' } },
  { url: 'https://www.khanacademy.org', expected: { type: 'education' } },

  // Healthcare (6)
  { url: 'https://www.apollohospitals.com', expected: { type: 'healthcare' } },
  { url: 'https://www.maxhealthcare.in', expected: { type: 'healthcare' } },
  { url: 'https://www.fortishealthcare.com', expected: { type: 'healthcare' } },
  { url: 'https://www.mayoclinic.org', expected: { type: 'healthcare' } },
  { url: 'https://www.webmd.com', expected: { type: 'healthcare' } },
  { url: 'https://www.practo.com', expected: { type: 'healthcare' } },

  // WordPress sites (8)
  { url: 'https://www.divergeix.com', expected: { mustDetect: ['WordPress'] } },
  { url: 'https://techcrunch.com', expected: { mustDetect: ['WordPress'] } },
  { url: 'https://www.whitehouse.gov', expected: { mustDetect: ['WordPress'] } },
  { url: 'https://www.bbc.com', expected: {} },
  { url: 'https://time.com', expected: { mustDetect: ['WordPress'] } },
  { url: 'https://www.sony.com', expected: {} },
  { url: 'https://www.bloomberg.com', expected: {} },
  { url: 'https://www.wired.com', expected: {} },

  // Webflow/Wix/Squarespace (6)
  { url: 'https://www.lattice.com', expected: { mustDetect: ['Webflow'] } },
  { url: 'https://www.hellosign.com', expected: {} },
  { url: 'https://www.jasper.ai', expected: {} },
  { url: 'https://www.ramp.com', expected: {} },
  { url: 'https://www.loom.com', expected: {} },
  { url: 'https://www.rippling.com', expected: {} },

  // React/Next.js (6)
  { url: 'https://www.airbnb.com', expected: { mustDetect: ['React'] } },
  { url: 'https://www.netflix.com', expected: {} },
  { url: 'https://www.uber.com', expected: {} },
  { url: 'https://www.tiktok.com', expected: {} },
  { url: 'https://www.twitch.tv', expected: {} },
  { url: 'https://www.reddit.com', expected: {} },

  // Nonprofit (4)
  { url: 'https://www.redcross.org', expected: { type: 'nonprofit' } },
  { url: 'https://www.unicef.org', expected: { type: 'nonprofit' } },
  { url: 'https://www.greenpeace.org', expected: { type: 'nonprofit' } },
  { url: 'https://www.wwf.org', expected: { type: 'nonprofit' } },

  // Real Estate (4)
  { url: 'https://www.zillow.com', expected: { type: 'realestate' } },
  { url: 'https://www.realtor.com', expected: { type: 'realestate' } },
  { url: 'https://www.99acres.com', expected: { type: 'realestate' } },
  { url: 'https://www.magicbricks.com', expected: { type: 'realestate' } },

  // Indian companies (11)
  { url: 'https://www.infosys.com', expected: { type: 'services' } },
  { url: 'https://www.tcs.com', expected: { type: 'services' } },
  { url: 'https://www.wipro.com', expected: { type: 'services' } },
  { url: 'https://www.zoho.com', expected: { type: 'saas' } },
  { url: 'https://www.freshworks.com', expected: { type: 'saas' } },
  { url: 'https://razorpay.com', expected: { type: 'saas', mustDetect: ['Razorpay'] } },
  { url: 'https://www.zomato.com', expected: {} },
  { url: 'https://www.swiggy.com', expected: {} },
  { url: 'https://www.flipkart.com', expected: { type: 'ecommerce' } },
  { url: 'https://www.nykaa.com', expected: { type: 'ecommerce' } },
  { url: 'https://www.bigbasket.com', expected: { type: 'ecommerce' } },
];

function fetchPage(urlStr, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeout);
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: timeout,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timer);
        fetchPage(res.headers.location, timeout).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { clearTimeout(timer); resolve(data); });
    });
    req.on('error', (e) => { clearTimeout(timer); reject(e); });
  });
}

function runScanner(html, url) {
  const hostname = new URL(url).hostname.toLowerCase();
  const domain = hostname.replace(/^www\./, '');
  const detections = [];
  const lowerHtml = html.toLowerCase();

  function ck(name, category, testFn, source) {
    try { if (testFn()) detections.push({ name, category, source }); } catch {}
  }

  // Simplified meta gen extraction
  const metaGenMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']*)["']/i);
  const metaGen = (metaGenMatch ? metaGenMatch[1] : '').toLowerCase();

  // CMS
  ck('WordPress', 'CMS', () => html.includes('wp-content') || html.includes('wp-includes') || metaGen.includes('wordpress'), 'WP');
  ck('Drupal', 'CMS', () => html.includes('Drupal') || html.includes('drupal.js') || html.includes('sites/default/files') || html.includes('ajaxPageState'), 'Drupal');
  ck('Joomla', 'CMS', () => html.includes('/media/jui/') || metaGen.includes('joomla'), 'Joomla');
  ck('Shopify', 'CMS', () => html.includes('Shopify.theme') || html.includes('myshopify.com') || (html.includes('cdn.shopify.com/s/files') && html.includes('Shopify.routes')), 'Shopify');
  ck('Webflow', 'CMS', () => html.includes('webflow.com') || metaGen.includes('webflow'), 'Webflow');
  ck('Wix', 'CMS', () => html.includes('static.wixstatic.com') || html.includes('parastorage.com'), 'Wix');
  ck('Squarespace', 'CMS', () => html.includes('squarespace.com') || metaGen.includes('squarespace'), 'Squarespace');
  ck('Ghost', 'CMS', () => metaGen.includes('ghost') || html.includes('ghost-portal-root'), 'Ghost');
  ck('HubSpot CMS', 'CMS', () => html.includes('hs-scripts.com') || html.includes('hubspot.net/hub'), 'HubSpot');

  // Frontend
  ck('React', 'Frontend', () => html.includes('react.production') || html.includes('react-dom') || html.includes('__NEXT_DATA__') || html.includes('data-reactroot'), 'React');
  ck('Next.js', 'Frontend', () => html.includes('__NEXT_DATA__') || html.includes('/_next/'), 'Next.js');
  ck('Vue.js', 'Frontend', () => html.includes('vue.js') || html.includes('vue.min.js') || html.includes('data-v-'), 'Vue');
  ck('Angular', 'Frontend', () => html.includes('ng-version') || html.includes('ng-app'), 'Angular');

  // Libraries
  ck('jQuery', 'Library', () => html.includes('jquery.min.js') || html.includes('jquery.js'), 'jQuery');
  ck('Bootstrap', 'Library', () => html.includes('bootstrap.min.css') || html.includes('bootstrap.min.js'), 'Bootstrap');

  // Analytics
  ck('GA4', 'Analytics', () => html.includes('gtag/js?id=G-'), 'GA4');
  ck('GTM', 'Analytics', () => html.includes('googletagmanager.com/gtm.js'), 'GTM');
  ck('Hotjar', 'Analytics', () => html.includes('static.hotjar.com'), 'Hotjar');
  ck('Segment', 'Analytics', () => html.includes('cdn.segment.com'), 'Segment');
  ck('Mixpanel', 'Analytics', () => html.includes('cdn.mxpnl.com'), 'Mixpanel');

  // Marketing
  ck('HubSpot', 'Marketing', () => html.includes('js.hs-scripts.com') || html.includes('hsforms.com'), 'HubSpot');
  ck('Intercom', 'Marketing', () => html.includes('widget.intercom.io') || html.includes('intercomSettings'), 'Intercom');
  ck('Mailchimp', 'Marketing', () => html.includes('mailchimp.com') || html.includes('chimpstatic.com'), 'Mailchimp');
  ck('Klaviyo', 'Marketing', () => html.includes('static.klaviyo.com'), 'Klaviyo');

  // Chat
  ck('Zendesk', 'Chat', () => html.includes('static.zdassets.com'), 'Zendesk');
  ck('Crisp', 'Chat', () => html.includes('client.crisp.chat'), 'Crisp');
  ck('Tawk.to', 'Chat', () => html.includes('embed.tawk.to'), 'Tawk');
  ck('Calendly', 'Chat', () => html.includes('calendly.com'), 'Calendly');

  // Payments
  ck('Stripe', 'Payments', () => html.includes('js.stripe.com'), 'Stripe');
  ck('Razorpay', 'Payments', () => html.includes('checkout.razorpay.com'), 'Razorpay');
  ck('PayPal', 'Payments', () => html.includes('paypalobjects.com'), 'PayPal');

  // Pixels
  ck('Meta Pixel', 'Pixel', () => html.includes('connect.facebook.net') || html.includes('fbevents.js'), 'Meta');
  ck('Google Ads', 'Pixel', () => html.includes('gtag/js?id=AW-') || html.includes('pagead/conversion'), 'GAds');
  ck('LinkedIn', 'Pixel', () => html.includes('px.ads.linkedin.com'), 'LinkedIn');

  // Infra
  ck('Cloudflare', 'Infra', () => html.includes('cdnjs.cloudflare.com'), 'CF');
  ck('Vercel', 'Infra', () => html.includes('vercel.app') || html.includes('vercel-analytics'), 'Vercel');
  ck('AWS', 'Infra', () => html.includes('.amazonaws.com') || html.includes('cloudfront.net'), 'AWS');

  // Type detection - score-based (same logic as injectable-scanner)
  const bodyText = html.replace(/<[^>]*>/g, ' ').toLowerCase();
  function score(keywords) { return keywords.filter(k => bodyText.includes(k)).length; }

  // Domain-based first
  let type = 'unknown';
  if (domain.endsWith('.gov') || domain.endsWith('.gov.in') || domain.endsWith('.nic.in') || domain.endsWith('.gov.uk')) type = 'government';
  else if (domain.endsWith('.edu') || domain.endsWith('.ac.in') || domain.endsWith('.ac.uk')) type = 'education';
  else if (domain.endsWith('.org') && (bodyText.includes('donate') || bodyText.includes('nonprofit') || bodyText.includes('charity'))) type = 'nonprofit';
  else {
    const hasEcomPlatform = html.includes('Shopify.theme') || html.includes('myshopify.com') || html.includes('woocommerce') || html.includes('cdn.bigcommerce') || html.includes('Magento_');
    if (hasEcomPlatform) type = 'ecommerce';
    else {
      const scores = {
        hospitality: score(['hotel', 'resort', 'check-in', 'book a room', 'accommodation', 'suites', 'rooms available', 'guest']),
        restaurant: score(['restaurant', 'menu', 'dine', 'cuisine', 'reservation', 'chef', 'food ordering']),
        education: score(['university', 'academic', 'semester', 'faculty', 'campus', 'students', 'admission', 'enroll']),
        government: score(['government', 'ministry', 'citizen', 'public service', 'department of', 'official website']),
        healthcare: score(['hospital', 'patient', 'doctor', 'appointment', 'medical', 'health care', 'clinical', 'treatment']),
        nonprofit: score(['donate', 'non-profit', 'nonprofit', 'volunteer', 'mission', 'charity', 'foundation']),
        realestate: score(['real estate', 'property for', 'sqft', 'bedroom', 'apartment', 'listing', 'for sale', 'for rent']),
        agency: score(['agency', 'our clients', 'our work', 'case study', 'portfolio', 'we help companies', 'our services']),
        saas: score(['free trial', 'sign up free', 'start free', 'pricing', 'per month', 'saas', 'platform', 'api']),
        services: score(['consulting', 'professional services', 'our expertise', 'solutions', 'implementation']),
        ecommerce: score(['add to cart', 'shop now', 'buy now', 'checkout', 'shopping cart', 'your order']),
      };
      let best = 'unknown', bestScore = 1;
      for (const [t, s] of Object.entries(scores)) { if (s > bestScore) { bestScore = s; best = t; } }
      type = best;
    }
  }

  return { domain, type, detections: detections.map(d => d.name), detectionCount: detections.length };
}

async function testSite(site) {
  const result = { url: site.url, status: 'OK', issues: [] };
  try {
    const html = await fetchPage(site.url);
    const scan = runScanner(html, site.url);
    result.type = scan.type;
    result.detections = scan.detections;
    result.detectionCount = scan.detectionCount;

    // Check type
    if (site.expected.type && scan.type !== site.expected.type) {
      result.issues.push(`TYPE: expected ${site.expected.type}, got ${scan.type}`);
    }
    // Check must-detect
    if (site.expected.mustDetect) {
      for (const tech of site.expected.mustDetect) {
        if (!scan.detections.some(d => d.includes(tech))) {
          result.issues.push(`MISSING: expected ${tech} not detected`);
        }
      }
    }
    // Check must-not-detect
    if (site.expected.mustNotDetect) {
      for (const tech of site.expected.mustNotDetect) {
        if (scan.detections.some(d => d.includes(tech))) {
          result.issues.push(`FALSE POSITIVE: ${tech} should NOT be detected`);
        }
      }
    }
    // Check for suspicious combos
    if (scan.detections.includes('Shopify') && scan.type === 'hospitality') {
      result.issues.push('SUSPICIOUS: Shopify on hospitality site');
    }

    if (result.issues.length > 0) result.status = 'ISSUES';
  } catch (e) {
    result.status = 'FETCH_ERROR';
    result.error = e.message;
  }
  return result;
}

async function main() {
  console.log(`\n========== PitchBox Scanner Test: ${SITES.length} websites ==========\n`);

  let passed = 0, failed = 0, errors = 0;
  const issues = [];

  // Process in batches of 5
  for (let i = 0; i < SITES.length; i += 5) {
    const batch = SITES.slice(i, i + 5);
    const results = await Promise.all(batch.map(testSite));

    for (const r of results) {
      const icon = r.status === 'OK' ? 'PASS' : r.status === 'ISSUES' ? 'FAIL' : 'ERR ';
      const typeStr = r.type ? `[${r.type}]` : '';
      const detectStr = r.detections ? `(${r.detectionCount} found: ${r.detections.slice(0, 5).join(', ')})` : '';
      console.log(`${icon} ${r.url.padEnd(45)} ${typeStr.padEnd(15)} ${detectStr}`);

      if (r.issues && r.issues.length > 0) {
        for (const issue of r.issues) {
          console.log(`     >> ${issue}`);
          issues.push({ url: r.url, issue });
        }
        failed++;
      } else if (r.status === 'FETCH_ERROR') {
        console.log(`     >> ERROR: ${r.error}`);
        errors++;
      } else {
        passed++;
      }
    }
  }

  console.log(`\n========== RESULTS ==========`);
  console.log(`Total: ${SITES.length} | Passed: ${passed} | Failed: ${failed} | Errors: ${errors}`);
  console.log(`Pass rate: ${((passed / (SITES.length - errors)) * 100).toFixed(1)}%`);

  if (issues.length > 0) {
    console.log(`\n========== ISSUES TO FIX ==========`);
    for (const i of issues) {
      console.log(`${i.url}: ${i.issue}`);
    }
  }
}

main().catch(console.error);
