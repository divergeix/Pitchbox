export interface DetectionResult {
  name: string;
  category: string;
  confidence: 'strong' | 'inferred' | 'low';
  source: string;
}

export function detectCMS(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];
  const html = doc.documentElement.outerHTML;
  const metaGenerator = doc.querySelector('meta[name="generator"]')?.getAttribute('content') || '';

  const signatures: Array<{
    name: string;
    tests: Array<{ check: () => boolean; source: string; confidence: 'strong' | 'inferred' | 'low' }>;
  }> = [
    {
      name: 'WordPress',
      tests: [
        { check: () => metaGenerator.toLowerCase().includes('wordpress'), source: 'meta generator tag', confidence: 'strong' },
        { check: () => !!doc.querySelector('link[href*="wp-content"]'), source: 'wp-content link tag', confidence: 'strong' },
        { check: () => html.includes('/wp-includes/'), source: 'wp-includes path', confidence: 'strong' },
        { check: () => html.includes('/wp-json/'), source: 'wp-json API endpoint', confidence: 'strong' },
        { check: () => !!doc.querySelector('script[src*="wp-content"]'), source: 'wp-content script', confidence: 'strong' },
      ],
    },
    {
      name: 'Shopify',
      tests: [
        { check: () => html.includes('cdn.shopify.com'), source: 'Shopify CDN', confidence: 'strong' },
        { check: () => html.includes('Shopify.theme'), source: 'Shopify.theme object', confidence: 'strong' },
        { check: () => !!doc.querySelector('meta[name="shopify-checkout-api-token"]'), source: 'Shopify checkout token', confidence: 'strong' },
        { check: () => html.includes('/cart.js'), source: 'Shopify cart.js', confidence: 'inferred' },
      ],
    },
    {
      name: 'Webflow',
      tests: [
        { check: () => html.includes('webflow.com'), source: 'Webflow domain reference', confidence: 'strong' },
        { check: () => metaGenerator.toLowerCase().includes('webflow'), source: 'meta generator tag', confidence: 'strong' },
        { check: () => !!doc.querySelector('.w-webflow-badge'), source: 'Webflow badge element', confidence: 'strong' },
        { check: () => html.includes('assets.website-files.com'), source: 'Webflow asset CDN', confidence: 'strong' },
      ],
    },
    {
      name: 'Wix',
      tests: [
        { check: () => html.includes('static.wixstatic.com'), source: 'Wix static CDN', confidence: 'strong' },
        { check: () => metaGenerator.toLowerCase().includes('wix'), source: 'meta generator tag', confidence: 'strong' },
        { check: () => html.includes('wix-code-sdk'), source: 'Wix code SDK', confidence: 'strong' },
        { check: () => html.includes('_wix_browser_sess'), source: 'Wix browser session', confidence: 'inferred' },
      ],
    },
    {
      name: 'Squarespace',
      tests: [
        { check: () => html.includes('squarespace.com'), source: 'Squarespace domain', confidence: 'strong' },
        { check: () => metaGenerator.includes('Squarespace'), source: 'meta generator tag', confidence: 'strong' },
        { check: () => html.includes('static1.squarespace.com'), source: 'Squarespace static CDN', confidence: 'strong' },
      ],
    },
    {
      name: 'Framer',
      tests: [
        { check: () => html.includes('framer.com'), source: 'Framer domain', confidence: 'strong' },
        { check: () => html.includes('framerusercontent.com'), source: 'Framer CDN', confidence: 'strong' },
        { check: () => !!doc.querySelector('[data-framer-component-type]'), source: 'Framer component attribute', confidence: 'strong' },
      ],
    },
    {
      name: 'HubSpot CMS',
      tests: [
        { check: () => html.includes('hs-scripts.com'), source: 'HubSpot scripts domain', confidence: 'inferred' },
        { check: () => html.includes('hubspot.net/hub'), source: 'HubSpot hub path', confidence: 'strong' },
        { check: () => !!doc.querySelector('meta[name="generator"][content*="HubSpot"]'), source: 'HubSpot generator tag', confidence: 'strong' },
      ],
    },
    {
      name: 'Ghost',
      tests: [
        { check: () => metaGenerator.includes('Ghost'), source: 'meta generator tag', confidence: 'strong' },
        { check: () => html.includes('ghost-portal-root'), source: 'Ghost portal root', confidence: 'strong' },
      ],
    },
    {
      name: 'Magento',
      tests: [
        { check: () => html.includes('mage/cookies'), source: 'Magento cookies script', confidence: 'strong' },
        { check: () => html.includes('Magento_'), source: 'Magento module path', confidence: 'strong' },
        { check: () => !!doc.querySelector('script[src*="mage"]'), source: 'Magento script tag', confidence: 'inferred' },
      ],
    },
    {
      name: 'BigCommerce',
      tests: [
        { check: () => html.includes('bigcommerce.com'), source: 'BigCommerce domain', confidence: 'strong' },
        { check: () => html.includes('cdn11.bigcommerce'), source: 'BigCommerce CDN', confidence: 'strong' },
      ],
    },
  ];

  for (const sig of signatures) {
    let bestMatch: { source: string; confidence: 'strong' | 'inferred' | 'low' } | null = null;
    for (const test of sig.tests) {
      try {
        if (test.check()) {
          if (!bestMatch || confidenceRank(test.confidence) > confidenceRank(bestMatch.confidence)) {
            bestMatch = { source: test.source, confidence: test.confidence };
          }
        }
      } catch {}
    }
    if (bestMatch) {
      results.push({ name: sig.name, category: 'CMS / Site Builder', ...bestMatch });
    }
  }

  return results;
}

function confidenceRank(c: 'strong' | 'inferred' | 'low'): number {
  return c === 'strong' ? 3 : c === 'inferred' ? 2 : 1;
}
