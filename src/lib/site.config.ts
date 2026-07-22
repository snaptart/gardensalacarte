/**
 * Per-site configuration overrides.
 *
 * This file is OWNED BY THE SITE. The CMS repo ships it once as this stub and
 * never modifies it again, so merging upstream will not conflict with your
 * customizations. Put your site's branding, terminology, and feature flags in
 * the object below; anything omitted falls back to the upstream defaults in
 * `site.config.defaults.ts` (which you should never edit).
 *
 * Example:
 *
 *   export default defineSiteConfig({
 *     siteName: "Gardens à la Carte",
 *     labels: { gallery: "Garden", galleries: "Gardens", gallerySlug: "garden" },
 *     features: { stories: false },
 *   });
 */

import { defineSiteConfig } from "./site.config.defaults";

export type { SiteConfig } from "./site.config.defaults";

const siteConfig = defineSiteConfig({
  // Per-site overrides go here.
});

export default siteConfig;
