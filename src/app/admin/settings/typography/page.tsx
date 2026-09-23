"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CURATED_FONTS, buildGoogleFontsUrl, getFontFallback } from "@/lib/theme/fonts";
import {
  COLOR_TOKENS,
  ROLE_DEFAULTS,
  TEXT_STYLE_KEYS,
  TEXT_STYLE_LABELS,
  THEME_DEFAULTS,
  resolveTextStyles,
  resolveTheme,
  type ColorTokenKey,
  type FontRoleKey,
  type FontRoleStyle,
  type FontStylesMap,
  type TextStyle,
  type TextStyleKey,
  type TextStylesMap,
  type ThemeSettings,
} from "@/lib/theme/types";
import ThemePreview from "@/components/admin/ThemePreview";
import LightboxPreview from "@/components/admin/LightboxPreview";
import { useMessage } from "@/lib/hooks/useMessage";
import { Button, Field, Select } from "@/components/admin/ui";
import { SettingGroup } from "@/components/admin/settings/SettingGroup";

interface ThemeRecord {
  id: string;
  name: string;
  themeSettings: Partial<ThemeSettings>;
}

const SERIF_FONTS = CURATED_FONTS.filter((f) => f.category === "serif");
const SANS_FONTS = CURATED_FONTS.filter((f) => f.category === "sans-serif");
const DISPLAY_FONTS = CURATED_FONTS.filter((f) => f.category === "display");
const MONO_FONTS = CURATED_FONTS.filter((f) => f.category === "mono");

type FontFields = Pick<
  ThemeSettings,
  | "fontHeadings"
  | "fontBody"
  | "fontNavMenu"
  | "fontFooter"
  | "fontCaptions"
  | "fontOverlay"
  | "fontLabels"
  | "bodyFontSize"
> & {
  fontStyles: FontStylesMap;
  textStyles: TextStylesMap;
};

function pickFontFields(theme: ThemeSettings): FontFields {
  return {
    fontHeadings: theme.fontHeadings,
    fontBody: theme.fontBody,
    fontNavMenu: theme.fontNavMenu,
    fontFooter: theme.fontFooter,
    fontCaptions: theme.fontCaptions,
    fontOverlay: theme.fontOverlay,
    fontLabels: theme.fontLabels,
    fontStyles: theme.fontStyles ?? {},
    textStyles: resolveTextStyles(theme.textStyles),
    bodyFontSize: theme.bodyFontSize,
  };
}

/** Sample copy for each text style, taken from the design boards. */
const TEXT_STYLE_SAMPLES: Record<TextStyleKey, string> = {
  display: "Long light",
  collectionTitle: "North Shore",
  photoTitle: "Palisade Head",
  lead: "I photograph under the name SnaptArt, out of Minneapolis.",
  body: "Body copy sits at sixteen over one-point-seven-five, never wider than sixty-eight characters.",
  label: "Selected work",
  meta: "Lake Superior · Sept 2020",
};

const ROLE_META: {
  key: FontRoleKey;
  label: string;
  familyField: keyof Pick<
    ThemeSettings,
    | "fontHeadings"
    | "fontBody"
    | "fontNavMenu"
    | "fontFooter"
    | "fontCaptions"
    | "fontOverlay"
    | "fontLabels"
  >;
  hint?: string;
}[] = [
  { key: "headings", label: "Headings", familyField: "fontHeadings" },
  { key: "body", label: "Body", familyField: "fontBody" },
  { key: "navMenu", label: "Nav menu", familyField: "fontNavMenu" },
  { key: "footer", label: "Footer", familyField: "fontFooter" },
  { key: "captions", label: "Captions", familyField: "fontCaptions" },
  { key: "overlay", label: "Overlay text", familyField: "fontOverlay" },
  {
    key: "labels",
    label: "Small-caps labels",
    familyField: "fontLabels",
    hint:
      "Used on the Hall / Stories uppercase labels (PLAN VIEW · 1:1, CONTENTS). JetBrains Mono by default.",
  },
];

