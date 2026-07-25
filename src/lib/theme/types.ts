export interface ThemeSettings {
  fontHeadings: string;
  fontBody: string;
  fontNavMenu: string;
  fontFooter: string;
  fontCaptions: string;
  fontOverlay: string;
  // Per-role font weight (300–800) and tracking/letter-spacing (em)
  weightHeadings: number;
  trackingHeadings: number;
  weightBody: number;
  trackingBody: number;
  weightNavMenu: number;
  trackingNavMenu: number;
  weightFooter: number;
  trackingFooter: number;
  weightCaptions: number;
  trackingCaptions: number;
  weightOverlay: number;
  trackingOverlay: number;
  bodyFontSize: number;
  logoPosition: "left" | "center" | "right";
  logoSize: number;
  menuFontSize: number;
  menuJustify: "left" | "center" | "right";
  headerBehavior: "scroll" | "static";
  footerFontSize: number;
  colorSiteBg: string;
  colorHeaderBg: string;
  colorFooterBg: string;
  colorFooterText: string;
  colorAccent: string;
  colorText: string;
  colorGalleryCaptions: string;
  colorLightboxText: string;
  colorHeroOverlay: string;
}

export const THEME_DEFAULTS: ThemeSettings = {
  fontHeadings: "EB Garamond",
  fontBody: "EB Garamond",
  fontNavMenu: "EB Garamond",
  fontFooter: "EB Garamond",
  fontCaptions: "EB Garamond",
  fontOverlay: "EB Garamond",
  // Defaults match the previous hardcoded styles (headings were semibold + tight,
  // nav menu had tracking-wide) so existing sites look unchanged.
  weightHeadings: 600,
  trackingHeadings: -0.025,
  weightBody: 400,
  trackingBody: 0,
  weightNavMenu: 400,
  trackingNavMenu: 0.025,
  weightFooter: 400,
  trackingFooter: 0,
  weightCaptions: 400,
  trackingCaptions: 0,
  weightOverlay: 400,
  trackingOverlay: 0,
  bodyFontSize: 16,
  logoPosition: "left",
  logoSize: 40,
  menuFontSize: 14,
  menuJustify: "right",
  headerBehavior: "scroll",
  footerFontSize: 14,
  colorSiteBg: "#ffffff",
  colorHeaderBg: "#ffffff",
  colorFooterBg: "#ffffff",
  colorFooterText: "#737373",
  colorAccent: "#525252",
  colorText: "#171717",
  colorGalleryCaptions: "#525252",
  colorLightboxText: "#ffffff",
  colorHeroOverlay: "#ffffff",
};

export function resolveTheme(
  stored?: Partial<ThemeSettings> | null
): ThemeSettings {
  if (!stored) return { ...THEME_DEFAULTS };
  return { ...THEME_DEFAULTS, ...stored };
}
