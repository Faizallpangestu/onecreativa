const SITE_URL = 'https://one.creativabridging.com';
export function updateRouteMetadata(pathname) {
  const isPublic = pathname === '/' || pathname === '/login';
  const canonical = `${SITE_URL}${isPublic ? '/login' : pathname}`;
  const link = document.querySelector('link[rel="canonical"]');
  if (link) link.href = canonical;
  for (const selector of ['meta[property="og:url"]', 'meta[name="twitter:url"]']) {
    document.querySelector(selector)?.setAttribute('content', canonical);
  }
  for (const name of ['robots', 'googlebot']) {
    document.querySelector(`meta[name="${name}"]`)?.setAttribute('content', isPublic ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
  }
}
