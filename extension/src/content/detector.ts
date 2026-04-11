import { detectCMS, DetectionResult } from '../lib/detectors/cms';
import { detectAnalytics } from '../lib/detectors/analytics';
import { detectMarketing } from '../lib/detectors/marketing';
import { detectSalesTools } from '../lib/detectors/sales-tools';
import { detectEcommerce } from '../lib/detectors/ecommerce';
import { detectInfrastructure } from '../lib/detectors/infrastructure';
import { detectLeadCapture } from '../lib/detectors/lead-capture';
import { detectSEO } from '../lib/detectors/seo';
import { detectTrustCompliance } from '../lib/detectors/trust-compliance';
import { extractCompanyIdentity, extractBusinessContext, CompanyProfile } from '../lib/company/identity';

export interface ScanResult {
  url: string;
  domain: string;
  timestamp: number;
  detections: DetectionResult[];
  company: CompanyProfile;
  isCompanyWebsite: boolean;
}

function isCompanyWebsite(url: string): boolean {
  const skipDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'x.com',
    'instagram.com', 'linkedin.com', 'github.com', 'stackoverflow.com',
    'reddit.com', 'wikipedia.org', 'amazon.com', 'ebay.com', 'netflix.com',
    'localhost', '127.0.0.1', 'chrome://', 'chrome-extension://',
    'about:', 'new-tab', 'extensions',
  ];
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return !skipDomains.some(d => hostname.includes(d)) && hostname.includes('.');
  } catch {
    return false;
  }
}

function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function runDetection(doc: Document): DetectionResult[] {
  const allDetectors = [
    detectCMS, detectAnalytics, detectMarketing, detectSalesTools,
    detectEcommerce, detectInfrastructure, detectLeadCapture,
    detectSEO, detectTrustCompliance,
  ];

  const results: DetectionResult[] = [];
  for (const detector of allDetectors) {
    try {
      results.push(...detector(doc));
    } catch (e) {
      console.warn('[PitchBox] Detector error:', e);
    }
  }
  return results;
}

function scanPage(): ScanResult {
  const url = window.location.href;
  const domain = getDomain(url);
  const isCompany = isCompanyWebsite(url);

  const detections = isCompany ? runDetection(document) : [];
  const company = isCompany
    ? { ...extractCompanyIdentity(document, domain), ...extractBusinessContext(document) }
    : { name: '', domain, tagline: '', description: '', industry: '', type: 'unknown' as const, hasCareerPage: false, hasBlog: false, hasPricingPage: false, hasFreeTrial: false, hasDemoPage: false, hasCaseStudies: false, hasApiDocs: false, hasIntegrationsPage: false, estimatedSize: '' };

  return { url, domain, timestamp: Date.now(), detections, company, isCompanyWebsite: isCompany };
}

// Listen for scan requests from service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    const result = scanPage();
    sendResponse(result);
  }
  if (message.type === 'PING') {
    sendResponse({ alive: true });
  }
  return true;
});

// Auto-scan on load
const autoResult = scanPage();
if (autoResult.isCompanyWebsite && autoResult.detections.length > 0) {
  chrome.runtime.sendMessage({ type: 'SCAN_COMPLETE', data: autoResult });
}
