// This function is serialized and injected into the page via chrome.scripting.executeScript
// It CANNOT use imports, closures, or reference anything outside itself
// Uses plain JS syntax only - no TypeScript annotations inside
export function injectableScanner() {
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
    return { url: url, domain: domain, timestamp: Date.now(), detections: [], company: { name: '', domain: domain, tagline: '', description: '', industry: '', type: 'unknown', hasCareerPage: false, hasBlog: false, hasPricingPage: false, hasFreeTrial: false, hasDemoPage: false, hasCaseStudies: false, hasApiDocs: false, hasIntegrationsPage: false, estimatedSize: '' }, isCompanyWebsite: false };
  }

  var html = document.documentElement.outerHTML;
  var doc = document;
  var detections = [];

  var metaGenEl = doc.querySelector('meta[name="generator"]');
  var metaGen = (metaGenEl ? metaGenEl.getAttribute('content') || '' : '').toLowerCase();

  function ck(name, category, testFn, source) {
    try { if (testFn()) detections.push({ name: name, category: category, source: source, confidence: 'strong' }); } catch(e) {}
  }

  // ========== CMS / SITE BUILDERS (30) ==========
  ck('WordPress', 'CMS / Site Builder', function() { return html.includes('wp-content') || html.includes('wp-includes') || html.includes('/wp-json/') || metaGen.includes('wordpress'); }, 'WordPress signatures');
  ck('Drupal', 'CMS / Site Builder', function() { return html.includes('Drupal') || html.includes('drupal.js') || html.includes('drupal.org') || html.includes('sites/default/files') || html.includes('ajaxPageState') || metaGen.includes('drupal'); }, 'Drupal signatures');
  ck('Joomla', 'CMS / Site Builder', function() { return html.includes('/media/jui/') || html.includes('Joomla!') || metaGen.includes('joomla'); }, 'Joomla signatures');
  ck('Shopify', 'CMS / Site Builder', function() { return html.includes('Shopify.theme') || html.includes('myshopify.com') || !!doc.querySelector('meta[name="shopify-checkout-api-token"]') || (!!doc.querySelector('link[href*="cdn.shopify.com/s/files"]') && html.includes('Shopify.routes')); }, 'Shopify platform');
  ck('Webflow', 'CMS / Site Builder', function() { return html.includes('webflow.com') || html.includes('webflow.js') || metaGen.includes('webflow'); }, 'Webflow signatures');
  ck('Wix', 'CMS / Site Builder', function() { return html.includes('static.wixstatic.com') || html.includes('parastorage.com') || metaGen.includes('wix'); }, 'Wix signatures');
  ck('Squarespace', 'CMS / Site Builder', function() { return html.includes('squarespace.com') || metaGen.includes('squarespace'); }, 'Squarespace signatures');
  ck('Framer', 'CMS / Site Builder', function() { return html.includes('framer.com') || html.includes('framerusercontent.com'); }, 'Framer signatures');
  ck('HubSpot CMS', 'CMS / Site Builder', function() { return html.includes('hs-scripts.com') || html.includes('hubspot.net/hub'); }, 'HubSpot signatures');
  ck('Ghost', 'CMS / Site Builder', function() { return metaGen.includes('ghost') || html.includes('ghost-portal-root'); }, 'Ghost signatures');
  ck('Magento', 'CMS / Site Builder', function() { return html.includes('mage/cookies') || html.includes('Magento_'); }, 'Magento signatures');
  ck('BigCommerce', 'CMS / Site Builder', function() { return html.includes('bigcommerce.com') || html.includes('cdn.bigcommerce.com'); }, 'BigCommerce signatures');
  ck('PrestaShop', 'CMS / Site Builder', function() { return html.includes('prestashop') || metaGen.includes('prestashop'); }, 'PrestaShop signatures');
  ck('OpenCart', 'CMS / Site Builder', function() { return html.includes('opencart') || html.includes('/catalog/view/'); }, 'OpenCart signatures');
  ck('WooCommerce', 'CMS / Site Builder', function() { return html.includes('woocommerce') || html.includes('wc-cart'); }, 'WooCommerce signatures');
  ck('Craft CMS', 'CMS / Site Builder', function() { return metaGen.includes('craft cms') || html.includes('craftcms'); }, 'Craft CMS signatures');
  ck('TYPO3', 'CMS / Site Builder', function() { return html.includes('typo3') || html.includes('/fileadmin/') || metaGen.includes('typo3'); }, 'TYPO3 signatures');
  ck('Contentful', 'CMS / Site Builder', function() { return html.includes('contentful.com') || html.includes('cdn.contentful.com'); }, 'Contentful CDN');
  ck('Strapi', 'CMS / Site Builder', function() { return html.includes('strapi'); }, 'Strapi signatures');
  ck('Sanity', 'CMS / Site Builder', function() { return html.includes('sanity.io') || html.includes('cdn.sanity.io'); }, 'Sanity CDN');
  ck('Prismic', 'CMS / Site Builder', function() { return html.includes('prismic.io') || html.includes('cdn.prismic.io'); }, 'Prismic CDN');
  ck('Kentico', 'CMS / Site Builder', function() { return html.includes('kentico') || html.includes('kenticocloud'); }, 'Kentico signatures');
  ck('Sitecore', 'CMS / Site Builder', function() { return html.includes('sitecore') || html.includes('/sitecore/'); }, 'Sitecore signatures');
  ck('Adobe Experience Manager', 'CMS / Site Builder', function() { return html.includes('/etc.clientlibs/') || html.includes('cq-') || html.includes('/content/dam/'); }, 'AEM signatures');
  ck('Hugo', 'CMS / Site Builder', function() { return metaGen.includes('hugo'); }, 'Hugo generator');
  ck('Jekyll', 'CMS / Site Builder', function() { return metaGen.includes('jekyll'); }, 'Jekyll generator');
  ck('Statamic', 'CMS / Site Builder', function() { return metaGen.includes('statamic'); }, 'Statamic generator');
  ck('Grav', 'CMS / Site Builder', function() { return metaGen.includes('grav'); }, 'Grav generator');
  ck('Blogger', 'CMS / Site Builder', function() { return html.includes('blogger.com') || html.includes('blogspot.com') || metaGen.includes('blogger'); }, 'Blogger signatures');
  ck('Medium', 'CMS / Site Builder', function() { return html.includes('medium.com') || html.includes('cdn-images-1.medium.com'); }, 'Medium signatures');

  // ========== FRONTEND FRAMEWORKS (20) ==========
  ck('React', 'Frontend Framework', function() { return html.includes('react.production') || html.includes('react-dom') || html.includes('_reactRoot') || !!doc.querySelector('[data-reactroot]') || !!doc.querySelector('[data-reactid]'); }, 'React signatures');
  ck('Next.js', 'Frontend Framework', function() { return html.includes('__NEXT_DATA__') || html.includes('/_next/'); }, 'Next.js signatures');
  ck('Vue.js', 'Frontend Framework', function() { return html.includes('vue.js') || html.includes('vue.min.js') || html.includes('vue@') || !!doc.querySelector('[data-v-]') || html.includes('__vue__'); }, 'Vue.js signatures');
  ck('Nuxt', 'Frontend Framework', function() { return html.includes('__NUXT__') || html.includes('/_nuxt/'); }, 'Nuxt signatures');
  ck('Angular', 'Frontend Framework', function() { return html.includes('ng-version') || !!doc.querySelector('[ng-app]') || !!doc.querySelector('[_nghost-'); }, 'Angular signatures');
  ck('Svelte', 'Frontend Framework', function() { return !!doc.querySelector('[class*="svelte-"]') || html.includes('data-svelte-h'); }, 'Svelte signatures');
  ck('SvelteKit', 'Frontend Framework', function() { return html.includes('sveltekit') || html.includes('__sveltekit'); }, 'SvelteKit signatures');
  ck('Gatsby', 'Frontend Framework', function() { return html.includes('___gatsby') || html.includes('gatsby-'); }, 'Gatsby signatures');
  ck('Ember.js', 'Frontend Framework', function() { return html.includes('ember') && html.includes('ember-view'); }, 'Ember.js signatures');
  ck('Backbone.js', 'Frontend Framework', function() { return html.includes('backbone.min.js') || html.includes('backbone.js'); }, 'Backbone.js signatures');
  ck('Alpine.js', 'Frontend Framework', function() { return !!doc.querySelector('[x-data]') || !!doc.querySelector('[x-init]'); }, 'Alpine.js signatures');
  ck('Preact', 'Frontend Framework', function() { return html.includes('preact') || html.includes('preact.min.js'); }, 'Preact signatures');
  ck('Astro', 'Frontend Framework', function() { return html.includes('/_astro/') || metaGen.includes('astro'); }, 'Astro signatures');
  ck('Remix', 'Frontend Framework', function() { return html.includes('__remix') || html.includes('remix-run'); }, 'Remix signatures');
  ck('Qwik', 'Frontend Framework', function() { return !!doc.querySelector('[q\\:container]'); }, 'Qwik signatures');
  ck('Lit', 'Frontend Framework', function() { return html.includes('lit-element') || html.includes('lit-html'); }, 'Lit signatures');
  ck('Solid.js', 'Frontend Framework', function() { return html.includes('solid-js') || html.includes('_$HY'); }, 'Solid.js signatures');
  ck('Stimulus', 'Frontend Framework', function() { return !!doc.querySelector('[data-controller]'); }, 'Stimulus signatures');
  ck('HTMX', 'Frontend Framework', function() { return html.includes('htmx.org') || !!doc.querySelector('[hx-get]') || !!doc.querySelector('[hx-post]'); }, 'HTMX signatures');
  ck('Turbo', 'Frontend Framework', function() { return html.includes('turbo.hotwired.dev') || html.includes('data-turbo'); }, 'Turbo/Hotwire signatures');

  // ========== CSS FRAMEWORKS (18) ==========
  ck('Bootstrap', 'CSS Framework', function() { return !!doc.querySelector('link[href*="bootstrap.min.css"]') || !!doc.querySelector('script[src*="bootstrap.min.js"]') || !!doc.querySelector('link[href*="bootstrap.css"]'); }, 'Bootstrap CSS/JS');
  ck('Tailwind CSS', 'CSS Framework', function() { return html.includes('tailwindcss') || html.includes('tailwind.min.css'); }, 'Tailwind CSS');
  ck('Bulma', 'CSS Framework', function() { return html.includes('bulma.min.css') || html.includes('bulma.css'); }, 'Bulma CSS');
  ck('Foundation', 'CSS Framework', function() { return html.includes('foundation.min.css') || html.includes('foundation.min.js'); }, 'Foundation CSS');
  ck('Material UI', 'CSS Framework', function() { return html.includes('material-ui') || html.includes('@mui'); }, 'Material UI');
  ck('Chakra UI', 'CSS Framework', function() { return html.includes('chakra-ui'); }, 'Chakra UI');
  ck('Ant Design', 'CSS Framework', function() { return html.includes('antd') || html.includes('ant-design'); }, 'Ant Design');
  ck('Semantic UI', 'CSS Framework', function() { return html.includes('semantic-ui') || html.includes('semantic.min.css'); }, 'Semantic UI');
  ck('UIKit', 'CSS Framework', function() { return html.includes('uikit.min.css') || html.includes('uikit.min.js'); }, 'UIKit');
  ck('Vuetify', 'CSS Framework', function() { return html.includes('vuetify'); }, 'Vuetify');
  ck('Materialize', 'CSS Framework', function() { return html.includes('materialize.min.css') || html.includes('materialize.min.js'); }, 'Materialize CSS');
  ck('DaisyUI', 'CSS Framework', function() { return html.includes('daisyui'); }, 'DaisyUI');
  ck('Radix UI', 'CSS Framework', function() { return html.includes('radix-ui'); }, 'Radix UI');
  ck('shadcn/ui', 'CSS Framework', function() { return html.includes('shadcn'); }, 'shadcn/ui');
  ck('Primer', 'CSS Framework', function() { return html.includes('primer.css') || html.includes('@primer'); }, 'GitHub Primer');
  ck('Skeleton', 'CSS Framework', function() { return html.includes('skeleton.css'); }, 'Skeleton CSS');
  ck('Pure.css', 'CSS Framework', function() { return html.includes('pure-min.css') || html.includes('pure.min.css'); }, 'Pure.css');
  ck('Milligram', 'CSS Framework', function() { return html.includes('milligram.min.css'); }, 'Milligram');

  // ========== JS LIBRARIES (25) ==========
  ck('jQuery', 'Library', function() { return html.includes('jquery.min.js') || html.includes('jquery.js') || html.includes('jquery/'); }, 'jQuery script');
  ck('jQuery UI', 'Library', function() { return !!doc.querySelector('script[src*="jquery-ui"]') || !!doc.querySelector('script[src*="jquery.ui"]') || !!doc.querySelector('link[href*="jquery-ui"]'); }, 'jQuery UI script/css');
  ck('Lodash', 'Library', function() { return html.includes('lodash.min.js') || html.includes('lodash.js'); }, 'Lodash');
  ck('Moment.js', 'Library', function() { return html.includes('moment.min.js') || html.includes('moment.js'); }, 'Moment.js');
  ck('GSAP', 'Library', function() { return html.includes('gsap') || html.includes('TweenMax') || html.includes('greensock'); }, 'GSAP animation');
  ck('Three.js', 'Library', function() { return html.includes('three.min.js') || html.includes('three.js'); }, 'Three.js');
  ck('D3.js', 'Library', function() { return html.includes('d3.min.js') || html.includes('d3.js') || html.includes('d3.v'); }, 'D3.js');
  ck('Chart.js', 'Library', function() { return html.includes('chart.min.js') || html.includes('chart.js/'); }, 'Chart.js');
  ck('Highcharts', 'Library', function() { return html.includes('highcharts'); }, 'Highcharts');
  ck('ApexCharts', 'Library', function() { return html.includes('apexcharts'); }, 'ApexCharts');
  ck('Swiper', 'Library', function() { return html.includes('swiper') && (html.includes('swiper.min.js') || html.includes('swiper-bundle')); }, 'Swiper slider');
  ck('Slick Carousel', 'Library', function() { return html.includes('slick.min.js') || html.includes('slick-carousel'); }, 'Slick Carousel');
  ck('AOS', 'Library', function() { return html.includes('aos.js') || html.includes('aos.min.css') || html.includes('data-aos='); }, 'AOS scroll animation');
  ck('Lottie', 'Library', function() { return html.includes('lottie') || html.includes('lottie-web') || html.includes('bodymovin'); }, 'Lottie animation');
  ck('Anime.js', 'Library', function() { return html.includes('anime.min.js'); }, 'Anime.js');
  ck('Particles.js', 'Library', function() { return html.includes('particles.min.js') || html.includes('particles.js'); }, 'Particles.js');
  ck('Prism.js', 'Library', function() { return html.includes('prism.min.js') || html.includes('prism.js'); }, 'Prism.js syntax highlighting');
  ck('Highlight.js', 'Library', function() { return html.includes('highlight.min.js') || html.includes('hljs'); }, 'Highlight.js');
  ck('Fancybox', 'Library', function() { return html.includes('fancybox'); }, 'Fancybox lightbox');
  ck('PhotoSwipe', 'Library', function() { return html.includes('photoswipe'); }, 'PhotoSwipe');
  ck('Isotope', 'Library', function() { return html.includes('isotope.pkgd') || html.includes('isotope.min.js'); }, 'Isotope layout');
  ck('Masonry', 'Library', function() { return html.includes('masonry.pkgd') || html.includes('masonry.min.js'); }, 'Masonry layout');
  ck('Socket.io', 'Library', function() { return html.includes('socket.io'); }, 'Socket.io');
  ck('Axios', 'Library', function() { return html.includes('axios.min.js') || html.includes('axios/'); }, 'Axios HTTP');
  ck('Font Awesome', 'Library', function() { return html.includes('font-awesome') || html.includes('fontawesome') || html.includes('fa-solid') || html.includes('fa-brands'); }, 'Font Awesome');
  ck('Google Fonts', 'Library', function() { return html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com'); }, 'Google Fonts');

  // ========== ANALYTICS & TRACKING (30) ==========
  ck('Google Analytics (GA4)', 'Analytics', function() { return html.includes('gtag/js?id=G-') || html.includes("gtag('config', 'G-"); }, 'GA4 gtag');
  ck('Google Tag Manager', 'Analytics', function() { return html.includes('googletagmanager.com/gtm.js'); }, 'GTM script');
  ck('Segment', 'Analytics', function() { return html.includes('cdn.segment.com'); }, 'Segment CDN');
  ck('Mixpanel', 'Analytics', function() { return html.includes('cdn.mxpnl.com') || html.includes('mixpanel.init'); }, 'Mixpanel');
  ck('Hotjar', 'Analytics', function() { return html.includes('static.hotjar.com'); }, 'Hotjar script');
  ck('Amplitude', 'Analytics', function() { return html.includes('cdn.amplitude.com'); }, 'Amplitude CDN');
  ck('PostHog', 'Analytics', function() { return html.includes('posthog.com') || html.includes('posthog.init'); }, 'PostHog');
  ck('Plausible', 'Analytics', function() { return html.includes('plausible.io'); }, 'Plausible');
  ck('Heap', 'Analytics', function() { return html.includes('cdn.heapanalytics.com'); }, 'Heap');
  ck('FullStory', 'Analytics', function() { return html.includes('fullstory.com/s/fs.js'); }, 'FullStory');
  ck('Fathom', 'Analytics', function() { return html.includes('cdn.usefathom.com'); }, 'Fathom');
  ck('Matomo', 'Analytics', function() { return html.includes('matomo.js') || html.includes('piwik.js'); }, 'Matomo');
  ck('Clicky', 'Analytics', function() { return html.includes('static.getclicky.com'); }, 'Clicky');
  ck('Chartbeat', 'Analytics', function() { return html.includes('chartbeat.net') || html.includes('chartbeat.com'); }, 'Chartbeat');
  ck('Parse.ly', 'Analytics', function() { return html.includes('parsely.com') || html.includes('cdn.parsely.com'); }, 'Parse.ly');
  ck('Adobe Analytics', 'Analytics', function() { return html.includes('adobedtm.com') || html.includes('omtrdc.net') || (html.includes('s_code.js') && html.includes('omniture')); }, 'Adobe Analytics');
  ck('Microsoft Clarity', 'Analytics', function() { return html.includes('clarity.ms'); }, 'Microsoft Clarity');
  ck('Crazy Egg', 'Analytics', function() { return html.includes('crazyegg.com'); }, 'Crazy Egg');
  ck('Mouseflow', 'Analytics', function() { return html.includes('mouseflow.com'); }, 'Mouseflow');
  ck('LogRocket', 'Analytics', function() { return html.includes('logrocket.com') || html.includes('cdn.lr-ingest.com'); }, 'LogRocket');
  ck('Woopra', 'Analytics', function() { return html.includes('woopra.com'); }, 'Woopra');
  ck('Piwik Pro', 'Analytics', function() { return html.includes('piwikpro.com'); }, 'Piwik Pro');
  ck('Statcounter', 'Analytics', function() { return html.includes('statcounter.com'); }, 'Statcounter');
  ck('Lucky Orange', 'Analytics', function() { return html.includes('luckyorange.com'); }, 'Lucky Orange');
  ck('Smartlook', 'Analytics', function() { return html.includes('smartlook.com'); }, 'Smartlook');

  // ========== SOCIAL & AD PIXELS (18) ==========
  ck('Meta Pixel', 'Ad Pixel', function() { return html.includes('connect.facebook.net') || html.includes('fbevents.js') || html.includes('fbq('); }, 'Facebook/Meta Pixel');
  ck('Google Ads', 'Ad Pixel', function() { return html.includes('googleads.g.doubleclick.net') || html.includes('pagead/conversion') || html.includes('gtag/js?id=AW-'); }, 'Google Ads');
  ck('LinkedIn Insight', 'Ad Pixel', function() { return html.includes('px.ads.linkedin.com') || html.includes('snap.licdn.com'); }, 'LinkedIn Insight Tag');
  ck('Twitter Pixel', 'Ad Pixel', function() { return html.includes('static.ads-twitter.com') || html.includes('analytics.twitter.com'); }, 'Twitter/X Pixel');
  ck('TikTok Pixel', 'Ad Pixel', function() { return html.includes('analytics.tiktok.com'); }, 'TikTok Pixel');
  ck('Pinterest Tag', 'Ad Pixel', function() { return html.includes('s.pinimg.com/ct') || html.includes('pintrk('); }, 'Pinterest Tag');
  ck('Snapchat Pixel', 'Ad Pixel', function() { return html.includes('sc-static.net'); }, 'Snapchat Pixel');
  ck('Reddit Pixel', 'Ad Pixel', function() { return html.includes('alb.reddit.com'); }, 'Reddit Pixel');
  ck('Quora Pixel', 'Ad Pixel', function() { return html.includes('q.quora.com'); }, 'Quora Pixel');
  ck('Bing Ads', 'Ad Pixel', function() { return html.includes('bat.bing.com'); }, 'Bing Ads UET');
  ck('Criteo', 'Ad Pixel', function() { return html.includes('criteo.com') || html.includes('static.criteo.net'); }, 'Criteo');
  ck('Taboola', 'Ad Pixel', function() { return html.includes('tblcdn.com') || html.includes('taboola.com'); }, 'Taboola');
  ck('Outbrain', 'Ad Pixel', function() { return !!doc.querySelector('script[src*="outbrain.com"]'); }, 'Outbrain script');
  ck('AdRoll', 'Ad Pixel', function() { return html.includes('adroll.com') || html.includes('d.adroll.com'); }, 'AdRoll');
  ck('DoubleClick', 'Ad Pixel', function() { return !!doc.querySelector('script[src*="doubleclick.net"]') || !!doc.querySelector('iframe[src*="doubleclick.net"]'); }, 'DoubleClick tag');
  ck('Amazon Ads', 'Ad Pixel', function() { return html.includes('amazon-adsystem.com'); }, 'Amazon Ads');
  ck('Hubspot Ads', 'Ad Pixel', function() { return html.includes('js.hs-analytics.net'); }, 'HubSpot Analytics');
  ck('Google AdSense', 'Ad Pixel', function() { return !!doc.querySelector('script[src*="pagead2.googlesyndication.com"]') || !!doc.querySelector('ins.adsbygoogle'); }, 'Google AdSense');

  // ========== MARKETING & EMAIL (20) ==========
  ck('HubSpot', 'Marketing', function() { return html.includes('js.hs-scripts.com') || html.includes('hsforms.com') || html.includes('hbspt.forms.create'); }, 'HubSpot tracking');
  ck('Mailchimp', 'Marketing', function() { return html.includes('mailchimp.com') || html.includes('chimpstatic.com'); }, 'Mailchimp');
  ck('Klaviyo', 'Marketing', function() { return html.includes('static.klaviyo.com'); }, 'Klaviyo');
  ck('Intercom', 'Marketing', function() { return html.includes('widget.intercom.io') || html.includes('intercomSettings'); }, 'Intercom');
  ck('Drift', 'Marketing', function() { return html.includes('js.driftt.com'); }, 'Drift');
  ck('ActiveCampaign', 'Marketing', function() { return html.includes('trackcmp.net') || html.includes('activecampaign.com'); }, 'ActiveCampaign');
  ck('Marketo', 'Marketing', function() { return html.includes('marketo.com') || html.includes('munchkin'); }, 'Marketo');
  ck('Pardot', 'Marketing', function() { return html.includes('pardot.com') || html.includes('pi.pardot.com'); }, 'Pardot');
  ck('ConvertKit', 'Marketing', function() { return html.includes('convertkit.com') || html.includes('ck.page'); }, 'ConvertKit');
  ck('Brevo', 'Marketing', function() { return html.includes('brevo.com') || html.includes('sendinblue.com') || html.includes('sibforms.com'); }, 'Brevo/Sendinblue');
  ck('GetResponse', 'Marketing', function() { return html.includes('getresponse.com'); }, 'GetResponse');
  ck('MailerLite', 'Marketing', function() { return html.includes('mailerlite.com'); }, 'MailerLite');
  ck('AWeber', 'Marketing', function() { return html.includes('aweber.com'); }, 'AWeber');
  ck('Drip', 'Marketing', function() { return html.includes('drip.com') || html.includes('getdrip.com'); }, 'Drip');
  ck('Constant Contact', 'Marketing', function() { return html.includes('constantcontact.com'); }, 'Constant Contact');
  ck('Campaign Monitor', 'Marketing', function() { return html.includes('createsend.com') || html.includes('campaignmonitor.com'); }, 'Campaign Monitor');
  ck('Customer.io', 'Marketing', function() { return html.includes('customerioforms.com') || html.includes('track.customer.io'); }, 'Customer.io');
  ck('Autopilot', 'Marketing', function() { return html.includes('autopilothq.com'); }, 'Autopilot');
  ck('Iterable', 'Marketing', function() { return html.includes('iterable.com'); }, 'Iterable');
  ck('Omnisend', 'Marketing', function() { return html.includes('omnisend.com') || html.includes('omnisrc.com'); }, 'Omnisend');

  // ========== CHAT & SUPPORT (18) ==========
  ck('Zendesk', 'Chat / Support', function() { return html.includes('static.zdassets.com') || html.includes('zendesk.com'); }, 'Zendesk');
  ck('Freshdesk', 'Chat / Support', function() { return html.includes('freshdesk.com') || html.includes('freshchat.com'); }, 'Freshdesk');
  ck('LiveChat', 'Chat / Support', function() { return html.includes('cdn.livechatinc.com'); }, 'LiveChat');
  ck('Crisp', 'Chat / Support', function() { return html.includes('client.crisp.chat'); }, 'Crisp');
  ck('Tawk.to', 'Chat / Support', function() { return html.includes('embed.tawk.to'); }, 'Tawk.to');
  ck('Tidio', 'Chat / Support', function() { return html.includes('tidio.co') || html.includes('code.tidio.co'); }, 'Tidio');
  ck('Olark', 'Chat / Support', function() { return html.includes('static.olark.com'); }, 'Olark');
  ck('HelpScout', 'Chat / Support', function() { return html.includes('helpscout.net') || html.includes('beacon-v2'); }, 'HelpScout Beacon');
  ck('Gorgias', 'Chat / Support', function() { return html.includes('gorgias.chat') || html.includes('gorgias.io'); }, 'Gorgias');
  ck('Jivochat', 'Chat / Support', function() { return html.includes('jivosite.com') || html.includes('jivochat.com'); }, 'Jivochat');
  ck('Chatra', 'Chat / Support', function() { return html.includes('chatra.io'); }, 'Chatra');
  ck('Pure Chat', 'Chat / Support', function() { return html.includes('purechat.com'); }, 'Pure Chat');
  ck('Chatwoot', 'Chat / Support', function() { return html.includes('chatwoot.com'); }, 'Chatwoot');
  ck('Kommunicate', 'Chat / Support', function() { return html.includes('kommunicate.io'); }, 'Kommunicate');
  ck('Calendly', 'Chat / Support', function() { return html.includes('calendly.com') || html.includes('assets.calendly.com'); }, 'Calendly');
  ck('Chili Piper', 'Chat / Support', function() { return html.includes('chilipiper.com'); }, 'Chili Piper');
  ck('Acuity Scheduling', 'Chat / Support', function() { return html.includes('acuityscheduling.com'); }, 'Acuity Scheduling');
  ck('Cal.com', 'Chat / Support', function() { return html.includes('cal.com/embed') || html.includes('app.cal.com'); }, 'Cal.com');

  // ========== ECOMMERCE & PAYMENTS (20) ==========
  ck('Stripe', 'Ecommerce / Payments', function() { return html.includes('js.stripe.com'); }, 'Stripe.js');
  ck('PayPal', 'Ecommerce / Payments', function() { return html.includes('paypalobjects.com') || html.includes('paypal.com/sdk'); }, 'PayPal SDK');
  ck('Razorpay', 'Ecommerce / Payments', function() { return html.includes('razorpay.com'); }, 'Razorpay');
  ck('Square', 'Ecommerce / Payments', function() { return html.includes('squarecdn.com') || html.includes('square.link'); }, 'Square');
  ck('Paddle', 'Ecommerce / Payments', function() { return html.includes('cdn.paddle.com'); }, 'Paddle');
  ck('Chargebee', 'Ecommerce / Payments', function() { return html.includes('chargebee.com') || html.includes('js.chargebee.com'); }, 'Chargebee');
  ck('Braintree', 'Ecommerce / Payments', function() { return html.includes('braintreegateway.com'); }, 'Braintree');
  ck('Klarna', 'Ecommerce / Payments', function() { return html.includes('klarna.com') || html.includes('cdn.klarna.com'); }, 'Klarna');
  ck('Afterpay', 'Ecommerce / Payments', function() { return html.includes('afterpay.com'); }, 'Afterpay');
  ck('Affirm', 'Ecommerce / Payments', function() { return html.includes('affirm.com'); }, 'Affirm');
  ck('Sezzle', 'Ecommerce / Payments', function() { return html.includes('sezzle.com'); }, 'Sezzle');
  ck('Gumroad', 'Ecommerce / Payments', function() { return html.includes('gumroad.com'); }, 'Gumroad');
  ck('LemonSqueezy', 'Ecommerce / Payments', function() { return html.includes('lemonsqueezy.com'); }, 'LemonSqueezy');
  ck('FastSpring', 'Ecommerce / Payments', function() { return html.includes('fastspring.com'); }, 'FastSpring');
  ck('WooCommerce Payments', 'Ecommerce / Payments', function() { return html.includes('woocommerce-payments'); }, 'WooCommerce Payments');
  ck('Recharge', 'Ecommerce / Payments', function() { return html.includes('rechargepayments.com'); }, 'Recharge');
  ck('Yotpo', 'Ecommerce / Payments', function() { return html.includes('staticw2.yotpo.com') || html.includes('yotpo.com'); }, 'Yotpo reviews');
  ck('Stamped.io', 'Ecommerce / Payments', function() { return html.includes('stamped.io'); }, 'Stamped.io reviews');
  ck('Judge.me', 'Ecommerce / Payments', function() { return html.includes('judge.me'); }, 'Judge.me reviews');
  ck('Trustpilot', 'Ecommerce / Payments', function() { return html.includes('trustpilot.com') || html.includes('tp-widget'); }, 'Trustpilot');

  // ========== A/B TESTING & OPTIMIZATION (12) ==========
  ck('Optimizely', 'A/B Testing', function() { return html.includes('cdn.optimizely.com'); }, 'Optimizely');
  ck('VWO', 'A/B Testing', function() { return html.includes('dev.visualwebsiteoptimizer.com') || html.includes('vwo.com'); }, 'VWO');
  ck('Google Optimize', 'A/B Testing', function() { return html.includes('google-optimize') || html.includes('googleoptimize.com'); }, 'Google Optimize');
  ck('AB Tasty', 'A/B Testing', function() { return html.includes('abtasty.com'); }, 'AB Tasty');
  ck('Convert', 'A/B Testing', function() { return html.includes('convertcdn.com'); }, 'Convert.com');
  ck('LaunchDarkly', 'A/B Testing', function() { return html.includes('launchdarkly.com'); }, 'LaunchDarkly');
  ck('Kameleoon', 'A/B Testing', function() { return html.includes('kameleoon.com'); }, 'Kameleoon');
  ck('Unbounce', 'A/B Testing', function() { return html.includes('unbounce.com'); }, 'Unbounce');
  ck('Leadpages', 'A/B Testing', function() { return html.includes('leadpages.net'); }, 'Leadpages');
  ck('Instapage', 'A/B Testing', function() { return html.includes('instapage.com'); }, 'Instapage');
  ck('Dynamic Yield', 'A/B Testing', function() { return html.includes('dynamicyield.com'); }, 'Dynamic Yield');
  ck('Statsig', 'A/B Testing', function() { return html.includes('statsig.com'); }, 'Statsig');

  // ========== INFRASTRUCTURE (20) ==========
  ck('Cloudflare', 'Infrastructure', function() { return html.includes('cdnjs.cloudflare.com') || html.includes('challenges.cloudflare.com'); }, 'Cloudflare');
  ck('Vercel', 'Infrastructure', function() { return html.includes('vercel.app') || html.includes('vercel-analytics') || html.includes('_vercel'); }, 'Vercel');
  ck('Netlify', 'Infrastructure', function() { return html.includes('netlify.app') || html.includes('netlify-identity'); }, 'Netlify');
  ck('AWS', 'Infrastructure', function() { return html.includes('.amazonaws.com') || html.includes('cloudfront.net'); }, 'AWS/CloudFront');
  ck('Azure', 'Infrastructure', function() { return html.includes('.azurewebsites.net') || html.includes('azureedge.net') || html.includes('.blob.core.windows.net'); }, 'Azure');
  ck('Google Cloud', 'Infrastructure', function() { return html.includes('.appspot.com') || html.includes('.run.app') || html.includes('storage.googleapis.com'); }, 'Google Cloud');
  ck('Heroku', 'Infrastructure', function() { return html.includes('herokuapp.com'); }, 'Heroku');
  ck('Fastly', 'Infrastructure', function() { return html.includes('fastly.net'); }, 'Fastly CDN');
  ck('Akamai', 'Infrastructure', function() { return html.includes('akamaized.net') || html.includes('akamaihd.net'); }, 'Akamai CDN');
  ck('Bunny CDN', 'Infrastructure', function() { return html.includes('bunnycdn.com') || html.includes('b-cdn.net'); }, 'Bunny CDN');
  ck('KeyCDN', 'Infrastructure', function() { return html.includes('keycdn.com') || html.includes('kxcdn.com'); }, 'KeyCDN');
  ck('StackPath', 'Infrastructure', function() { return html.includes('stackpathdns.com'); }, 'StackPath');
  ck('DigitalOcean', 'Infrastructure', function() { return html.includes('digitaloceanspaces.com'); }, 'DigitalOcean Spaces');
  ck('Railway', 'Infrastructure', function() { return html.includes('railway.app'); }, 'Railway');
  ck('Render', 'Infrastructure', function() { return html.includes('onrender.com'); }, 'Render');
  ck('Firebase', 'Infrastructure', function() { return html.includes('firebaseapp.com') || html.includes('firebase.google.com') || html.includes('firebasestorage.googleapis.com'); }, 'Firebase');
  ck('Supabase', 'Infrastructure', function() { return html.includes('supabase.co') || html.includes('supabase.com'); }, 'Supabase');
  ck('Imgix', 'Infrastructure', function() { return html.includes('imgix.net'); }, 'Imgix image CDN');
  ck('Cloudinary', 'Infrastructure', function() { return html.includes('cloudinary.com') || html.includes('res.cloudinary.com'); }, 'Cloudinary');
  ck('Uploadcare', 'Infrastructure', function() { return html.includes('uploadcare.com') || html.includes('ucarecdn.com'); }, 'Uploadcare');

  // ========== MONITORING & ERROR TRACKING (10) ==========
  ck('Sentry', 'Monitoring', function() { return html.includes('sentry.io') || html.includes('browser.sentry-cdn.com'); }, 'Sentry');
  ck('Datadog', 'Monitoring', function() { return html.includes('datadoghq.com') || html.includes('dd_rum'); }, 'Datadog RUM');
  ck('New Relic', 'Monitoring', function() { return html.includes('newrelic.com') || html.includes('nr-data.net') || html.includes('NREUM'); }, 'New Relic');
  ck('BugSnag', 'Monitoring', function() { return html.includes('bugsnag.com') || html.includes('d2wy8f7a9ursnm.cloudfront.net'); }, 'BugSnag');
  ck('Rollbar', 'Monitoring', function() { return html.includes('rollbar.com') || html.includes('cdn.rollbar.com'); }, 'Rollbar');
  ck('Raygun', 'Monitoring', function() { return html.includes('raygun.com') || html.includes('cdn.raygun.io'); }, 'Raygun');
  ck('Airbrake', 'Monitoring', function() { return html.includes('airbrake.io'); }, 'Airbrake');
  ck('Dynatrace', 'Monitoring', function() { return html.includes('dynatrace.com') || html.includes('js-agent.newrelic'); }, 'Dynatrace');
  ck('AppDynamics', 'Monitoring', function() { return html.includes('appdynamics.com'); }, 'AppDynamics');
  ck('Elastic APM', 'Monitoring', function() { return html.includes('elastic-apm'); }, 'Elastic APM');

  // ========== SECURITY & CAPTCHA (10) ==========
  ck('reCAPTCHA', 'Security', function() { return html.includes('google.com/recaptcha') || html.includes('g-recaptcha') || !!doc.querySelector('.g-recaptcha'); }, 'Google reCAPTCHA');
  ck('hCaptcha', 'Security', function() { return html.includes('hcaptcha.com') || !!doc.querySelector('.h-captcha'); }, 'hCaptcha');
  ck('Cloudflare Turnstile', 'Security', function() { return html.includes('challenges.cloudflare.com/turnstile') || !!doc.querySelector('.cf-turnstile'); }, 'Cloudflare Turnstile');
  ck('Imperva/Incapsula', 'Security', function() { return html.includes('_Incapsula_Resource') || html.includes('imperva.com'); }, 'Imperva WAF');
  ck('Sucuri', 'Security', function() { return html.includes('sucuri.net'); }, 'Sucuri security');
  ck('Wordfence', 'Security', function() { return html.includes('wordfence') || html.includes('wf-'); }, 'Wordfence');

  // ========== COOKIE CONSENT & PRIVACY (12) ==========
  ck('OneTrust', 'Cookie Consent', function() { return html.includes('onetrust.com') || html.includes('cdn.cookielaw.org'); }, 'OneTrust');
  ck('Cookiebot', 'Cookie Consent', function() { return html.includes('cookiebot.com') || html.includes('consent.cookiebot.com'); }, 'Cookiebot');
  ck('TrustArc', 'Cookie Consent', function() { return html.includes('trustarc.com'); }, 'TrustArc');
  ck('Osano', 'Cookie Consent', function() { return html.includes('osano.com'); }, 'Osano');
  ck('CookieYes', 'Cookie Consent', function() { return html.includes('cookieyes.com'); }, 'CookieYes');
  ck('iubenda', 'Cookie Consent', function() { return html.includes('iubenda.com'); }, 'iubenda');
  ck('Quantcast Choice', 'Cookie Consent', function() { return html.includes('quantcast.com'); }, 'Quantcast Choice');
  ck('Ketch', 'Cookie Consent', function() { return html.includes('ketch.com'); }, 'Ketch');
  ck('Termly', 'Cookie Consent', function() { return html.includes('termly.io'); }, 'Termly');
  ck('Complianz', 'Cookie Consent', function() { return html.includes('complianz'); }, 'Complianz');
  ck('GDPR Cookie Compliance', 'Cookie Consent', function() { return !!doc.querySelector('[class*="gdpr"]') || !!doc.querySelector('[id*="gdpr"]'); }, 'GDPR banner');
  ck('Generic Cookie Banner', 'Cookie Consent', function() { return !!doc.querySelector('[class*="cookie-banner"],[class*="cookie-consent"],[id*="cookie-notice"]'); }, 'Cookie consent banner');

  // ========== ACCESSIBILITY (6) ==========
  ck('AccessiBe', 'Accessibility', function() { return html.includes('accessibe.com') || html.includes('cdn.accessibe.com'); }, 'AccessiBe');
  ck('UserWay', 'Accessibility', function() { return html.includes('userway.org') || html.includes('cdn.userway.org'); }, 'UserWay');
  ck('AudioEye', 'Accessibility', function() { return html.includes('audioeye.com'); }, 'AudioEye');
  ck('EqualWeb', 'Accessibility', function() { return html.includes('equalweb.com'); }, 'EqualWeb');
  ck('Recite Me', 'Accessibility', function() { return html.includes('reciteme.com'); }, 'Recite Me');
  ck('Max Access', 'Accessibility', function() { return html.includes('maxaccess.io'); }, 'Max Access');

  // ========== PUSH NOTIFICATIONS (6) ==========
  ck('OneSignal', 'Push Notifications', function() { return html.includes('onesignal.com') || html.includes('cdn.onesignal.com'); }, 'OneSignal');
  ck('PushEngage', 'Push Notifications', function() { return html.includes('pushengage.com'); }, 'PushEngage');
  ck('Pushwoosh', 'Push Notifications', function() { return html.includes('pushwoosh.com'); }, 'Pushwoosh');
  ck('WebEngage', 'Push Notifications', function() { return html.includes('webengage.com'); }, 'WebEngage');
  ck('CleverTap', 'Push Notifications', function() { return html.includes('clevertap.com') || html.includes('wzrkt.com'); }, 'CleverTap');
  ck('MoEngage', 'Push Notifications', function() { return html.includes('moengage.com'); }, 'MoEngage');

  // ========== VIDEO & MEDIA (12) ==========
  ck('YouTube Embed', 'Video', function() { return html.includes('youtube.com/embed') || html.includes('youtube-nocookie.com'); }, 'YouTube embed');
  ck('Vimeo', 'Video', function() { return html.includes('player.vimeo.com') || html.includes('vimeo.com'); }, 'Vimeo');
  ck('Wistia', 'Video', function() { return html.includes('wistia.com') || html.includes('wistia.net') || html.includes('fast.wistia.com'); }, 'Wistia');
  ck('Vidyard', 'Video', function() { return html.includes('vidyard.com') || html.includes('play.vidyard.com'); }, 'Vidyard');
  ck('Brightcove', 'Video', function() { return html.includes('brightcove.com') || html.includes('players.brightcove.net'); }, 'Brightcove');
  ck('Loom Embed', 'Video', function() { return html.includes('loom.com/embed') || html.includes('loom.com/share'); }, 'Loom');
  ck('JW Player', 'Video', function() { return html.includes('jwplayer.com') || html.includes('jwplatform.com'); }, 'JW Player');
  ck('Mux', 'Video', function() { return html.includes('mux.com') || html.includes('stream.mux.com'); }, 'Mux');
  ck('Cloudflare Stream', 'Video', function() { return html.includes('cloudflarestream.com') || html.includes('videodelivery.net'); }, 'Cloudflare Stream');
  ck('Spotify Embed', 'Video', function() { return html.includes('open.spotify.com/embed'); }, 'Spotify embed');
  ck('SoundCloud Embed', 'Video', function() { return html.includes('w.soundcloud.com'); }, 'SoundCloud embed');
  ck('Podbean', 'Video', function() { return html.includes('podbean.com'); }, 'Podbean podcast');

  // ========== FORMS & SURVEYS (12) ==========
  ck('Typeform', 'Forms', function() { return html.includes('typeform.com'); }, 'Typeform');
  ck('JotForm', 'Forms', function() { return html.includes('jotform.com') || html.includes('jotform.us'); }, 'JotForm');
  ck('Google Forms', 'Forms', function() { return html.includes('docs.google.com/forms'); }, 'Google Forms');
  ck('Formstack', 'Forms', function() { return html.includes('formstack.com'); }, 'Formstack');
  ck('SurveyMonkey', 'Forms', function() { return html.includes('surveymonkey.com'); }, 'SurveyMonkey');
  ck('Qualtrics', 'Forms', function() { return html.includes('qualtrics.com'); }, 'Qualtrics');
  ck('Gravity Forms', 'Forms', function() { return html.includes('gravityforms') || html.includes('gform_'); }, 'Gravity Forms');
  ck('WPForms', 'Forms', function() { return html.includes('wpforms'); }, 'WPForms');
  ck('Ninja Forms', 'Forms', function() { return html.includes('ninja-forms') || html.includes('nf-form-content'); }, 'Ninja Forms');
  ck('Tally', 'Forms', function() { return html.includes('tally.so'); }, 'Tally forms');
  ck('Paperform', 'Forms', function() { return html.includes('paperform.co'); }, 'Paperform');
  ck('Wufoo', 'Forms', function() { return html.includes('wufoo.com'); }, 'Wufoo');

  // ========== MAPS (6) ==========
  ck('Google Maps', 'Maps', function() { return html.includes('maps.googleapis.com') || html.includes('maps.google.com'); }, 'Google Maps');
  ck('Mapbox', 'Maps', function() { return html.includes('mapbox.com') || html.includes('mapbox-gl'); }, 'Mapbox');
  ck('Leaflet', 'Maps', function() { return html.includes('leafletjs.com') || html.includes('leaflet.js') || html.includes('leaflet.css'); }, 'Leaflet');
  ck('OpenStreetMap', 'Maps', function() { return html.includes('openstreetmap.org'); }, 'OpenStreetMap');
  ck('HERE Maps', 'Maps', function() { return html.includes('here.com/maps') || html.includes('js.api.here.com'); }, 'HERE Maps');
  ck('ArcGIS', 'Maps', function() { return html.includes('arcgis.com') || html.includes('js.arcgis.com'); }, 'ArcGIS');

  // ========== BACKEND FRAMEWORKS (strict patterns to avoid false positives) ==========
  ck('Laravel', 'Backend', function() { return (html.includes('csrf-token') && html.includes('_token') && html.includes('laravel')); }, 'Laravel signatures');
  ck('Django', 'Backend', function() { return html.includes('csrfmiddlewaretoken'); }, 'Django CSRF token');
  ck('Ruby on Rails', 'Backend', function() { return html.includes('csrf-param') && html.includes('authenticity_token'); }, 'Rails CSRF tokens');
  ck('ASP.NET', 'Backend', function() { return html.includes('__VIEWSTATE') || html.includes('__EVENTTARGET'); }, 'ASP.NET ViewState');
  ck('PHP', 'Backend', function() { var phpLinks = allLinks.filter(function(a) { return a.href.match(/\.php(\?|$|#)/); }); return phpLinks.length >= 2 && !html.includes('wp-content'); }, 'Multiple .php pages');

  // ========== SEARCH VERIFICATION (5) ==========
  ck('Google Search Console', 'Verification', function() { return !!doc.querySelector('meta[name="google-site-verification"]'); }, 'Google verification');
  ck('Bing Webmaster', 'Verification', function() { return !!doc.querySelector('meta[name="msvalidate.01"]'); }, 'Bing verification');
  ck('Yandex Webmaster', 'Verification', function() { return !!doc.querySelector('meta[name="yandex-verification"]'); }, 'Yandex verification');
  ck('Baidu Webmaster', 'Verification', function() { return !!doc.querySelector('meta[name="baidu-site-verification"]'); }, 'Baidu verification');
  ck('Pinterest Verification', 'Verification', function() { return !!doc.querySelector('meta[name="p:domain_verify"]'); }, 'Pinterest verification');

  // ========== LEAD CAPTURE ==========
  var forms = doc.querySelectorAll('form');
  if (forms.length > 0) detections.push({ name: 'Forms detected (' + forms.length + ')', category: 'Lead Capture', source: 'Form elements', confidence: 'strong' });
  var lowerHtml = html.toLowerCase();
  if (lowerHtml.includes('book-a-demo') || lowerHtml.includes('request-demo') || lowerHtml.includes('schedule-demo') || lowerHtml.includes('get-a-demo'))
    detections.push({ name: 'Demo/booking form', category: 'Lead Capture', source: 'Demo keywords', confidence: 'strong' });

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

  // ========== TRUST / COMPLIANCE ==========
  var bodyText = (doc.body && doc.body.innerText ? doc.body.innerText : '').toLowerCase();
  if (bodyText.includes('soc 2') || bodyText.includes('soc2')) detections.push({ name: 'SOC 2 compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
  if (bodyText.includes('gdpr')) detections.push({ name: 'GDPR compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
  if (bodyText.includes('hipaa')) detections.push({ name: 'HIPAA compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
  if (bodyText.includes('iso 27001') || bodyText.includes('iso27001')) detections.push({ name: 'ISO 27001', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
  if (bodyText.includes('pci dss') || bodyText.includes('pci compliant')) detections.push({ name: 'PCI DSS', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });
  if (bodyText.includes('ccpa')) detections.push({ name: 'CCPA compliance', category: 'Trust / Compliance', source: 'Page text', confidence: 'strong' });

  // ========== COMPANY PROFILE ==========
  var ogSiteNameEl = doc.querySelector('meta[property="og:site_name"]');
  var ogSiteName = ogSiteNameEl ? ogSiteNameEl.getAttribute('content') || '' : '';
  var ogTitleEl = doc.querySelector('meta[property="og:title"]');
  var ogTitle = ogTitleEl ? ogTitleEl.getAttribute('content') || '' : '';
  var ogDescEl = doc.querySelector('meta[property="og:description"]');
  var ogDesc = ogDescEl ? ogDescEl.getAttribute('content') || '' : '';
  var companyName = ogSiteName || (title ? title.split(/\s*[-|]\s*/)[0].trim() : domain.split('.')[0]);
  companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

  var allLinks = Array.from(doc.querySelectorAll('a'));
  var links = allLinks.map(function(a) { return a.href.toLowerCase(); });

  // ========== SOCIAL LINKS EXTRACTION ==========
  var socialLinks = { linkedin: '', twitter: '', facebook: '', instagram: '', youtube: '', github: '', tiktok: '' };
  allLinks.forEach(function(a) {
    var h = a.href.toLowerCase();
    if (h.includes('linkedin.com/company') || h.includes('linkedin.com/in/')) socialLinks.linkedin = a.href;
    if ((h.includes('twitter.com/') || h.includes('x.com/')) && !h.includes('intent/tweet')) socialLinks.twitter = a.href;
    if (h.includes('facebook.com/') && !h.includes('sharer')) socialLinks.facebook = a.href;
    if (h.includes('instagram.com/')) socialLinks.instagram = a.href;
    if (h.includes('youtube.com/') || h.includes('youtu.be/')) socialLinks.youtube = a.href;
    if (h.includes('github.com/') && !h.includes('github.com/topics')) socialLinks.github = a.href;
    if (h.includes('tiktok.com/')) socialLinks.tiktok = a.href;
  });

  // ========== CONTACT INFO EXTRACTION ==========
  // Extract standard emails
  var emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  var allEmails = (bodyText.match(emailRegex) || []);

  // Also extract obfuscated emails: [at] [dot] (at) (dot) {at} {dot} -at- -dot- _at_ _dot_
  var obfuscatedText = bodyText
    .replace(/\s*\[at\]\s*/gi, '@')
    .replace(/\s*\(at\)\s*/gi, '@')
    .replace(/\s*\{at\}\s*/gi, '@')
    .replace(/\s*-at-\s*/gi, '@')
    .replace(/\s*_at_\s*/gi, '@')
    .replace(/\s*\bat\b\s*/gi, '@')
    .replace(/\s*\[dot\]\s*/gi, '.')
    .replace(/\s*\(dot\)\s*/gi, '.')
    .replace(/\s*\{dot\}\s*/gi, '.')
    .replace(/\s*-dot-\s*/gi, '.')
    .replace(/\s*_dot_\s*/gi, '.');
  var obfuscatedEmails = (obfuscatedText.match(emailRegex) || []);

  // Also check HTML for mailto: links
  var mailtoLinks = Array.from(doc.querySelectorAll('a[href^="mailto:"]'));
  var mailtoEmails = mailtoLinks.map(function(a) {
    return a.getAttribute('href').replace('mailto:', '').split('?')[0].trim().toLowerCase();
  }).filter(function(e) { return e.includes('@'); });

  // Combine all sources
  var combinedEmails = allEmails.concat(obfuscatedEmails).concat(mailtoEmails);

  // Filter to likely company/contact emails
  var companyEmails = combinedEmails.filter(function(e) {
    var lower = e.toLowerCase();
    return (lower.includes('info@') || lower.includes('contact@') || lower.includes('hello@') ||
            lower.includes('support@') || lower.includes('sales@') || lower.includes('hi@') ||
            lower.includes('team@') || lower.includes('admin@') || lower.includes('enquir') ||
            lower.includes('business@') || lower.includes('partners@') || lower.includes('press@') ||
            lower.includes('hr@') || lower.includes('careers@') || lower.includes('office@') ||
            lower.includes('mail@') || lower.includes('general@') || lower.includes('help@') ||
            lower.includes('feedback@') || lower.includes('marketing@') ||
            lower.endsWith('@' + domain) ||
            lower.endsWith('@nic.in') || lower.endsWith('@gov.in') || lower.endsWith('@gov.'));
  });

  // If no company emails found, include ALL found emails (they're on the page publicly)
  if (companyEmails.length === 0 && combinedEmails.length > 0) {
    companyEmails = combinedEmails;
  }

  // Deduplicate
  companyEmails = companyEmails.filter(function(e, i) { return companyEmails.indexOf(e) === i; }).slice(0, 10);

  // Extract phone numbers
  var phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  var rawPhones = (bodyText.match(phoneRegex) || []);
  var phones = rawPhones.filter(function(p) {
    var digits = p.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }).filter(function(p, i, arr) { return arr.indexOf(p) === i; }).slice(0, 3);

  // Extract address/location
  var locationEl = doc.querySelector('[class*="address"],[class*="location"],[itemtype*="PostalAddress"]');
  var location = locationEl ? (locationEl.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 200) : '';
  // Fallback: check JSON-LD for address
  if (!location) {
    var jsonLdEls = doc.querySelectorAll('script[type="application/ld+json"]');
    for (var jl = 0; jl < jsonLdEls.length; jl++) {
      try {
        var ld = JSON.parse(jsonLdEls[jl].textContent || '');
        if (ld.address) {
          var addr = ld.address;
          location = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.addressCountry, addr.postalCode].filter(Boolean).join(', ');
        }
      } catch(e) {}
    }
  }

  // ========== RECENT BLOG POSTS ==========
  var recentPosts = [];
  // Try to find blog post links with dates
  var articleEls = doc.querySelectorAll('article, [class*="blog-post"], [class*="post-item"], [class*="blog-card"], [class*="article-card"]');
  for (var ap = 0; ap < Math.min(articleEls.length, 3); ap++) {
    var artTitle = articleEls[ap].querySelector('h2, h3, h4');
    var artLink = articleEls[ap].querySelector('a');
    var artDate = articleEls[ap].querySelector('time, [class*="date"], [class*="published"]');
    if (artTitle) {
      recentPosts.push({
        title: (artTitle.textContent || '').trim().substring(0, 100),
        url: artLink ? artLink.href : '',
        date: artDate ? (artDate.getAttribute('datetime') || artDate.textContent || '').trim().substring(0, 30) : '',
      });
    }
  }

  // ========== CUSTOMER LOGOS / SOCIAL PROOF ==========
  var customerLogos = [];
  var logoSections = doc.querySelectorAll('[class*="logo"],[class*="client"],[class*="partner"],[class*="trusted"],[class*="brand"],[class*="customer-logo"]');
  logoSections.forEach(function(section) {
    var imgs = section.querySelectorAll('img');
    imgs.forEach(function(img) {
      var alt = (img.getAttribute('alt') || '').trim();
      if (alt && alt.length > 1 && alt.length < 60 && customerLogos.length < 10) {
        customerLogos.push(alt);
      }
    });
  });
  // Deduplicate
  customerLogos = customerLogos.filter(function(l, i) { return customerLogos.indexOf(l) === i; });

  // ========== TESTIMONIALS ==========
  var testimonials = [];
  var testimonialEls = doc.querySelectorAll('[class*="testimonial"],[class*="review"],[class*="quote"],[class*="feedback"]');
  for (var ti = 0; ti < Math.min(testimonialEls.length, 3); ti++) {
    var tText = (testimonialEls[ti].textContent || '').trim().substring(0, 200);
    if (tText.length > 20) {
      testimonials.push(tText.replace(/\s+/g, ' '));
    }
  }

  // ========== TEAM / LEADERSHIP (public page only) ==========
  var teamMembers = [];
  var teamSections = doc.querySelectorAll('[class*="team"],[class*="leadership"],[class*="founder"],[class*="about-us"],[class*="our-team"]');
  teamSections.forEach(function(section) {
    var memberEls = section.querySelectorAll('[class*="member"],[class*="person"],[class*="leader"],[class*="card"]');
    memberEls.forEach(function(el) {
      if (teamMembers.length >= 10) return;
      var nameEl = el.querySelector('h3, h4, h5, [class*="name"]');
      var roleEl = el.querySelector('p, span, [class*="title"], [class*="role"], [class*="position"]');
      var linkedinEl = el.querySelector('a[href*="linkedin"]');
      if (nameEl) {
        var memberName = (nameEl.textContent || '').trim();
        var memberRole = roleEl ? (roleEl.textContent || '').trim().substring(0, 80) : '';
        var memberLinkedin = linkedinEl ? linkedinEl.href : '';
        if (memberName.length > 2 && memberName.length < 60) {
          teamMembers.push({ name: memberName, role: memberRole, linkedin: memberLinkedin });
        }
      }
    });
  });

  // ========== SCHEDULING LINKS ==========
  var schedulingLink = '';
  allLinks.forEach(function(a) {
    var h = a.href.toLowerCase();
    if (h.includes('calendly.com/') || h.includes('cal.com/') || h.includes('acuityscheduling.com/') ||
        h.includes('chilipiper.com/') || h.includes('hubspot.com/meetings/') || h.includes('savvycal.com/')) {
      if (!schedulingLink) schedulingLink = a.href;
    }
  });

  // ========== COPYRIGHT YEAR ==========
  var copyrightMatch = bodyText.match(/©\s*(\d{4})/);
  var copyrightYear = copyrightMatch ? copyrightMatch[1] : '';

  var company = {
    name: companyName, domain: domain,
    tagline: ogTitle || '',
    description: metaDesc || ogDesc || '',
    industry: 'Unknown',
    type: (function() {
      // Helper: count keyword hits (more hits = higher confidence)
      function score(keywords) {
        var count = 0;
        for (var ki = 0; ki < keywords.length; ki++) {
          if (bodyText.includes(keywords[ki])) count++;
        }
        return count;
      }

      // Check domain-based signals first (most reliable)
      if (domain.endsWith('.gov') || domain.endsWith('.gov.in') || domain.endsWith('.nic.in') || domain.endsWith('.gov.uk') || domain.endsWith('.gov.au')) return 'government';
      if (domain.endsWith('.edu') || domain.endsWith('.ac.in') || domain.endsWith('.ac.uk')) return 'education';
      if (domain.endsWith('.org') && (bodyText.includes('donate') || bodyText.includes('nonprofit') || bodyText.includes('charity'))) return 'nonprofit';

      // Check for specific ecommerce platforms (most reliable)
      var hasEcomPlatform = html.includes('Shopify.theme') || html.includes('myshopify.com') || !!doc.querySelector('meta[name="shopify-checkout-api-token"]') || html.includes('woocommerce') || html.includes('cdn.bigcommerce') || html.includes('Magento_');
      if (hasEcomPlatform) return 'ecommerce';

      // Score-based classification (need 2+ keyword hits to classify)
      var scores = {
        hospitality: score(['hotel', 'resort', 'check-in', 'book a room', 'accommodation', 'suites', 'rooms available', 'guest']),
        restaurant: score(['restaurant', 'menu', 'dine', 'cuisine', 'reservation', 'chef', 'food ordering']),
        education: score(['university', 'academic', 'semester', 'faculty', 'campus', 'students', 'admission', 'enroll']),
        government: score(['government', 'ministry', 'citizen', 'public service', 'department of', 'official website']),
        healthcare: score(['hospital', 'patient', 'doctor', 'appointment', 'medical', 'health care', 'clinical', 'treatment']),
        nonprofit: score(['donate', 'non-profit', 'nonprofit', 'volunteer', 'mission', 'charity', 'foundation']),
        realestate: score(['real estate', 'property for', 'sqft', 'bedroom', 'apartment', 'listing', 'for sale', 'for rent']),
        agency: score(['agency', 'our clients', 'our work', 'case study', 'portfolio', 'we help companies', 'our services']),
        saas: score(['free trial', 'sign up free', 'start free', 'pricing', 'per month', 'saas', 'platform', 'api']),
        services: score(['consulting', 'professional services', 'our expertise', 'solutions', 'implementation']),
        ecommerce: score(['add to cart', 'shop now', 'buy now', 'checkout', 'shopping cart', 'your order']),
      };

      // Find the category with highest score (minimum 2 to classify)
      var bestType = 'unknown';
      var bestScore = 1; // minimum threshold of 2
      for (var t in scores) {
        if (scores[t] > bestScore) {
          bestScore = scores[t];
          bestType = t;
        }
      }
      return bestType;
    })(),
    hasCareerPage: links.some(function(l) { return l.includes('/careers') || l.includes('/jobs') || l.includes('greenhouse.io') || l.includes('lever.co') || l.includes('ashbyhq.com') || l.includes('workable.com'); }),
    hasBlog: links.some(function(l) { return l.includes('/blog') || l.includes('/articles') || l.includes('/news') || l.includes('/resources'); }),
    hasPricingPage: links.some(function(l) { return l.includes('/pricing') || l.includes('/plans'); }),
    hasFreeTrial: bodyText.includes('free trial') || bodyText.includes('start free') || bodyText.includes('try free'),
    hasDemoPage: bodyText.includes('book a demo') || bodyText.includes('request demo') || bodyText.includes('schedule demo') || bodyText.includes('get a demo'),
    hasCaseStudies: links.some(function(l) { return l.includes('/case-stud') || l.includes('/customers') || l.includes('/success-stories'); }),
    hasApiDocs: links.some(function(l) { return l.includes('/docs') || l.includes('/api-reference') || l.includes('/api-docs') || l.includes('/developers') || l.includes('/developer'); }) && (bodyText.includes('api') && (bodyText.includes('documentation') || bodyText.includes('endpoint') || bodyText.includes('sdk'))),
    hasIntegrationsPage: links.some(function(l) { return l.includes('/integrations') || l.includes('/marketplace') || l.includes('/apps'); }),
    estimatedSize: links.some(function(l) { return l.includes('greenhouse.io') || l.includes('lever.co') || l.includes('ashbyhq.com'); }) ? '51-200' :
                   links.some(function(l) { return l.includes('/careers') || l.includes('/jobs'); }) ? '11-50' : '1-10',
    // New enrichment fields
    socialLinks: socialLinks,
    emails: companyEmails,
    phones: phones,
    location: location,
    recentPosts: recentPosts,
    customerLogos: customerLogos,
    testimonials: testimonials,
    teamMembers: teamMembers,
    schedulingLink: schedulingLink,
    copyrightYear: copyrightYear,
  };

  return { url: url, domain: domain, timestamp: Date.now(), detections: detections, company: company, isCompanyWebsite: true };
}
