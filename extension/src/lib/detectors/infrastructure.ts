import { DetectionResult } from './cms';

export function detectInfrastructure(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];
  const html = doc.documentElement.outerHTML;

  const signatures: Array<{
    name: string;
    checks: Array<{ test: () => boolean; source: string; confidence: 'strong' | 'inferred' | 'low' }>;
  }> = [
    {
      name: 'Cloudflare',
      checks: [
        { test: () => html.includes('cdnjs.cloudflare.com'), source: 'Cloudflare CDN', confidence: 'strong' },
        { test: () => html.includes('cf-ray'), source: 'Cloudflare ray header', confidence: 'inferred' },
        { test: () => html.includes('challenges.cloudflare.com'), source: 'Cloudflare challenge', confidence: 'strong' },
      ],
    },
    {
      name: 'Vercel',
      checks: [
        { test: () => html.includes('vercel.app'), source: 'Vercel domain', confidence: 'strong' },
        { test: () => html.includes('_vercel'), source: 'Vercel marker', confidence: 'inferred' },
        { test: () => html.includes('vercel-analytics'), source: 'Vercel analytics', confidence: 'strong' },
      ],
    },
    {
      name: 'Netlify',
      checks: [
        { test: () => html.includes('netlify.app'), source: 'Netlify domain', confidence: 'strong' },
        { test: () => html.includes('netlify-identity'), source: 'Netlify identity', confidence: 'strong' },
      ],
    },
    {
      name: 'AWS',
      checks: [
        { test: () => html.includes('.amazonaws.com'), source: 'AWS S3/CloudFront', confidence: 'strong' },
        { test: () => html.includes('cloudfront.net'), source: 'CloudFront CDN', confidence: 'strong' },
        { test: () => html.includes('.s3.'), source: 'S3 bucket URL', confidence: 'inferred' },
      ],
    },
    {
      name: 'Azure',
      checks: [
        { test: () => html.includes('.azurewebsites.net'), source: 'Azure App Service', confidence: 'strong' },
        { test: () => html.includes('.blob.core.windows.net'), source: 'Azure Blob Storage', confidence: 'strong' },
        { test: () => html.includes('azureedge.net'), source: 'Azure CDN', confidence: 'strong' },
      ],
    },
    {
      name: 'Google Cloud',
      checks: [
        { test: () => html.includes('.appspot.com'), source: 'App Engine', confidence: 'strong' },
        { test: () => html.includes('storage.googleapis.com'), source: 'GCS bucket', confidence: 'strong' },
        { test: () => html.includes('.run.app'), source: 'Cloud Run', confidence: 'strong' },
      ],
    },
    {
      name: 'Fastly',
      checks: [
        { test: () => html.includes('fastly.net'), source: 'Fastly CDN', confidence: 'strong' },
      ],
    },
    {
      name: 'Akamai',
      checks: [
        { test: () => html.includes('akamaized.net'), source: 'Akamai CDN', confidence: 'strong' },
        { test: () => html.includes('akamaihd.net'), source: 'Akamai HD CDN', confidence: 'strong' },
      ],
    },
  ];

  for (const sig of signatures) {
    for (const check of sig.checks) {
      try {
        if (check.test()) {
          results.push({ name: sig.name, category: 'Infrastructure', source: check.source, confidence: check.confidence });
          break;
        }
      } catch {}
    }
  }

  return results;
}