export default function TypographySettingsPage() {
  const [loaded, setLoaded] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [activeThemeName, setActiveThemeName] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeSettings>({
    ...THEME_DEFAULTS,
  });
  const [siteTitle, setSiteTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [draft, setDraft] = useState<FontFields>(() =>
    pickFontFields(THEME_DEFAULTS),
  );
  const [saving, setSaving] = useState(false);
  const { message, showSuccess, showError, clear, alertClass } = useMessage();

  useEffect(() => {
    Promise.all([fetch("/api/settings"), fetch("/api/themes")])
      .then(async ([settingsRes, themesRes]) => {
        const settings = await settingsRes.json();
        const themes: ThemeRecord[] = await themesRes.json();
        const id = settings?.activeThemeId ?? null;
        setActiveThemeId(id);
        setSiteTitle(settings?.siteTitle ?? "");
        setLogoUrl(settings?.logoUrl ?? "");
        const active = id ? themes.find((t) => t.id === id) : null;
        const merged: ThemeSettings = resolveTheme(active?.themeSettings ?? null);
        setActiveTheme(merged);
        setActiveThemeName(active?.name ?? null);
        setDraft(pickFontFields(merged));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const previewTheme: ThemeSettings = { ...activeTheme, ...draft };
  const draftFontsUrl = buildGoogleFontsUrl([
    draft.fontHeadings,
    draft.fontBody,
    draft.fontNavMenu,
    draft.fontFooter,
    draft.fontCaptions,
    draft.fontOverlay,
    draft.fontLabels,
  ]);

  function update<K extends keyof FontFields>(key: K, value: FontFields[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    if (!activeThemeId) {
      showError("Create a preset in Look and Feel first.");
      return;
    }
    setSaving(true);
    clear();
    const merged: ThemeSettings = { ...activeTheme, ...draft };
    const res = await fetch(`/api/themes/${activeThemeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: activeThemeName ?? "Default",
        themeSettings: merged,
      }),
    });
    if (res.ok) {
      setActiveTheme(merged);
      showSuccess("Typography saved.");
    } else {
      showError("Failed to save.");
    }
    setSaving(false);
  }

  if (!loaded) return <div className="text-admin-ink-soft">Loading...</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,640px)_minmax(0,1fr)] xl:gap-10 gap-6">
      {draftFontsUrl && <link rel="stylesheet" href={draftFontsUrl} />}
      <div>
      {message && <div className={`${alertClass} mb-4`}>{message.text}</div>}

      {/* Active preset banner */}
      <div className="mb-8 flex items-center justify-between gap-3 rounded-md border border-admin-border bg-admin-surface-2 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[2px] text-admin-ink-soft">
            Editing preset
          </div>
          <div className="font-serif italic text-[16px] text-admin-ink mt-0.5">
            {activeThemeName ?? "No active preset"}
          </div>
        </div>
        <Link
          href="/admin/settings/look"
          className="inline-flex items-center gap-1 text-[12px] text-admin-accent hover:underline"
        >
          Change preset
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!activeThemeId && (
        <div className="alert-error mb-6">
          There's no active theme preset. Visit{" "}
          <Link href="/admin/settings/look" className="underline">
            Look and Feel
          </Link>{" "}
          to create one before editing fonts.
        </div>
      )}

      <SettingGroup
        title="Fonts"
        desc="Typeface pairings for each part of the public site. A role's size applies to the nav menu, footer and body text; sizes for page text come from Text styles below."
      >
        {ROLE_META.map((role) => (
          <FontRoleBlock
            key={role.key}
            label={role.label}
            hint={role.hint}
            family={draft[role.familyField] as string}
            onFamilyChange={(v) => update(role.familyField, v)}
            style={draft.fontStyles[role.key] ?? {}}
            onStyleChange={(patch) =>
              setDraft((d) => ({
                ...d,
                fontStyles: {
                  ...d.fontStyles,
                  [role.key]: { ...(d.fontStyles[role.key] ?? {}), ...patch },
                },
              }))
            }
          />
        ))}
      </SettingGroup>

      <SettingGroup
        title="Text styles"
        desc="The named styles blocks use for their text. Weight, slant, caps and tracking set to “Role” follow the font role above."
      >
        {TEXT_STYLE_KEYS.map((key) => (
          <TextStyleBlock
            key={key}
            styleKey={key}
            value={draft.textStyles[key]}
            theme={previewTheme}
            onChange={(patch) =>
              setDraft((d) => ({
                ...d,
                textStyles: {
                  ...d.textStyles,
                  [key]: { ...d.textStyles[key], ...patch },
                },
              }))
            }
          />
        ))}
      </SettingGroup>

      <SettingGroup title="Scale" desc="Base size for body text.">
        <Field label={`Body font size — ${draft.bodyFontSize}px`} inline>
          <input
            type="range"
            min={12}
            max={24}
            step={1}
            value={draft.bodyFontSize}
            onChange={(e) =>
              update("bodyFontSize", Number(e.target.value))
            }
            className="w-full accent-admin-accent"
          />
        </Field>
      </SettingGroup>

      <div className="flex justify-end">
        <Button
          kind="primary"
          onClick={handleSave}
          disabled={saving || !activeThemeId}
        >
          {saving ? "Saving..." : "Save typography"}
        </Button>
      </div>
      </div>

      <aside className="xl:sticky xl:top-8 xl:self-start xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto space-y-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[2px] text-admin-ink-soft mb-2">
            Public pages
          </div>
          <ThemePreview theme={previewTheme} siteTitle={siteTitle} logoUrl={logoUrl} />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[2px] text-admin-ink-soft mb-2">
            Lightbox
          </div>
          <LightboxPreview theme={previewTheme} />
        </div>
      </aside>
    </div>
  );
}

const NUM_INPUT =
  "bg-admin-surface border border-admin-border-strong rounded px-1.5 py-1 text-[12px]";

function triValue(v: boolean | null): string {
  return v == null ? "" : v ? "on" : "off";
}

function fromTri(v: string): boolean | null {
  return v === "" ? null : v === "on";
}

function TextStyleBlock({
  styleKey,
  value,
  theme,
  onChange,
}: {
  styleKey: TextStyleKey;
  value: TextStyle;
  theme: ThemeSettings;
  onChange: (patch: Partial<TextStyle>) => void;
}) {
  const roleMeta = ROLE_META.find((r) => r.key === value.role) ?? ROLE_META[0];
  const role = { ...ROLE_DEFAULTS[value.role], ...(theme.fontStyles?.[value.role] ?? {}) };
  const italic = value.italic ?? role.italic;
  const uppercase = value.uppercase ?? role.uppercase;
  const tracking = value.tracking ?? role.tracking;
  const token = COLOR_TOKENS.find((t) => t.key === value.color) ?? COLOR_TOKENS[0];

  const previewStyle: React.CSSProperties = {
    fontFamily: getFontFallback(theme[roleMeta.familyField] as string),
    fontSize: Math.min(value.size, 40),
    lineHeight: value.lineHeight,
    fontWeight: value.weight ?? role.weight,
    fontStyle: italic ? "italic" : "normal",
    textTransform: uppercase ? "uppercase" : "none",
    letterSpacing: tracking != null ? `${tracking}em` : undefined,
    color: theme[token.field] as string,
  };

  return (
    <Field label={TEXT_STYLE_LABELS[styleKey]} inline>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-admin-ink-soft">
          <label className="flex items-center gap-1.5">
            Font
            <select
              value={value.role}
              onChange={(e) => onChange({ role: e.target.value as FontRoleKey })}
              className={NUM_INPUT}
            >
              {ROLE_META.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Color
            <select
              value={value.color}
              onChange={(e) => onChange({ color: e.target.value as ColorTokenKey })}
              className={NUM_INPUT}
            >
              {COLOR_TOKENS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-admin-ink-soft">
          <label className="flex items-center gap-1.5">
            Size
            <input
              type="number"
              min={8}
              max={200}
              value={value.size}
              onChange={(e) => onChange({ size: Number(e.target.value) || value.size })}
              className={`w-14 ${NUM_INPUT}`}
            />
            <span className="opacity-70">px</span>
          </label>
          <label className="flex items-center gap-1.5">
            Phone
            <input
              type="number"
              min={8}
              max={200}
              value={value.mobileSize}
              onChange={(e) => onChange({ mobileSize: Number(e.target.value) || value.mobileSize })}
              className={`w-14 ${NUM_INPUT}`}
            />
            <span className="opacity-70">px</span>
          </label>
          <label className="flex items-center gap-1.5">
            Leading
            <input
              type="number"
              min={0.8}
              max={3}
              step={0.01}
              value={value.lineHeight}
              onChange={(e) => onChange({ lineHeight: Number(e.target.value) || value.lineHeight })}
              className={`w-16 ${NUM_INPUT}`}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-admin-ink-soft">
          <label className="flex items-center gap-1.5">
            Weight
            <select
              value={value.weight ?? ""}
              onChange={(e) =>
                onChange({ weight: e.target.value === "" ? null : Number(e.target.value) })
              }
              className={NUM_INPUT}
            >
              <option value="">Role ({role.weight})</option>
              {[300, 400, 500, 600, 700, 800].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Italic
            <select
              value={triValue(value.italic)}
              onChange={(e) => onChange({ italic: fromTri(e.target.value) })}
              className={NUM_INPUT}
            >
              <option value="">Role ({role.italic ? "on" : "off"})</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Caps
            <select
              value={triValue(value.uppercase)}
              onChange={(e) => onChange({ uppercase: fromTri(e.target.value) })}
              className={NUM_INPUT}
            >
              <option value="">Role ({role.uppercase ? "on" : "off"})</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Tracking
            <input
              type="number"
              min={-0.05}
              max={0.5}
              step={0.01}
              placeholder={role.tracking != null ? String(role.tracking) : "role"}
              value={value.tracking ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                onChange({ tracking: v === "" ? null : Number(v) });
              }}
              className={`w-16 ${NUM_INPUT}`}
            />
            <span className="opacity-70">em</span>
          </label>
        </div>

        <p className="mt-0.5" style={previewStyle}>
          {TEXT_STYLE_SAMPLES[styleKey]}
        </p>
      </div>
    </Field>
  );
}

function FontRoleBlock({
  label,
  hint,
  family,
  onFamilyChange,
  style,
  onStyleChange,
}: {
  label: string;
  hint?: string;
  family: string;
  onFamilyChange: (v: string) => void;
  style: FontRoleStyle;
  onStyleChange: (patch: FontRoleStyle) => void;
}) {
  const previewStyle: React.CSSProperties = {
    fontFamily: getFontFallback(family),
    fontWeight: style.weight ?? 400,
    fontStyle: style.italic ? "italic" : "normal",
    textTransform: style.uppercase ? "uppercase" : "none",
    fontSize: style.size ?? 15,
    letterSpacing: style.tracking != null ? `${style.tracking}em` : undefined,
  };

  return (
    <Field label={label} inline hint={hint}>
      <div className="flex flex-col gap-2">
        <Select value={family} onChange={(e) => onFamilyChange(e.target.value)}>
          <optgroup label="Serif">
            {SERIF_FONTS.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Sans-Serif">
            {SANS_FONTS.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Display">
            {DISPLAY_FONTS.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Monospace">
            {MONO_FONTS.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </optgroup>
        </Select>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-admin-ink-soft">
          {/* Weight slider */}
          <label className="flex items-center gap-2">
            <span className="whitespace-nowrap">Weight {style.weight ?? 400}</span>
            <input
              type="range"
              min={300}
              max={800}
              step={100}
              value={style.weight ?? 400}
              onChange={(e) => onStyleChange({ weight: Number(e.target.value) })}
              className="w-20 accent-admin-accent"
            />
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!style.italic}
              onChange={(e) => onStyleChange({ italic: e.target.checked })}
              className="accent-admin-accent"
            />
            <span className="italic">Italic</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!style.uppercase}
              onChange={(e) => onStyleChange({ uppercase: e.target.checked })}
              className="accent-admin-accent"
            />
            <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Caps</span>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Size</span>
            <input
              type="number"
              min={8}
              max={200}
              placeholder="auto"
              value={style.size ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                onStyleChange({ size: v === "" ? null : Number(v) });
              }}
              className="w-14 bg-admin-surface border border-admin-border-strong rounded px-1.5 py-1 text-[12px]"
            />
            <span className="opacity-70">px</span>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Tracking</span>
            <input
              type="number"
              min={-0.05}
              max={0.5}
              step={0.01}
              placeholder="0"
              value={style.tracking ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                onStyleChange({ tracking: v === "" ? null : Number(v) });
              }}
              className="w-16 bg-admin-surface border border-admin-border-strong rounded px-1.5 py-1 text-[12px]"
            />
            <span className="opacity-70">em</span>
          </label>
        </div>

        <p
          className="text-[13px] text-admin-ink mt-0.5"
          style={previewStyle}
        >
          The quick brown fox jumps over the lazy dog
        </p>
      </div>
    </Field>
  );
}
