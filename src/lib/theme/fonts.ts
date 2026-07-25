// Each font declares the exact Google Fonts css2 axis string it supports.
// A blanket range (e.g. 300..800) 400s the whole stylesheet request when any
// family doesn't cover it, so these must match each font's actual axes.
export const CURATED_FONTS = [
  // Serif
  { name: "EB Garamond", category: "serif" as const, axis: "ital,wght@0,400..800;1,400..800", minWeight: 400, maxWeight: 800 },
  { name: "Playfair", category: "serif" as const, axis: "ital,wght@0,300..900;1,300..900", minWeight: 300, maxWeight: 900 },
  { name: "Lora", category: "serif" as const, axis: "ital,wght@0,400..700;1,400..700", minWeight: 400, maxWeight: 700 },
  { name: "Merriweather", category: "serif" as const, axis: "ital,wght@0,300..900;1,300..900", minWeight: 300, maxWeight: 900 },
  { name: "Libre Baskerville", category: "serif" as const, axis: "ital,wght@0,400;0,700;1,400", minWeight: 400, maxWeight: 700 },
  { name: "Cormorant Garamond", category: "serif" as const, axis: "ital,wght@0,300..700;1,300..700", minWeight: 300, maxWeight: 700 },
  { name: "Spectral", category: "serif" as const, axis: "ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800", minWeight: 200, maxWeight: 800 },
  // Sans-Serif
  { name: "Inter", category: "sans-serif" as const, axis: "ital,wght@0,100..900;1,100..900", minWeight: 100, maxWeight: 900 },
  { name: "Jost", category: "sans-serif" as const, axis: "ital,wght@0,100..900;1,100..900", minWeight: 100, maxWeight: 900 },
  { name: "Montserrat", category: "sans-serif" as const, axis: "ital,wght@0,100..900;1,100..900", minWeight: 100, maxWeight: 900 },
  { name: "Open Sans", category: "sans-serif" as const, axis: "ital,wght@0,300..800;1,300..800", minWeight: 300, maxWeight: 800 },
  { name: "Raleway", category: "sans-serif" as const, axis: "ital,wght@0,100..900;1,100..900", minWeight: 100, maxWeight: 900 },
  { name: "Poppins", category: "sans-serif" as const, axis: "ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900", minWeight: 100, maxWeight: 900 },
  { name: "Work Sans", category: "sans-serif" as const, axis: "ital,wght@0,100..900;1,100..900", minWeight: 100, maxWeight: 900 },
  { name: "Nunito", category: "sans-serif" as const, axis: "ital,wght@0,200..1000;1,200..1000", minWeight: 200, maxWeight: 1000 },
  // Display
  { name: "Oswald", category: "display" as const, axis: "wght@200..700", minWeight: 200, maxWeight: 700 },
  { name: "Bebas Neue", category: "display" as const, axis: "", minWeight: 400, maxWeight: 400 },
  { name: "Archivo Black", category: "display" as const, axis: "", minWeight: 400, maxWeight: 400 },
];

export type FontCategory = (typeof CURATED_FONTS)[number]["category"];

const CATEGORY_FALLBACKS: Record<FontCategory, string> = {
  serif: "Georgia, serif",
  "sans-serif": "system-ui, sans-serif",
  display: "system-ui, sans-serif",
};

export function getFontCategory(fontName: string): FontCategory {
  const font = CURATED_FONTS.find((f) => f.name === fontName);
  return font?.category ?? "serif";
}

export function getFontFallback(fontName: string): string {
  return `"${fontName}", ${CATEGORY_FALLBACKS[getFontCategory(fontName)]}`;
}

export function getFontWeightRange(fontName: string): { min: number; max: number } {
  const font = CURATED_FONTS.find((f) => f.name === fontName);
  if (!font) return { min: 300, max: 800 };
  return { min: font.minWeight, max: font.maxWeight };
}

export function buildGoogleFontsUrl(fontNames: string[]): string {
  const unique = [...new Set(fontNames.filter(Boolean))];
  if (unique.length === 0) return "";

  const families = unique
    .map((name) => {
      const encoded = name.replace(/ /g, "+");
      const font = CURATED_FONTS.find((f) => f.name === name);
      // Unknown or single-weight fonts: request the plain family (regular 400)
      if (!font || !font.axis) return `family=${encoded}`;
      return `family=${encoded}:${font.axis}`;
    })
    .join("&");

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
