// This file is injected into pages via chrome.scripting.executeScript({ files: ['page-scanner.js'] })
// It stores the result in a global variable that the sidepanel reads back

(function() {
  try {
    var url = window.location.href;
    var hostname = new URL(url).hostname.toLowerCase();
    var domain = hostname.replace(/^www\./, '');

    var skipDomains = [
      'google.com','youtube.com','facebook.com','twitter.com','x.com',
      'instagram.com','linkedin.com','github.com','stackoverflow.com',
      'reddit.com','wikipedia.org','amazon.com','ebay.com','netflix.com',
    ];
    var isCompany = !skipDomains.some(function(d) { return hostname === d || hostname.endsWith('.' + d); }) && hostname.includes('.');

    if (!isCompany) {
      window.__PITCHBOX_SCAN_RESULT__ = { url: url, domain: domain, timestamp: Date.now(), detections: [], company: { name: '', domain: domain, tagline: '', description: '', industry: '', type: 'unknown', hasCareerPage: false, hasBlog: false, hasPricingPage: false, hasFreeTrial: false, hasDemoPage: false, hasCaseStudies: false, hasApiDocs: false, hasIntegrationsPage: false, estimatedSize: '', socialLinks: {}, emails: [], phones: [], location: '', recentPosts: [], customerLogos: [], testimonials: [], teamMembers: [], schedulingLink: '', copyrightYear: '' }, isCompanyWebsite: false };
      return;
    }

    var doc = document;
    var rawHtml = document.documentElement.outerHTML;
    var html = rawHtml.length > 2000000 ? rawHtml.substring(0, 2000000) : rawHtml;
    var detections = [];

    var metaGenEl = doc.querySelector('meta[name="generator"]');
    var metaGen = (metaGenEl ? metaGenEl.getAttribute('content') || '' : '').toLowerCase();

    function ck(name, category, testFn, source) {
      try { if (testFn()) detections.push({ name: name, category: category, source: source, confidence: 'strong' }); } catch(e) {}
    }

    // ========== CMS ==========
    ck('WordPress', 'CMS / Site Builder', function() { return html.includes('wp-content') || html.includes('wp-includes') || html.includes('/wp-json/') || metaGen.includes('wordpress'); }, 'WordPress signatures');
    ck('Drupal', 'CMS / Site Builder', function() { return html.includes('Drupal') || html.includes('drupal.js') || html.includes('sites/default/files') || html.includes('ajaxPageState') || metaGen.includes('drupal'); }, 'Drupal signatures');
    ck('Joomla', 'CMS / Site Builder', function() { return html.includes('/media/jui/') || metaGen.includes('joomla'); }, 'Joomla signatures');
    ck('Shopify', 'CMS / Site Builder', function() { return html.includes('Shopify.theme') || html.includes('myshopify.com') || !!doc.querySelector('meta[name="shopify-checkout-api-token"]') || (!!doc.querySelector('link[href*="cdn.shopify.com/s/files"]') && html.includes('Shopify.routes')); }, 'Shopify platform');
    ck('Webflow', 'CMS / Site Builder', function() { return html.includes('webflow.com') || metaGen.includes('webflow'); }, 'Webflow signatures');
    ck('Wix', 'CMS / Site Builder', function() { return html.includes('static.wixstatic.com') || html.includes('parastorage.com') || metaGen.includes('wix'); }, 'Wix signatures');
    ck('Squarespace', 'CMS / Site Builder', function() { return html.includes('squarespace.com') || metaGen.includes('squarespace'); }, 'Squarespace signatures');
    ck('HubSpot CMS', 'CMS / Site Builder', function() { return html.includes('hs-scripts.com') || html.includes('hubspot.net/hub'); }, 'HubSpot signatures');
    ck('Ghost', 'CMS / Site Builder', function() { return metaGen.includes('ghost') || html.includes('ghost-portal-root'); }, 'Ghost signatures');
    ck('Magento', 'CMS / Site Builder', function() { return html.includes('mage/cookies') || html.includes('Magento_'); }, 'Magento signatures');

    // ========== FRONTEND ==========
    ck('React', 'Frontend Framework', function() { return html.includes('react.production') || html.includes('react-dom') || html.includes('_reactRoot') || !!doc.querySelector('[data-reactroot]') || !!doc.querySelector('[data-reactid]'); }, 'React signatures');
    ck('Next.js', 'Frontend Framework', function() { return html.includes('__NEXT_DATA__') || html.includes('/_next/'); }, 'Next.js signatures');
    ck('Vue.js', 'Frontend Framework', function() { return html.includes('vue.js') || html.includes('vue.min.js') || !!doc.querySelector('[data-v-]'); }, 'Vue.js signatures');
    ck('Nuxt', 'Frontend Framework', function() { return html.includes('__NUXT__') || html.includes('/_nuxt/'); }, 'Nuxt signatures');
    ck('Angular', 'Frontend Framework', function() { return html.includes('ng-version') || !!doc.querySelector('[ng-app]') || !!doc.querySelector('[_nghost-'); }, 'Angular signatures');
    ck('Svelte', 'Frontend Framework', function() { return !!doc.querySelector('[class*="svelte-"]'); }, 'Svelte signatures');
    ck('Gatsby', 'Frontend Framework', function() { return html.includes('___gatsby'); }, 'Gatsby signatures');
    ck('Alpine.js', 'Frontend Framework', function() { return !!doc.querySelector('[x-data]'); }, 'Alpine.js signatures');
    ck('HTMX', 'Frontend Framework', function() { return html.includes('htmx.org') || !!doc.querySelector('[hx-get]'); }, 'HTMX signatures');
    ck('Astro', 'Frontend Framework', function() { return html.includes('/_astro/') || metaGen.includes('astro'); }, 'Astro signatures');

    // ========== CSS ==========
    ck('Bootstrap', 'CSS Framework', function() { return !!doc.querySelector('link[href*="bootstrap.min.css"]') || !!doc.querySelector('script[src*="bootstrap.min.js"]') || !!doc.querySelector('link[href*="bootstrap.css"]'); }, 'Bootstrap CSS/JS');
    ck('Tailwind CSS', 'CSS Framework', function() { return html.includes('tailwindcss'); }, 'Tailwind CSS');

    // ========== LIBRARIES ==========
    ck('jQuery', 'Library', function() { return html.includes('jquery.min.js') || html.includes('jquery.js') || html.includes('jquery/'); }, 'jQuery script');
    ck('jQuery UI', 'Library', function() { return !!doc.querySelector('script[src*="jquery-ui"]') || !!doc.querySelector('link[href*="jquery-ui"]'); }, 'jQuery UI');
    ck('Font Awesome', 'Library', function() { return html.includes('font-awesome') || html.includes('fontawesome'); }, 'Font Awesome');
    ck('Google Fonts', 'Library', function() { return html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com'); }, 'Google Fonts');
    ck('GSAP', 'Library', function() { return html.includes('gsap') || html.includes('TweenMax'); }, 'GSAP animation');
    ck('AOS', 'Library', function() { return html.includes('aos.js') || html.includes('data-aos='); }, 'AOS scroll animation');
    ck('Lottie', 'Library', function() { return html.includes('lottie') || html.includes('bodymovin'); }, 'Lottie animation');
    ck('Socket.io', 'Library', function() { return html.includes('socket.io'); }, 'Socket.io');

    // ========== ANALYTICS ==========
    ck('Google Analytics (GA4)', 'Analytics', function() { return html.includes('gtag/js?id=G-') || html.includes("gtag('config', 'G-"); }, 'GA4 gtag');
    ck('Google Tag Manager', 'Analytics', function() { return html.includes('googletagmanager.com/gtm.js'); }, 'GTM script');
    ck('Segment', 'Analytics', function() { return html.includes('cdn.segment.com'); }, 'Segment CDN');
    ck('Mixpanel', 'Analytics', function() { return html.includes('cdn.mxpnl.com'); }, 'Mixpanel');
    ck('Hotjar', 'Analytics', function() { return html.includes('static.hotjar.com'); }, 'Hotjar script');
    ck('Amplitude', 'Analytics', function() { return html.includes('cdn.amplitude.com'); }, 'Amplitude CDN');
    ck('PostHog', 'Analytics', function() { return html.includes('posthog.com'); }, 'PostHog');
    ck('Plausible', 'Analytics', function() { return html.includes('plausible.io'); }, 'Plausible');
    ck('Heap', 'Analytics', function() { return html.includes('cdn.heapanalytics.com'); }, 'Heap');
    ck('FullStory', 'Analytics', function() { return html.includes('fullstory.com/s/fs.js'); }, 'FullStory');
    ck('Microsoft Clarity', 'Analytics', function() { return html.includes('clarity.ms'); }, 'Microsoft Clarity');
    ck('Adobe Analytics', 'Analytics', function() { return html.includes('adobedtm.com') || html.includes('omtrdc.net'); }, 'Adobe Analytics');
    ck('Matomo', 'Analytics', function() { return html.includes('matomo.js') || html.includes('piwik.js'); }, 'Matomo');

    // ========== AD PIXELS ==========
    ck('Meta Pixel', 'Ad Pixel', function() { return html.includes('connect.facebook.net') || html.includes('fbevents.js') || html.includes('fbq('); }, 'Meta Pixel');
    ck('Google Ads', 'Ad Pixel', function() { return html.includes('googleads.g.doubleclick.net') || html.includes('gtag/js?id=AW-'); }, 'Google Ads');
    ck('LinkedIn Insight', 'Ad Pixel', function() { return html.includes('px.ads.linkedin.com') || html.includes('snap.licdn.com'); }, 'LinkedIn Insight');
    ck('Twitter Pixel', 'Ad Pixel', function() { return html.includes('static.ads-twitter.com'); }, 'Twitter Pixel');
    ck('TikTok Pixel', 'Ad Pixel', function() { return html.includes('analytics.tiktok.com'); }, 'TikTok Pixel');
    ck('Pinterest Tag', 'Ad Pixel', function() { return html.includes('s.pinimg.com/ct'); }, 'Pinterest Tag');
    ck('Bing Ads', 'Ad Pixel', function() { return html.includes('bat.bing.com'); }, 'Bing Ads UET');
    ck('Criteo', 'Ad Pixel', function() { return html.includes('static.criteo.net'); }, 'Criteo');
    ck('Google AdSense', 'Ad Pixel', function() { return !!doc.querySelector('script[src*="pagead2.googlesyndication.com"]') || !!doc.querySelector('ins.adsbygoogle'); }, 'Google AdSense');

    // ========== MARKETING ==========
    ck('HubSpot', 'Marketing', function() { return html.includes('js.hs-scripts.com') || html.includes('hsforms.com'); }, 'HubSpot tracking');
    ck('Mailchimp', 'Marketing', function() { return html.includes('mailchimp.com') || html.includes('chimpstatic.com'); }, 'Mailchimp');
    ck('Klaviyo', 'Marketing', function() { return html.includes('static.klaviyo.com'); }, 'Klaviyo');
    ck('Intercom', 'Marketing', function() { return html.includes('widget.intercom.io') || html.includes('intercomSettings'); }, 'Intercom');
    ck('Drift', 'Marketing', function() { return html.includes('js.driftt.com'); }, 'Drift');
    ck('ActiveCampaign', 'Marketing', function() { return html.includes('trackcmp.net'); }, 'ActiveCampaign');
    ck('ConvertKit', 'Marketing', function() { return html.includes('convertkit.com'); }, 'ConvertKit');
    ck('Brevo', 'Marketing', function() { return html.includes('brevo.com') || html.includes('sendinblue.com'); }, 'Brevo');

    // ========== CHAT / SUPPORT ==========
    ck('Zendesk', 'Chat / Support', function() { return html.includes('static.zdassets.com'); }, 'Zendesk');
    ck('Freshdesk', 'Chat / Support', function() { return html.includes('freshdesk.com') || html.includes('freshchat.com'); }, 'Freshdesk');
    ck('LiveChat', 'Chat / Support', function() { return html.includes('cdn.livechatinc.com'); }, 'LiveChat');
    ck('Crisp', 'Chat / Support', function() { return html.includes('client.crisp.chat'); }, 'Crisp');
    ck('Tawk.to', 'Chat / Support', function() { return html.includes('embed.tawk.to'); }, 'Tawk.to');
    ck('Tidio', 'Chat / Support', function() { return html.includes('tidio.co'); }, 'Tidio');
    ck('Calendly', 'Chat / Support', function() { return html.includes('calendly.com'); }, 'Calendly');
    ck('HelpScout', 'Chat / Support', function() { return html.includes('helpscout.net'); }, 'HelpScout');

    // ========== PAYMENTS ==========
    ck('Stripe', 'Ecommerce / Payments', function() { return html.includes('js.stripe.com'); }, 'Stripe.js');
    ck('PayPal', 'Ecommerce / Payments', function() { return html.includes('paypalobjects.com'); }, 'PayPal SDK');
    ck('Razorpay', 'Ecommerce / Payments', function() { return html.includes('checkout.razorpay.com') || html.includes('api.razorpay.com'); }, 'Razorpay');

    // ========== INFRASTRUCTURE ==========
    ck('Cloudflare', 'Infrastructure', function() { return html.includes('cdnjs.cloudflare.com') || html.includes('challenges.cloudflare.com'); }, 'Cloudflare');
    ck('Vercel', 'Infrastructure', function() { return html.includes('vercel.app') || html.includes('vercel-analytics'); }, 'Vercel');
    ck('AWS', 'Infrastructure', function() { return html.includes('.amazonaws.com') || html.includes('cloudfront.net'); }, 'AWS');
    ck('Azure', 'Infrastructure', function() { return html.includes('.azurewebsites.net') || html.includes('azureedge.net'); }, 'Azure');
    ck('Firebase', 'Infrastructure', function() { return html.includes('firebaseapp.com') || html.includes('firebase.google.com'); }, 'Firebase');
    ck('Cloudinary', 'Infrastructure', function() { return html.includes('res.cloudinary.com'); }, 'Cloudinary');

    // ========== MONITORING ==========
    ck('Sentry', 'Monitoring', function() { return html.includes('sentry.io') || html.includes('browser.sentry-cdn.com'); }, 'Sentry');
    ck('Datadog', 'Monitoring', function() { return html.includes('datadoghq.com'); }, 'Datadog');
    ck('New Relic', 'Monitoring', function() { return html.includes('newrelic.com') || html.includes('NREUM'); }, 'New Relic');

    // ========== SECURITY ==========
    ck('reCAPTCHA', 'Security', function() { return html.includes('google.com/recaptcha') || !!doc.querySelector('.g-recaptcha'); }, 'reCAPTCHA');
    ck('hCaptcha', 'Security', function() { return html.includes('hcaptcha.com'); }, 'hCaptcha');

    // ========== COOKIE CONSENT ==========
    ck('OneTrust', 'Cookie Consent', function() { return html.includes('onetrust.com') || html.includes('cdn.cookielaw.org'); }, 'OneTrust');
    ck('Cookiebot', 'Cookie Consent', function() { return html.includes('cookiebot.com'); }, 'Cookiebot');

    // ========== PUSH / ENGAGEMENT ==========
    ck('OneSignal', 'Push Notifications', function() { return html.includes('onesignal.com'); }, 'OneSignal');
    ck('WebEngage', 'Push Notifications', function() { return html.includes('webengage.com'); }, 'WebEngage');
    ck('CleverTap', 'Push Notifications', function() { return html.includes('clevertap.com') || html.includes('wzrkt.com'); }, 'CleverTap');
    ck('MoEngage', 'Push Notifications', function() { return html.includes('moengage.com'); }, 'MoEngage');

    // ========== VIDEO ==========
    ck('YouTube Embed', 'Video', function() { return html.includes('youtube.com/embed'); }, 'YouTube embed');
    ck('Vimeo', 'Video', function() { return html.includes('player.vimeo.com'); }, 'Vimeo');
    ck('Wistia', 'Video', function() { return html.includes('wistia.com') || html.includes('fast.wistia.com'); }, 'Wistia');

    // ========== FORMS ==========
    ck('Typeform', 'Forms', function() { return html.includes('typeform.com'); }, 'Typeform');
    ck('Google Forms', 'Forms', function() { return html.includes('docs.google.com/forms'); }, 'Google Forms');
    ck('Gravity Forms', 'Forms', function() { return html.includes('gravityforms') || html.includes('gform_'); }, 'Gravity Forms');

    // ========== MAPS ==========
    ck('Google Maps', 'Maps', function() { return html.includes('maps.googleapis.com') || html.includes('maps.google.com'); }, 'Google Maps');
    ck('Mapbox', 'Maps', function() { return html.includes('mapbox.com'); }, 'Mapbox');

    // ========== VERIFICATION ==========
    ck('Google Search Console', 'Verification', function() { return !!doc.querySelector('meta[name="google-site-verification"]'); }, 'Google verification');

    // ========== BACKEND ==========
    ck('PHP', 'Backend', function() { var phpCount = 0; var allAnchors = doc.querySelectorAll('a'); for(var ai=0;ai<allAnchors.length;ai++){if(allAnchors[ai].href && typeof allAnchors[ai].href==='string' && allAnchors[ai].href.match(/\.php(\?|$|#)/))phpCount++;} return phpCount >= 2 && !html.includes('wp-content'); }, 'PHP pages');
    ck('ASP.NET', 'Backend', function() { return html.includes('__VIEWSTATE') || html.includes('__EVENTTARGET'); }, 'ASP.NET');
    ck('Django', 'Backend', function() { return html.includes('csrfmiddlewaretoken'); }, 'Django');

    // ========== LEAD CAPTURE ==========
    var forms = doc.querySelectorAll('form');
    if (forms.length > 0) detections.push({ name: 'Forms detected (' + forms.length + ')', category: 'Lead Capture', source: 'Form elements', confidence: 'strong' });

    // ========== SEO ==========
    var titleEl = doc.querySelector('title');
    var title = titleEl ? (titleEl.textContent || '').trim() : '';
    if (!title || title.length < 5) detections.push({ name: 'Missing/weak page title', category: 'SEO', source: 'Page title', confidence: 'strong' });
    var metaDescEl = doc.querySelector('meta[name="description"]');
    var metaDesc = metaDescEl ? metaDescEl.getAttribute('content') || '' : '';
    if (!metaDesc || metaDesc.length < 20) detections.push({ name: 'Missing/weak meta description', category: 'SEO', source: 'Meta description', confidence: 'strong' });
    if (!doc.querySelector('link[rel="canonical"]')) detections.push({ name: 'No canonical tag', category: 'SEO', source: 'Missing canonical', confidence: 'strong' });
    if (doc.querySelector('meta[property="og:title"]')) detections.push({ name: 'Open Graph tags present', category: 'SEO', source: 'OG tags', confidence: 'strong' });
    var jsonLd = doc.querySelectorAll('script[type="application/ld+json"]');
    if (jsonLd.length > 0) detections.push({ name: 'Structured data (' + jsonLd.length + ' schemas)', category: 'SEO', source: 'JSON-LD', confidence: 'strong' });
    if (doc.querySelector('meta[name="robots"]')) detections.push({ name: 'Robots meta tag', category: 'SEO', source: 'Robots directive', confidence: 'strong' });

    // ========== TRUST ==========
    var bodyText = (doc.body && doc.body.innerText ? doc.body.innerText : '').toLowerCase();
    if (bodyText.includes('soc 2') || bodyText.includes('soc2')) detections.push({ name: 'SOC 2 compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
    if (bodyText.includes('gdpr')) detections.push({ name: 'GDPR compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });

    // ========== CONTACT INFO ==========
    // Email extraction - strict filtering to avoid false positives
    var emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    var allEmails = (bodyText.match(emailRegex) || []);

    // Obfuscated emails
    var obfText = bodyText.replace(/\s*\[at\]\s*/gi,'@').replace(/\s*\(at\)\s*/gi,'@').replace(/\s*\[dot\]\s*/gi,'.').replace(/\s*\(dot\)\s*/gi,'.');
    var obfEmails = (obfText.match(emailRegex) || []);

    // Mailto links
    var mailtoEls = doc.querySelectorAll('a[href^="mailto:"]');
    var mailtoEmails = [];
    for(var mi=0;mi<mailtoEls.length;mi++){var mh=mailtoEls[mi].getAttribute('href');if(mh)mailtoEmails.push(mh.replace('mailto:','').split('?')[0].trim().toLowerCase());}

    var combined = allEmails.concat(obfEmails).concat(mailtoEmails);

    // Filter out false positives: image filenames, CSS values, placeholders
    var companyEmails = combined.filter(function(e) {
      var lower = e.toLowerCase();
      // Must have valid TLD (not .png, .jpg, .svg, .gif, .css, .js, .webp)
      if (lower.match(/\.(png|jpg|jpeg|gif|svg|webp|css|js|ico|woff|ttf|eot|mp4|mp3|pdf|zip)$/)) return false;
      // Must not be a placeholder
      if (lower.includes('example') || lower.includes('xyz.com') || lower.includes('test@') || lower.includes('user@') || lower.includes('email@')) return false;
      // Must not be a sprite/image reference
      if (lower.includes('sprite') || lower.includes('icon') || lower.includes('logo') || lower.includes('image')) return false;
      // Must have a real domain part (at least 2 chars before @, real TLD)
      var parts = lower.split('@');
      if (parts.length !== 2) return false;
      if (parts[0].length < 2) return false;
      if (!parts[1].includes('.')) return false;
      // TLD must be valid (2-6 chars)
      var tld = parts[1].split('.').pop();
      if (!tld || tld.length < 2 || tld.length > 6) return false;
      return true;
    }).filter(function(e,i,a){return a.indexOf(e)===i;}).slice(0,10);

    // Phone extraction - strict validation
    var phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    var rawPhones = (bodyText.match(phoneRegex)||[]);
    var phones = rawPhones.filter(function(p) {
      var d = p.replace(/\D/g, '');
      // Must be 7-13 digits (real phone numbers)
      if (d.length < 7 || d.length > 13) return false;
      // Must not be all same digit (like 0000000)
      if (/^(.)\1+$/.test(d)) return false;
      // Must start with valid prefix (0, +, or country code)
      if (!p.trim().match(/^[\+\(0-9]/)) return false;
      // Must contain at least one separator (space, dash, dot) or start with + to look like a phone
      if (!p.includes(' ') && !p.includes('-') && !p.includes('.') && !p.includes('(') && !p.startsWith('+') && d.length > 10) return false;
      return true;
    }).filter(function(p,i,a){return a.indexOf(p)===i;}).slice(0,5);

    // ========== SOCIAL LINKS ==========
    var socialLinks = {linkedin:'',twitter:'',facebook:'',instagram:'',youtube:'',github:''};
    var allAnchors = doc.querySelectorAll('a');
    for(var si=0;si<allAnchors.length;si++){
      var sh = allAnchors[si].href;
      if(!sh || typeof sh !== 'string') continue;
      var sl = sh.toLowerCase();
      if(sl.includes('linkedin.com/company')||sl.includes('linkedin.com/in/')) socialLinks.linkedin=sh;
      if((sl.includes('twitter.com/')||sl.includes('x.com/'))&&!sl.includes('intent/tweet')) socialLinks.twitter=sh;
      if(sl.includes('facebook.com/')&&!sl.includes('sharer')) socialLinks.facebook=sh;
      if(sl.includes('instagram.com/')) socialLinks.instagram=sh;
      if(sl.includes('youtube.com/')||sl.includes('youtu.be/')) socialLinks.youtube=sh;
      if(sl.includes('github.com/')&&!sl.includes('github.com/topics')) socialLinks.github=sh;
    }

    // ========== LINKS ==========
    var safeLinks = [];
    for(var li=0;li<allAnchors.length;li++){
      var lh=allAnchors[li].href;
      if(lh && typeof lh==='string') safeLinks.push(lh.toLowerCase());
    }

    // ========== COMPANY PROFILE ==========
    var ogSiteNameEl = doc.querySelector('meta[property="og:site_name"]');
    var ogSiteName = ogSiteNameEl ? ogSiteNameEl.getAttribute('content') || '' : '';
    var ogTitleEl = doc.querySelector('meta[property="og:title"]');
    var ogTitle = ogTitleEl ? ogTitleEl.getAttribute('content') || '' : '';
    var ogDescEl = doc.querySelector('meta[property="og:description"]');
    var ogDesc = ogDescEl ? ogDescEl.getAttribute('content') || '' : '';
    var companyName = ogSiteName || (title ? title.split(/\s*[-|]\s*/)[0].trim() : domain.split('.')[0]);
    companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

    // Type detection with weighted scoring
    var pageTitle = (title || '').toLowerCase();
    var metaDescLower = (metaDesc || '').toLowerCase();
    var h1Text = ''; var h1s = doc.querySelectorAll('h1'); for(var h1i=0;h1i<h1s.length;h1i++) h1Text += ' ' + (h1s[h1i].textContent||'').toLowerCase();
    var h2Text = ''; var h2s = doc.querySelectorAll('h2'); for(var h2i=0;h2i<h2s.length;h2i++) h2Text += ' ' + (h2s[h2i].textContent||'').toLowerCase();
    var navText = ''; var navAs = doc.querySelectorAll('nav a, header a'); for(var ni=0;ni<navAs.length;ni++) navText += ' ' + (navAs[ni].textContent||'').toLowerCase();

    var companyType = (function() {
      if (domain.endsWith('.gov') || domain.endsWith('.gov.in') || domain.endsWith('.nic.in')) return 'government';
      if (domain.endsWith('.edu') || domain.endsWith('.ac.in') || domain.endsWith('.ac.uk')) return 'education';
      if (domain.endsWith('.org') && (bodyText.includes('donate') || bodyText.includes('nonprofit'))) return 'nonprofit';

      var hasEcomPlatform = html.includes('Shopify.theme') || html.includes('myshopify.com') || html.includes('woocommerce') || html.includes('Magento_');
      if (hasEcomPlatform) return 'ecommerce';

      function ws(keywords) {
        var t = 0;
        for (var i = 0; i < keywords.length; i++) {
          var kw = keywords[i];
          if (pageTitle.includes(kw)) t += 5;
          if (metaDescLower.includes(kw)) t += 4;
          if (h1Text.includes(kw)) t += 3;
          if (h2Text.includes(kw)) t += 2;
          if (navText.includes(kw)) t += 2;
          if (bodyText.includes(kw)) t += 1;
        }
        return t;
      }

      var scores = {
        travel: ws(['flight','airline','travel','booking','hotel booking','holiday package','destination','itinerary','tourism']),
        hospitality: ws(['hotel','resort','check-in','book a room','accommodation','suites','rooms available','guest room','lodging']),
        restaurant: ws(['restaurant','dine','cuisine','chef','food order','our menu','table for']),
        education: ws(['university','academic','semester','faculty','campus','admission','enroll','undergraduate','postgraduate']),
        government: ws(['government','ministry','citizen','public service','department of','official portal','scheme','tender']),
        healthcare: ws(['hospital','patient','doctor','appointment','specialit','clinical','treatment','diagnosis']),
        nonprofit: ws(['donate','non-profit','nonprofit','volunteer','our mission','charity','humanitarian']),
        realestate: ws(['real estate','sqft','bhk','bedroom','apartment','for sale','for rent','plot','villa']),
        agency: ws(['digital agency','marketing agency','creative agency','our clients','our work','case stud','portfolio','we help','we build']),
        saas: ws(['free trial','sign up free','start free','get started','pricing','per month','per user','saas','dashboard','integrate','automate']),
        services: ws(['consulting','professional services','our expertise','it services','outsourc','managed services','advisory','transformation']),
        ecommerce: ws(['add to cart','shop now','buy now','checkout','shopping cart','your order','free shipping']),
      };

      var bestType = 'unknown';
      var bestScore = 3;
      for (var t in scores) {
        if (scores[t] > bestScore) { bestScore = scores[t]; bestType = t; }
      }
      return bestType;
    })();

    var copyrightMatch = bodyText.match(/©\s*(\d{4})/);

    var company = {
      name: companyName, domain: domain,
      tagline: ogTitle || '',
      description: metaDesc || ogDesc || '',
      industry: 'Unknown',
      type: companyType,
      hasCareerPage: safeLinks.some(function(l){return l.includes('/careers')||l.includes('/career')||l.includes('/jobs')||l.includes('/job-opening')||l.includes('/join-us')||l.includes('/join')||l.includes('/work-with-us')||l.includes('/openings')||l.includes('/vacancies')||l.includes('/hiring')||l.includes('/opportunities')||l.includes('/positions')||l.includes('greenhouse.io')||l.includes('lever.co')||l.includes('ashbyhq.com')||l.includes('workable.com')||l.includes('bamboohr.com')||l.includes('breezy.hr')||l.includes('recruitee.com')||l.includes('smartrecruiters.com')||l.includes('myworkdayjobs.com');}),
      hasBlog: safeLinks.some(function(l){return l.includes('/blog')||l.includes('/blogs')||l.includes('/articles')||l.includes('/news')||l.includes('/resources')||l.includes('/insights')||l.includes('/updates')||l.includes('/journal')||l.includes('/newsroom')||l.includes('/stories')||l.includes('/learn')||l.includes('/library')||l.includes('/guides')||l.includes('/whitepapers')||l.includes('/ebooks')||l.includes('/posts')||l.includes('/knowledge-base');}),
      hasPricingPage: safeLinks.some(function(l){return l.includes('/pricing')||l.includes('/plans')||l.includes('/packages')||l.includes('/price')||l.includes('/billing')||l.includes('/subscriptions')||l.includes('/compare-plans')||l.includes('/editions')||l.includes('/tiers');}),
      hasFreeTrial: bodyText.includes('free trial')||bodyText.includes('start free')||bodyText.includes('try free')||bodyText.includes('try for free')||bodyText.includes('free plan')||bodyText.includes('get started free')||bodyText.includes('sign up free')||bodyText.includes('no credit card')||bodyText.includes('14-day trial')||bodyText.includes('30-day trial')||bodyText.includes('free forever'),
      hasDemoPage: bodyText.includes('book a demo')||bodyText.includes('request demo')||bodyText.includes('schedule demo')||bodyText.includes('get a demo')||bodyText.includes('request a demo')||bodyText.includes('schedule a demo')||bodyText.includes('contact sales')||bodyText.includes('talk to sales')||bodyText.includes('book a call')||bodyText.includes('free consultation'),
      hasCaseStudies: safeLinks.some(function(l){return l.includes('/case-stud')||l.includes('/casestud')||l.includes('/customers')||l.includes('/customer-stor')||l.includes('/success-stor')||l.includes('/testimonial')||l.includes('/results')||l.includes('/portfolio')||l.includes('/our-work')||l.includes('/projects')||l.includes('/use-case')||l.includes('/usecases')||l.includes('/client-stor');}),
      hasApiDocs: safeLinks.some(function(l){return l.includes('/api-reference')||l.includes('/api-docs')||l.includes('/api-documentation')||l.includes('/developers')||l.includes('/developer')||l.includes('/docs')||l.includes('/documentation')||l.includes('/sdk')||l.includes('/swagger')||l.includes('/redoc')||l.includes('/openapi');}),
      hasIntegrationsPage: safeLinks.some(function(l){return l.includes('/integrations')||l.includes('/marketplace')||l.includes('/plugins')||l.includes('/extensions')||l.includes('/add-ons')||l.includes('/addons')||l.includes('/partners')||l.includes('/ecosystem')||l.includes('/connectors')||l.includes('/apps');}),
      estimatedSize: '',
      socialLinks: socialLinks,
      emails: companyEmails,
      phones: phones,
      location: '',
      recentPosts: [],
      customerLogos: [],
      testimonials: [],
      teamMembers: [],
      schedulingLink: '',
      copyrightYear: copyrightMatch ? copyrightMatch[1] : '',
    };

    window.__PITCHBOX_SCAN_RESULT__ = { url: url, domain: domain, timestamp: Date.now(), detections: detections, company: company, isCompanyWebsite: true };

  } catch (err) {
    var eUrl = window.location.href;
    var eDomain = new URL(eUrl).hostname.replace(/^www\./,'');
    window.__PITCHBOX_SCAN_RESULT__ = {
      url: eUrl, domain: eDomain, timestamp: Date.now(),
      detections: [{ name: 'Scan error: ' + (err.message||'unknown'), category: 'Error', source: 'Scanner', confidence: 'low' }],
      company: { name: eDomain, domain: eDomain, tagline: '', description: '', industry: 'Unknown', type: 'unknown', hasCareerPage:false,hasBlog:false,hasPricingPage:false,hasFreeTrial:false,hasDemoPage:false,hasCaseStudies:false,hasApiDocs:false,hasIntegrationsPage:false,estimatedSize:'',socialLinks:{},emails:[],phones:[],location:'',recentPosts:[],customerLogos:[],testimonials:[],teamMembers:[],schedulingLink:'',copyrightYear:'' },
      isCompanyWebsite: true
    };
  }
})();
