import { DetectionResult } from './cms';

export function detectEcommerce(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];
  const html = doc.documentElement.outerHTML;

  const signatures: Array<{
    name: string;
    checks: Array<{ test: () => boolean; source: string; confidence: 'strong' | 'inferred' | 'low' }>;
  }> = [
    {
      name: 'Stripe',
      checks: [
        { test: () => html.includes('js.stripe.com'), source: 'Stripe.js script', confidence: 'strong' },
        { test: () => html.includes('stripe.com/v3'), source: 'Stripe v3', confidence: 'strong' },
      ],
    },
    {
      name: 'Paddle',
      checks: [
        { test: () => html.includes('cdn.paddle.com'), source: 'Paddle CDN', confidence: 'strong' },
        { test: () => html.includes('paddle.com'), source: 'Paddle domain', confidence: 'inferred' },
      ],
    },
    {
      name: 'WooCommerce',
      checks: [
        { test: () => html.includes('woocommerce'), source: 'WooCommerce class/script', confidence: 'strong' },
        { test: () => html.includes('wc-cart'), source: 'WooCommerce cart', confidence: 'strong' },
      ],
    },
    {
      name: 'Recharge',
      checks: [
        { test: () => html.includes('rechargepayments.com'), source: 'Recharge domain', confidence: 'strong' },
        { test: () => html.includes('rechargecdn.com'), source: 'Recharge CDN', confidence: 'strong' },
      ],
    },
    {
      name: 'Yotpo',
      checks: [
        { test: () => html.includes('staticw2.yotpo.com'), source: 'Yotpo widget', confidence: 'strong' },
        { test: () => html.includes('yotpo.com'), source: 'Yotpo domain', confidence: 'inferred' },
      ],
    },
    {
      name: 'LemonSqueezy',
      checks: [
        { test: () => html.includes('lemonsqueezy.com'), source: 'LemonSqueezy domain', confidence: 'strong' },
        { test: () => html.includes('lmsqueezy'), source: 'LemonSqueezy ref', confidence: 'inferred' },
      ],
    },
    {
      name: 'Chargebee',
      checks: [
        { test: () => html.includes('chargebee.com'), source: 'Chargebee domain', confidence: 'strong' },
        { test: () => html.includes('js.chargebee.com'), source: 'Chargebee JS', confidence: 'strong' },
      ],
    },
  ];

  for (const sig of signatures) {
    for (const check of sig.checks) {
      try {
        if (check.test()) {
          results.push({ name: sig.name, category: 'Ecommerce / Payments', source: check.source, confidence: check.confidence });
          break;
        }
      } catch {}
    }
  }

  return results;
}
