/**
 * Prefix an absolute, site-root path with Astro's configured `base`
 * (e.g. "/shop-and-son/") so links and assets resolve under GitHub Pages'
 * project subpath as well as at the domain root.
 *
 *   withBase("/images/x.jpg")  →  "/shop-and-son/images/x.jpg"
 *   withBase("/preorders/")    →  "/shop-and-son/preorders/"
 *
 * Hash links (#clothing) and external URLs are returned unchanged.
 */
export function withBase(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("#") || path.startsWith("mailto:")) {
    return path;
  }
  const base = import.meta.env.BASE_URL; // always has a trailing slash
  return base.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);
}
