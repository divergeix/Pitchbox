import { DetectionResult } from './cms';

export function detectAnalytics(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];
  const html = doc.documentElement.outerHTML;

  const signatures: Array<{
    name: string;
    checks: Array<{ test: () => boolean; source: string; confidence: 'strong' | 'inferred' | 'low' }>;
  }> = [
    {
      name: 'Google Analytics (GA4)',
      checks: [
        { test: () => html.includes('gtag/js?id=G-'), source: 'GA4 gtag script', confidence: 'strong' },
        { test: () => html.includes('google-analytics.com/g/collect'), source: 'GA4 collect endpoint', confidence: 'strong' },
        { test: () => html.includes("gtag('config', 'G-"), source: 'GA4 config call', confidence: 'strong' },
      ],
    },
    {
      name: 'Google Analytics (Universal)',
      checks: [
        { test: () => html.includes('google-analytics.com/analytics.js'), source: 'Universal Analytics script', confidence: 'strong' },
        { test: () => html.includes('gtag/js?id=UA-'), source: 'UA tracking ID', confidence: 'strong' },
      ],
    },
    {
      name: 'Google Tag Manager',
      checks: [
        { test: () => html.includes('googletagmanager.com/gtm.js'), source: 'GTM script', confidence: 'strong' },
        { test: () => html.includes('GTM-'), source: 'GTM container ID', confidence: 'inferred' },
      ],
    },
    {
      name: 'Segment',
      checks: [
        { test: () => html.includes('cdn.segment.com'), source: 'Segment CDN', confidence: 'strong' },
        { test: () => html.includes('analytics.js') && html.includes('segment'), source: 'Segment analytics.js', confidence: 'inferred' },
      ],
    },
    {
      name: 'Mixpanel',
      checks: [
        { test: () => html.includes('cdn.mxpnl.com'), source: 'Mixpanel CDN', confidence: 'strong' },
        { test: () => html.includes('mixpanel.com/libs'), source: 'Mixpanel library', confidence: 'strong' },
        { test: () => html.includes('mixpanel.init'), source: 'Mixpanel init call', confidence: 'strong' },
      ],
    },
    {
      name: 'Hotjar',
      checks: [
        { test: () => html.includes('static.hotjar.com'), source: 'Hotjar script', confidence: 'strong' },
        { test: () => html.includes('hotjar.com'), source: 'Hotjar domain', confidence: 'inferred' },
      ],
    },
    {
      name: 'Amplitude',
      checks: [
        { test: () => html.includes('cdn.amplitude.com'), source: 'Amplitude CDN', confidence: 'strong' },
        { test: () => html.includes('amplitude.getInstance'), source: 'Amplitude init', confidence: 'strong' },
      ],
    },
    {
      name: 'Heap',
      checks: [
        { test: () => html.includes('cdn.heapanalytics.com'), source: 'Heap CDN', confidence: 'strong' },
        { test: () => html.includes('heap.appid'), source: 'Heap app ID', confidence: 'strong' },
      ],
    },
    {
      name: 'FullStory',
      checks: [
        { test: () => html.includes('fullstory.com/s/fs.js'), source: 'FullStory script', confidence: 'strong' },
        { test: () => html.includes("_fs_org"), source: 'FullStory org ID', confidence: 'strong' },
      ],
    },
    {
      name: 'Plausible',
      checks: [
        { test: () => html.includes('plausible.io'), source: 'Plausible script', confidence: 'strong' },
      ],
    },
    {
      name: 'PostHog',
      checks: [
        { test: () => html.includes('posthog.com'), source: 'PostHog domain', confidence: 'strong' },
        { test: () => html.includes('posthog.init'), source: 'PostHog init', confidence: 'strong' },
      ],
    },
  ];

  for (const sig of signatures) {
    for (const check of sig.checks) {
      try {
        if (check.test()) {
          results.push({ name: sig.name, category: 'Analytics', source: check.source, confidence: check.confidence });
          break;
        }
      } catch {}
    }
  }

  return results;
}
