import { DetectionResult } from './cms';

export function detectMarketing(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];
  const html = doc.documentElement.outerHTML;

  const signatures: Array<{
    name: string;
    checks: Array<{ test: () => boolean; source: string; confidence: 'strong' | 'inferred' | 'low' }>;
  }> = [
    {
      name: 'HubSpot',
      checks: [
        { test: () => html.includes('js.hs-scripts.com'), source: 'HubSpot tracking script', confidence: 'strong' },
        { test: () => html.includes('hs-banner.com'), source: 'HubSpot banner', confidence: 'strong' },
        { test: () => html.includes('hsforms.com'), source: 'HubSpot forms', confidence: 'strong' },
        { test: () => html.includes('hbspt.forms.create'), source: 'HubSpot form create', confidence: 'strong' },
      ],
    },
    {
      name: 'Marketo',
      checks: [
        { test: () => html.includes('marketo.com'), source: 'Marketo domain', confidence: 'strong' },
        { test: () => html.includes('munchkin'), source: 'Marketo Munchkin', confidence: 'inferred' },
        { test: () => html.includes('mkto'), source: 'Marketo short ref', confidence: 'inferred' },
      ],
    },
    {
      name: 'Mailchimp',
      checks: [
        { test: () => html.includes('mailchimp.com'), source: 'Mailchimp domain', confidence: 'strong' },
        { test: () => html.includes('chimpstatic.com'), source: 'Mailchimp CDN', confidence: 'strong' },
        { test: () => html.includes('mc.us'), source: 'Mailchimp list URL', confidence: 'inferred' },
      ],
    },
    {
      name: 'Klaviyo',
      checks: [
        { test: () => html.includes('static.klaviyo.com'), source: 'Klaviyo script', confidence: 'strong' },
        { test: () => html.includes('klaviyo.com'), source: 'Klaviyo domain', confidence: 'strong' },
      ],
    },
    {
      name: 'Intercom',
      checks: [
        { test: () => html.includes('widget.intercom.io'), source: 'Intercom widget', confidence: 'strong' },
        { test: () => html.includes('intercomSettings'), source: 'Intercom settings object', confidence: 'strong' },
        { test: () => !!doc.querySelector('#intercom-container'), source: 'Intercom DOM container', confidence: 'strong' },
      ],
    },
    {
      name: 'Drift',
      checks: [
        { test: () => html.includes('js.driftt.com'), source: 'Drift script', confidence: 'strong' },
        { test: () => html.includes('drift.com'), source: 'Drift domain', confidence: 'inferred' },
      ],
    },
    {
      name: 'ActiveCampaign',
      checks: [
        { test: () => html.includes('trackcmp.net'), source: 'ActiveCampaign tracking', confidence: 'strong' },
        { test: () => html.includes('activecampaign.com'), source: 'ActiveCampaign domain', confidence: 'strong' },
      ],
    },
    {
      name: 'Pardot',
      checks: [
        { test: () => html.includes('pardot.com'), source: 'Pardot domain', confidence: 'strong' },
        { test: () => html.includes('pi.pardot.com'), source: 'Pardot tracking pixel', confidence: 'strong' },
      ],
    },
    {
      name: 'Customer.io',
      checks: [
        { test: () => html.includes('customerioforms.com'), source: 'Customer.io forms', confidence: 'strong' },
        { test: () => html.includes('track.customer.io'), source: 'Customer.io tracking', confidence: 'strong' },
      ],
    },
    {
      name: 'ConvertKit',
      checks: [
        { test: () => html.includes('convertkit.com'), source: 'ConvertKit domain', confidence: 'strong' },
        { test: () => html.includes('ck.page'), source: 'ConvertKit landing page', confidence: 'strong' },
      ],
    },
    {
      name: 'Brevo (Sendinblue)',
      checks: [
        { test: () => html.includes('sibforms.com'), source: 'Brevo forms', confidence: 'strong' },
        { test: () => html.includes('sendinblue.com'), source: 'Sendinblue domain', confidence: 'strong' },
      ],
    },
  ];

  for (const sig of signatures) {
    for (const check of sig.checks) {
      try {
        if (check.test()) {
          results.push({ name: sig.name, category: 'Marketing', source: check.source, confidence: check.confidence });
          break;
        }
      } catch {}
    }
  }

  return results;
}
