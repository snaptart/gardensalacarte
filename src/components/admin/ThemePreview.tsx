"use client";

import type { ThemeSettings } from "@/lib/theme/types";
import { buildGoogleFontsUrl, getFontFallback } from "@/lib/theme/fonts";

interface ThemePreviewProps {
  theme: ThemeSettings;
  siteTitle: string;
  logoUrl: string;
}

export default function ThemePreview({ theme, siteTitle, logoUrl }: ThemePreviewProps) {
  const fontsUrl = buildGoogleFontsUrl([
    theme.fontHeadings,
    theme.fontBody,
    theme.fontNavMenu,
    theme.fontFooter,
    theme.fontCaptions,
    theme.fontOverlay,
  ]);

  const justifyMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 shadow-sm">
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}

      {/* Mini Navbar */}
      <div
        className="border-b border-neutral-200 px-8 py-6"
        style={{ backgroundColor: theme.colorHeaderBg }}
      >
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: "1fr auto 1fr",
            color: theme.colorText,
          }}
        >
          <div style={{ justifySelf: theme.logoPosition === "left" ? "start" : "start" }}>
            {theme.logoPosition === "left" && (
              logoUrl ? (
                <img src={logoUrl} alt={siteTitle} style={{ height: `${theme.logoSize}px` }} />
              ) : (
                <span
                  style={{
                    fontFamily: getFontFallback(theme.fontHeadings),
                    fontSize: `${theme.logoSize * 0.6}px`,
                    fontWeight: 300,
                    letterSpacing: "0.1em",
                  }}
                >
                  {siteTitle || "Site Title"}
                </span>
              )
            )}
          </div>
          <div style={{ justifySelf: "center" }}>
            {theme.logoPosition === "center" && (
              logoUrl ? (
                <img src={logoUrl} alt={siteTitle} style={{ height: `${theme.logoSize}px` }} />
              ) : (
                <span
                  style={{
                    fontFamily: getFontFallback(theme.fontHeadings),
                    fontSize: `${theme.logoSize * 0.6}px`,
                    fontWeight: 300,
                    letterSpacing: "0.1em",
                  }}
                >
                  {siteTitle || "Site Title"}
                </span>
              )
            )}
          </div>
          <div
            className="flex gap-6"
            style={{
              justifySelf: "end",
              fontFamily: getFontFallback(theme.fontNavMenu),
              fontSize: `${theme.menuFontSize * 1.5}px`,
              fontWeight: theme.weightNavMenu,
              letterSpacing: `${theme.trackingNavMenu}em`,
              justifyContent: justifyMap[theme.menuJustify],
            }}
          >
            {theme.logoPosition === "right" && (
              logoUrl ? (
                <img src={logoUrl} alt={siteTitle} style={{ height: `${theme.logoSize}px` }} className="mr-8" />
              ) : (
                <span
                  className="mr-8"
                  style={{
                    fontFamily: getFontFallback(theme.fontHeadings),
                    fontSize: `${theme.logoSize * 0.6}px`,
                    fontWeight: 300,
                    letterSpacing: "0.1em",
                  }}
                >
                  {siteTitle || "Site Title"}
                </span>
              )
            )}
            <span style={{ opacity: 0.7 }}>Gallery</span>
            <span style={{ opacity: 0.7 }}>About</span>
            <span style={{ opacity: 0.7 }}>Contact</span>
          </div>
        </div>
      </div>

      {/* Sample Content */}
      <div
        className="px-12 py-12"
        style={{
          backgroundColor: theme.colorSiteBg,
          color: theme.colorText,
        }}
      >
        <h2
          className="mb-4"
          style={{
            fontFamily: getFontFallback(theme.fontHeadings),
            fontSize: "36px",
            fontWeight: theme.weightHeadings,
            letterSpacing: `${theme.trackingHeadings}em`,
          }}
        >
          Sample Heading
        </h2>
        <p
          className="mb-6"
          style={{
            fontFamily: getFontFallback(theme.fontBody),
            fontSize: "26px",
            fontWeight: theme.weightBody,
            letterSpacing: `${theme.trackingBody}em`,
            lineHeight: 1.6,
          }}
        >
          This is sample body text showing how your chosen font and colors look together.
          This is how your chosen font and colors look on longer paragraphs of text.
        </p>
        <div className="flex gap-6">
          <div className="h-32 w-48 rounded bg-neutral-300" />
          <div className="h-32 w-48 rounded bg-neutral-300" />
          <div className="h-32 w-48 rounded bg-neutral-300" />
        </div>
        <p
          className="mt-4"
          style={{
            fontFamily: getFontFallback(theme.fontCaptions),
            fontSize: "22px",
            fontWeight: theme.weightCaptions,
            letterSpacing: `${theme.trackingCaptions}em`,
            color: theme.colorGalleryCaptions,
          }}
        >
          Caption text — Sample image caption
        </p>
        <div
          className="mt-2 rounded px-4 py-2"
          style={{ backgroundColor: "#1a1a1a", display: "inline-block" }}
        >
          <p
            style={{
              fontFamily: getFontFallback(theme.fontOverlay),
              fontSize: "22px",
              fontWeight: theme.weightOverlay,
              letterSpacing: `${theme.trackingOverlay}em`,
              color: theme.colorHeroOverlay,
            }}
          >
            Hero overlay sample
          </p>
        </div>
      </div>

      {/* Mini Footer */}
      <div
        className="border-t border-neutral-200 px-8 py-6 text-center"
        style={{
          backgroundColor: theme.colorFooterBg,
          fontFamily: getFontFallback(theme.fontFooter),
          color: theme.colorFooterText,
          fontSize: `${theme.footerFontSize * 1.5}px`,
          fontWeight: theme.weightFooter,
          letterSpacing: `${theme.trackingFooter}em`,
        }}
      >
        <p>&copy; {new Date().getFullYear()} {siteTitle || "Your Site"}. All rights reserved.</p>
        <p className="mt-1">
          <span style={{ color: theme.colorAccent }}>contact@example.com</span>
        </p>
      </div>
    </div>
  );
}
