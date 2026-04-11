import { DetectionResult } from './cms';

export function detectLeadCapture(doc: Document): DetectionResult[] {
  const results: DetectionResult[] = [];
  const html = doc.documentElement.outerHTML;

  // Forms
  const forms = doc.querySelectorAll('form');
  if (forms.length > 0) {
    const hasEmailInput = !!doc.querySelector('input[type="email"], input[name*="email"]');
    results.push({
      name: `Forms detected (${forms.length})`,
      category: 'Lead Capture',
      source: hasEmailInput ? 'Email input form found' : 'Form elements found',
      confidence: hasEmailInput ? 'strong' : 'inferred',
    });
  }

  // Newsletter/subscribe widgets
  const newsletterSelectors = [
    '[class*="newsletter"]', '[class*="subscribe"]', '[id*="newsletter"]',
    '[id*="subscribe"]', '[data-form-type="newsletter"]',
  ];
  for (const sel of newsletterSelectors) {
    if (doc.querySelector(sel)) {
      results.push({ name: 'Newsletter signup', category: 'Lead Capture', source: `Element matching ${sel}`, confidence: 'strong' });
      break;
    }
  }

  // Popup/modal detection
  const popupSelectors = [
    '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
    '[id*="popup"]', '[id*="modal"]',
  ];
  const hasPopup = popupSelectors.some(sel => !!doc.querySelector(sel));
  if (hasPopup) {
    results.push({ name: 'Popup/modal present', category: 'Lead Capture', source: 'Popup or modal DOM element', confidence: 'inferred' });
  }

  // Chatbot widgets (beyond specific tools)
  if (html.includes('chatbot') || html.includes('chat-widget') || html.includes('chat-bubble')) {
    results.push({ name: 'Chat widget detected', category: 'Lead Capture', source: 'Generic chat widget reference', confidence: 'inferred' });
  }

  // Booking/demo forms
  const bookingKeywords = ['book-a-demo', 'schedule-demo', 'request-demo', 'get-demo', 'book-demo', 'free-trial'];
  for (const kw of bookingKeywords) {
    if (html.toLowerCase().includes(kw)) {
      results.push({ name: 'Demo/booking form', category: 'Lead Capture', source: `Page contains "${kw}"`, confidence: 'strong' });
      break;
    }
  }

  // Typeform
  if (html.includes('typeform.com')) {
    results.push({ name: 'Typeform', category: 'Lead Capture', source: 'Typeform embed', confidence: 'strong' });
  }

  // OptinMonster
  if (html.includes('optinmonster.com') || html.includes('optin-monster')) {
    results.push({ name: 'OptinMonster', category: 'Lead Capture', source: 'OptinMonster script', confidence: 'strong' });
  }

  // Sumo
  if (html.includes('sumo.com') || html.includes('load.sumome.com')) {
    results.push({ name: 'Sumo', category: 'Lead Capture', source: 'Sumo script', confidence: 'strong' });
  }

  return results;
}
