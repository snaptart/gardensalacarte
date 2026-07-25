import { ThemeSettings } from "./types";
import { getFontFallback } from "./fonts";

const JUSTIFY_MAP: Record<string, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

export function buildThemeCssVars(theme: ThemeSettings): string {
  return `:root {
  --theme-font-headings: ${getFontFallback(theme.fontHeadings)};
  --theme-font-body: ${getFontFallback(theme.fontBody)};
  --theme-font-nav-menu: ${getFontFallback(theme.fontNavMenu)};
  --theme-font-footer: ${getFontFallback(theme.fontFooter)};
  --theme-font-captions: ${getFontFallback(theme.fontCaptions)};
  --theme-font-overlay: ${getFontFallback(theme.fontOverlay)};
  --theme-weight-headings: ${theme.weightHeadings};
  --theme-tracking-headings: ${theme.trackingHeadings}em;
  --theme-weight-body: ${theme.weightBody};
  --theme-tracking-body: ${theme.trackingBody}em;
  --theme-weight-nav-menu: ${theme.weightNavMenu};
  --theme-tracking-nav-menu: ${theme.trackingNavMenu}em;
  --theme-weight-footer: ${theme.weightFooter};
  --theme-tracking-footer: ${theme.trackingFooter}em;
  --theme-weight-captions: ${theme.weightCaptions};
  --theme-tracking-captions: ${theme.trackingCaptions}em;
  --theme-weight-overlay: ${theme.weightOverlay};
  --theme-tracking-overlay: ${theme.trackingOverlay}em;
  --theme-body-font-size: ${theme.bodyFontSize}px;
  --theme-logo-position: ${theme.logoPosition};
  --theme-logo-size: ${theme.logoSize}px;
  --theme-menu-font-size: ${theme.menuFontSize}px;
  --theme-menu-justify: ${JUSTIFY_MAP[theme.menuJustify] ?? "flex-end"};
  --theme-footer-font-size: ${theme.footerFontSize}px;
  --theme-color-site-bg: ${theme.colorSiteBg};
  --theme-color-header-bg: ${theme.colorHeaderBg};
  --theme-color-footer-bg: ${theme.colorFooterBg};
  --theme-color-footer-text: ${theme.colorFooterText};
  --theme-color-accent: ${theme.colorAccent};
  --theme-color-text: ${theme.colorText};
  --theme-color-gallery-captions: ${theme.colorGalleryCaptions};
  --theme-color-lightbox-text: ${theme.colorLightboxText};
  --theme-color-hero-overlay: ${theme.colorHeroOverlay};
}`;
}
