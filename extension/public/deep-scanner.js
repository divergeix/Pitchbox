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

    // Key pages to prioritize
    var priorityPaths = ['/about', '/pricing', '/plans', '/features', '/products', '/services',
      '/contact', '/careers', '/jobs', '/blog', '/case-studies', '/customers',
      '/integrations', '/partners', '/team', '/company', '/solutions', '/platform',
      '/resources', '/docs', '/security', '/trust', '/privacy', '/terms'];

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
