/**
 * Per-site configuration overrides for gardensalacarte.com.
 *
 * This file is OWNED BY THE SITE. The CMS repo ships it once as a stub and
 * never modifies it again, so merging upstream will not conflict with the
 * customizations below; anything omitted falls back to the upstream defaults
 * in `site.config.defaults.ts` (which sites should never edit).
 */

import { defineSiteConfig } from "./site.config.defaults";

export type { SiteConfig } from "./site.config.defaults";

const siteConfig = defineSiteConfig({
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Gardens a la Carte",
  siteDescription:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Custom landscape design services",
  defaultAdminEmail: process.env.ADMIN_EMAIL || "celine@gardensalacarte.com",
  uploadFolder: process.env.UPLOAD_FOLDER || "gardensalacarte",
  labels: {
    gallery: "Portfolio",
    galleries: "Portfolios",
    photo: "Image",
    photos: "Images",
    gallerySlug: "portfolio",
  },
  features: {
    stories: false,
    photoMetadata: false,
  },
  lightboxMetadataOptions: [
    { key: "title", label: "Title", enabled: true },
    { key: "description", label: "Description", enabled: true },
    { key: "location", label: "Location", enabled: false },
    { key: "camera", label: "Camera Settings", enabled: false },
    { key: "filename", label: "Filename", enabled: false },
  ],
});

export default siteConfig;
