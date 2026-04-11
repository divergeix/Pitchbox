import { DetectionResult } from './cms';

export function detectSEO(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];

  // Meta title
  const title = doc.querySelector('title')?.textContent?.trim();
  if (!title || title.length < 5) {
    results.push({ name: 'Missing/weak page title', category: 'SEO', source: 'Page title element', confidence: 'strong' });
  }

  // Meta description
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
  if (!metaDesc || metaDesc.length < 20) {
    results.push({ name: 'Missing/weak meta description', category: 'SEO', source: 'Meta description tag', confidence: 'strong' });
  }

  // Canonical
  const canonical = doc.querySelector('link[rel="canonical"]');
  if (!canonical) {
    results.push({ name: 'No canonical tag', category: 'SEO', source: 'Missing link[rel=canonical]', confidence: 'strong' });
  }

  // Open Graph
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    results.push({ name: 'Open Graph tags present', category: 'SEO', source: 'og:title meta tag', confidence: 'strong' });
  }

  // Schema/JSON-LD
  const jsonLd = doc.querySelectorAll('script[type="application/ld+json"]');
  if (jsonLd.length > 0) {
    results.push({ name: `Structured data (${jsonLd.length} schemas)`, category: 'SEO', source: 'JSON-LD script tags', confidence: 'strong' });
  }

  // Robots
  const robotsMeta = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
  if (robotsMeta.includes('noindex')) {
    results.push({ name: 'Page set to noindex', category: 'SEO', source: 'Robots meta tag', confidence: 'strong' });
  }

  // Sitemap link
  const html = doc.documentElement.outerHTML;
  if (html.includes('sitemap.xml')) {
    results.push({ name: 'Sitemap referenced', category: 'SEO', source: 'sitemap.xml reference', confidence: 'inferred' });
  }

  // H1 check
  const h1s = doc.querySelectorAll('h1');
  if (h1s.length === 0) {
    results.push({ name: 'No H1 tag found', category: 'SEO', source: 'Missing H1 element', confidence: 'strong' });
  } else if (h1s.length > 1) {
    results.push({ name: `Multiple H1 tags (${h1s.length})`, category: 'SEO', source: 'Multiple H1 elements', confidence: 'inferred' });
  }

  // Hreflang (international)
  const hreflang = doc.querySelectorAll('link[hreflang]');
  if (hreflang.length > 0) {
    results.push({ name: `Hreflang tags (${hreflang.length} languages)`, category: 'SEO', source: 'Hreflang link tags', confidence: 'strong' });
  }

  return results;
}
