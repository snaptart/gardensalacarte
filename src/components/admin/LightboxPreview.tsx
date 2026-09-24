"use client";

import {
  ROLE_FAMILY_FIELDS,
  TEXT_STYLE_DEFAULTS,
  type FontRoleKey,
  type TextStyleKey,
  type ThemeSettings,
} from "@/lib/theme/types";
import { getFontFallback } from "@/lib/theme/fonts";

/** A text style's typeface, weight, slant and case, at the preview's own size. */
function textCss(theme: ThemeSettings, key: TextStyleKey, size: number): React.CSSProperties {
  const style = { ...TEXT_STYLE_DEFAULTS[key], ...(theme.textStyles?.[key] ?? {}) };
  const role = theme.fontStyles?.[style.role] ?? {};
  return {
    fontFamily: getFontFallback(String(theme[ROLE_FAMILY_FIELDS[style.role]])),
    fontWeight: style.weight ?? role.weight ?? 400,
    fontStyle: (style.italic ?? role.italic) ? "italic" : "normal",
    textTransform: (style.uppercase ?? role.uppercase) ? "uppercase" : "none",
    fontSize: size,
    lineHeight: 1.15,
  };
}

function fontCss(theme: ThemeSettings, role: FontRoleKey): React.CSSProperties {
  return { fontFamily: getFontFallback(String(theme[ROLE_FAMILY_FIELDS[role]])) };
}

const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

// Mini version of the public lightbox (components/public/Lightbox.tsx): counter
// and close ring above, the photograph between two arrow rings, the caption
// under a hairline. Reacts to the lightbox colours and the text styles.
export default function LightboxPreview({ theme }: { theme: ThemeSettings }) {
  const bg = theme.colorLightboxBg || "#14130F";
  const text = theme.colorLightboxText || "#FBFAF8";
  const muted = mix(text, 62, bg);
  const ring = mix(text, 22, bg);
  const rule = mix(text, 12, bg);
  const body = fontCss(theme, "body");

  const roundButton = (size: number): React.CSSProperties => ({
    width: size,
    height: size,
    borderRadius: "50%",
    border: `1px solid ${ring}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 shadow-sm">
      <div
        className="relative flex flex-col"
        style={{ aspectRatio: "4 / 3", background: bg, color: text }}
      >
        <div className="flex items-center justify-between" style={{ padding: "10px 12px 0" }}>
          <span style={{ ...body, fontSize: 8, letterSpacing: "0.16em", color: muted }}>
            02 / 12&nbsp;&nbsp;&middot;&nbsp;&nbsp;North Shore
          </span>
          <span style={roundButton(18)} aria-hidden="true">
            <svg width="6" height="6" viewBox="0 0 16 16" fill="none" stroke={text} strokeWidth="1.6" strokeLinecap="round">
              <path d="M1 1l14 14M15 1L1 15" />
            </svg>
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center" style={{ padding: "8px 44px 0" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 200,
              aspectRatio: "3 / 2",
              background: "linear-gradient(135deg, #c5bfae 0%, #8a8274 50%, #5a554a 100%)",
            }}
          />
        </div>

        {[
          { side: "left" as const, d: "M22 5.5H2M9 1L2 5.5 9 10" },
          { side: "right" as const, d: "M0 5.5h20M13 1l7 4.5-7 4.5" },
        ].map(({ side, d }) => (
          <span
            key={side}
            aria-hidden="true"
            style={{ ...roundButton(22), position: "absolute", top: "46%", [side]: 12 }}
          >
            <svg width="9" height="5" viewBox="0 0 22 11" fill="none" stroke={text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
          </span>
        ))}

        <div style={{ padding: "10px 44px 8px" }}>
          <div style={{ borderTop: `1px solid ${rule}`, paddingTop: 7 }}>
            <div style={{ ...textCss(theme, "collectionTitle", 14), color: text }}>Split Rock Lighthouse</div>
            <div style={{ ...textCss(theme, "meta", 6.5), letterSpacing: "0.14em", color: muted, marginTop: 4 }}>
              Lake Superior, Minnesota &middot; September 2020
            </div>
            <div style={{ ...body, fontSize: 7, letterSpacing: "0.04em", color: muted, marginTop: 4 }}>
              Nikon Z 6 &middot; 165mm &middot; f/9 &middot; 1/8s &middot; ISO 320
            </div>
          </div>
        </div>

        <div
          style={{ ...body, fontSize: 6, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", color: mix(text, 36, bg), paddingBottom: 8 }}
        >
          Esc closes &middot; arrow keys move within the collection
        </div>
      </div>
    </div>
  );
}
