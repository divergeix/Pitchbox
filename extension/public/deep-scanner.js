// Deep scanner: collects all internal links from the current page
// Returns list of unique internal URLs to scan
(function() {
  try {
    var hostname = window.location.hostname.toLowerCase();
    var protocol = window.location.protocol;
    var baseUrl = protocol + '//' + hostname;
    var allAnchors = document.querySelectorAll('a');
    var internalLinks = [];
    var seen = {};

    // Key pages to prioritize (comprehensive list)
    var priorityPaths = [
      '/about', '/about-us', '/company', '/who-we-are', '/our-story',
      '/pricing', '/plans', '/packages', '/editions', '/tiers',
      '/features', '/products', '/services', '/solutions', '/platform',
      '/contact', '/contact-us', '/get-in-touch',
      '/careers', '/career', '/jobs', '/join-us', '/work-with-us', '/hiring',
      '/blog', '/blogs', '/articles', '/news', '/insights', '/resources', '/learn',
      '/case-studies', '/casestudies', '/customers', '/success-stories', '/testimonials', '/portfolio', '/our-work', '/use-cases',
      '/integrations', '/marketplace', '/plugins', '/apps', '/partners', '/ecosystem',
      '/team', '/our-team', '/leadership', '/people',
      '/docs', '/documentation', '/developers', '/api',
      '/security', '/trust', '/compliance',
    ];

    for (var i = 0; i < allAnchors.length; i++) {
      var href = allAnchors[i].href;
      if (!href || typeof href !== 'string') continue;

      try {
        var linkUrl = new URL(href);
        // Only internal links (same hostname)
        if (linkUrl.hostname.toLowerCase() !== hostname) continue;
        // Skip anchors, javascript:, mailto:, tel:
        if (href.includes('#') && linkUrl.pathname === window.location.pathname) continue;
        if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
        // Skip files (pdf, jpg, png, etc.)
        if (linkUrl.pathname.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|mp4|mp3|webp|ico)$/i)) continue;

        var cleanUrl = linkUrl.origin + linkUrl.pathname;
        // Remove trailing slash for dedup
        cleanUrl = cleanUrl.replace(/\/$/, '');

        if (!seen[cleanUrl] && cleanUrl !== (baseUrl + window.location.pathname).replace(/\/$/, '')) {
          seen[cleanUrl] = true;
          // Check if it's a priority page
          var isPriority = priorityPaths.some(function(p) { return linkUrl.pathname.toLowerCase().includes(p); });
          internalLinks.push({ url: cleanUrl, priority: isPriority });
        }
      } catch(e) {}
    }

    // Sort: priority pages first, then alphabetical
    internalLinks.sort(function(a, b) {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return a.url.localeCompare(b.url);
    });

    // Limit to 10 pages max (priority pages first)
    window.__PITCHBOX_INTERNAL_LINKS__ = internalLinks.slice(0, 10).map(function(l) { return l.url; });
  } catch(e) {
    window.__PITCHBOX_INTERNAL_LINKS__ = [];
  }
})();
