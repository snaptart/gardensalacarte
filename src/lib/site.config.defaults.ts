/**
 * Upstream CMS configuration defaults.
 *
 * This file is OWNED BY THE CMS REPO. Downstream sites must never edit it —
 * new config fields are added here (with safe defaults) so that merging
 * upstream never conflicts with per-site customization.
 *
 * Per-site values belong in `site.config.ts`, which upstream ships once as a
 * stub and then never touches again.
 */

export type LightboxMetadataOption = {
  key: string;
  label: string;
  enabled: boolean;
};

export type SiteConfig = {
  /** Default site title (used in metadata, admin UI, seed data) */
  siteName: string;
  /** Fallback meta description when none is set in the DB */
  siteDescription: string;
  /** Default admin email for seeding */
  defaultAdminEmail: string;
  /** Upload folder prefix in Vercel Blob storage */
  uploadFolder: string;
  /**
   * Controls labels in the admin sidebar, page headings, empty states,
   * and public routes.
   */
  labels: {
    gallery: string;
    galleries: string;
    photo: string;
    photos: string;
    /** Public URL prefix for gallery pages (no leading/trailing slash) */
    gallerySlug: string;
  };
  features: {
    /** Show "Stories" section in admin sidebar */
    stories: boolean;
    /** Show photography-specific metadata (camera settings, location) */
    photoMetadata: boolean;
    /** Show "Submissions" section in admin sidebar */
    submissions: boolean;
  };
  /**
   * Which metadata fields are available in the lightbox settings UI.
   * Only fields with `enabled: true` appear as options.
   */
  lightboxMetadataOptions: LightboxMetadataOption[];
};

export type SiteConfigOverrides = {
  siteName?: string;
  siteDescription?: string;
  defaultAdminEmail?: string;
  uploadFolder?: string;
  labels?: Partial<SiteConfig["labels"]>;
  features?: Partial<SiteConfig["features"]>;
  lightboxMetadataOptions?: LightboxMetadataOption[];
};

export const defaultSiteConfig: SiteConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "My Site",
  siteDescription:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Welcome to our website",
  defaultAdminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  uploadFolder: process.env.UPLOAD_FOLDER || "uploads",
  labels: {
    gallery: "Gallery",
    galleries: "Galleries",
    photo: "Photo",
    photos: "Photos",
    gallerySlug: "gallery",
  },
  features: {
    stories: true,
    photoMetadata: true,
    submissions: true,
  },
  lightboxMetadataOptions: [
    { key: "title", label: "Title", enabled: true },
    { key: "description", label: "Description", enabled: true },
    { key: "location", label: "Location", enabled: true },
    { key: "camera", label: "Camera Settings", enabled: true },
    { key: "filename", label: "Filename", enabled: true },
  ],
};

/** Merge per-site overrides onto the upstream defaults. */
export function defineSiteConfig(overrides: SiteConfigOverrides = {}): SiteConfig {
  return {
    ...defaultSiteConfig,
    ...overrides,
    labels: { ...defaultSiteConfig.labels, ...overrides.labels },
    features: { ...defaultSiteConfig.features, ...overrides.features },
    lightboxMetadataOptions:
      overrides.lightboxMetadataOptions ?? defaultSiteConfig.lightboxMetadataOptions,
  };
}
