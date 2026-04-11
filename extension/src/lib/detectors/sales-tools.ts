import { DetectionResult } from './cms';

export function detectSalesTools(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];
  const html = doc.documentElement.outerHTML;

  const signatures: Array<{
    name: string;
    checks: Array<{ test: () => boolean; source: string; confidence: 'strong' | 'inferred' | 'low' }>;
  }> = [
    {
      name: 'Zendesk',
      checks: [
        { test: () => html.includes('static.zdassets.com'), source: 'Zendesk assets', confidence: 'strong' },
        { test: () => html.includes('zendesk.com'), source: 'Zendesk domain', confidence: 'strong' },
        { test: () => !!doc.querySelector('#ze-snippet'), source: 'Zendesk widget snippet', confidence: 'strong' },
      ],
    },
    {
      name: 'Freshdesk',
      checks: [
        { test: () => html.includes('freshdesk.com'), source: 'Freshdesk domain', confidence: 'strong' },
        { test: () => html.includes('freshchat.com'), source: 'Freshchat domain', confidence: 'strong' },
        { test: () => html.includes('wchat.freshchat.com'), source: 'Freshchat widget', confidence: 'strong' },
      ],
    },
    {
      name: 'LiveChat',
      checks: [
        { test: () => html.includes('cdn.livechatinc.com'), source: 'LiveChat CDN', confidence: 'strong' },
        { test: () => html.includes('livechatinc.com'), source: 'LiveChat domain', confidence: 'strong' },
      ],
    },
    {
      name: 'Crisp',
      checks: [
        { test: () => html.includes('client.crisp.chat'), source: 'Crisp chat widget', confidence: 'strong' },
        { test: () => html.includes('CRISP_WEBSITE_ID'), source: 'Crisp website ID', confidence: 'strong' },
      ],
    },
    {
      name: 'Calendly',
      checks: [
        { test: () => html.includes('calendly.com'), source: 'Calendly embed', confidence: 'strong' },
        { test: () => html.includes('assets.calendly.com'), source: 'Calendly assets', confidence: 'strong' },
      ],
    },
    {
      name: 'Chili Piper',
      checks: [
        { test: () => html.includes('chilipiper.com'), source: 'Chili Piper domain', confidence: 'strong' },
        { test: () => html.includes('js.chilipiper.com'), source: 'Chili Piper script', confidence: 'strong' },
      ],
    },
    {
      name: 'Tidio',
      checks: [
        { test: () => html.includes('tidio.co'), source: 'Tidio domain', confidence: 'strong' },
        { test: () => html.includes('code.tidio.co'), source: 'Tidio script', confidence: 'strong' },
      ],
    },
    {
      name: 'Tawk.to',
      checks: [
        { test: () => html.includes('embed.tawk.to'), source: 'Tawk.to embed', confidence: 'strong' },
      ],
    },
    {
      name: 'Olark',
      checks: [
        { test: () => html.includes('static.olark.com'), source: 'Olark script', confidence: 'strong' },
      ],
    },
    {
      name: 'Gorgias',
      checks: [
        { test: () => html.includes('gorgias.chat'), source: 'Gorgias chat widget', confidence: 'strong' },
        { test: () => html.includes('config.gorgias.chat'), source: 'Gorgias config', confidence: 'strong' },
      ],
    },
  ];

  for (const sig of signatures) {
    for (const check of sig.checks) {
      try {
        if (check.test()) {
          results.push({ name: sig.name, category: 'Sales / Support', source: check.source, confidence: check.confidence });
          break;
        }
      } catch {}
    }
  }

  return results;
}
