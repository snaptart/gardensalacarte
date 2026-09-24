import type { CSSProperties, ReactNode } from "react";
import { responsiveGrid, type PhoneColumns, type TabletColumns } from "@/lib/puck/responsive";
import { textStyleCss, type TextStyleValue } from "@/lib/theme/text-style-value";

/**
 * Page sections from the design canvas, built from theme text styles:
 *   Page Intro      — eyebrow, title, lead, a link, and stats alongside
 *   Section Header  — a small label over a rule, with an optional link
 *   Details         — term / description pairs as rows, columns or a line
 */

const RULE = "1px solid var(--theme-color-rule, #e0dcd3)";

type Spacing = { marginTop: number; marginBottom: number };
const spacing = (p: Spacing): CSSProperties => ({ marginTop: p.marginTop ?? 0, marginBottom: p.marginBottom ?? 0 });

/** Paragraphs from a plain textarea: a blank line starts a new one. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

/** The design's text link: accent colour over a thin accent rule. */
function AccentLink({ href, style, children }: { href: string; style: CSSProperties; children: ReactNode }) {
  return (
    <a
      href={href}
      target={isExternal(href) ? "_blank" : undefined}
      rel={isExternal(href) ? "noopener noreferrer" : undefined}
      className="transition-opacity hover:opacity-75"
      style={{
        ...style,
        color: "var(--theme-color-accent)",
        textDecoration: "none",
        borderBottom: "1px solid currentColor",
        paddingBottom: 3,
      }}
    >
      {children}
    </a>
  );
}

// ----- Page Intro -----

export type IntroStat = { id: string; label: string; value: string };

export type PageIntroProps = Spacing & {
  eyebrow: string;
  eyebrowStyle: TextStyleValue;
  title: string;
  titleStyle: TextStyleValue;
  /** h1 for the page's own title; h2 when the intro sits further down. */
  titleTag: "h1" | "h2";
  text: string;
  textStyle: TextStyleValue;
  linkLabel: string;
  link: string;
  linkStyle: TextStyleValue;
  stats: IntroStat[];
  statLabelStyle: TextStyleValue;
  statValueStyle: TextStyleValue;
  alignment: "left" | "center";
  textMaxWidth: number;
  ruleBelow: boolean;
  /** Space between the intro and its rule. */
  ruleGap: number;
};

export function PageIntroRender(p: PageIntroProps) {
  const Title = p.titleTag === "h2" ? "h2" : "h1";
  const centered = p.alignment === "center";
  const stats = (p.stats ?? []).filter((s) => s.label || s.value);

  return (
    <section
      className={
        centered
          ? "flex flex-col items-center gap-10 text-center"
          : "flex flex-col gap-10 md:flex-row md:items-end md:justify-between"
      }
      style={{
        ...spacing(p),
        paddingBottom: p.ruleBelow ? p.ruleGap : 0,
        borderBottom: p.ruleBelow ? RULE : undefined,
      }}
    >
      <div style={{ maxWidth: p.textMaxWidth > 0 ? p.textMaxWidth : undefined }}>
        {p.eyebrow && (
          <p style={{ ...textStyleCss(p.eyebrowStyle, "label"), margin: "0 0 20px" }}>{p.eyebrow}</p>
        )}
        {p.title && <Title style={{ ...textStyleCss(p.titleStyle, "display"), margin: 0 }}>{p.title}</Title>}
        {paragraphs(p.text ?? "").map((para, i) => (
          <p key={i} style={{ ...textStyleCss(p.textStyle, "lead"), margin: `${i === 0 ? 24 : 16}px 0 0`, whiteSpace: "pre-line" }}>
            {para}
          </p>
        ))}
        {p.linkLabel && p.link && (
          <p style={{ margin: "28px 0 0" }}>
            <AccentLink href={p.link} style={textStyleCss(p.linkStyle, "label", { withColor: false })}>
              {p.linkLabel}
            </AccentLink>
          </p>
        )}
      </div>

      {stats.length > 0 && (
        <dl className={centered ? "flex flex-wrap justify-center gap-x-14 gap-y-6" : "flex flex-wrap gap-x-14 gap-y-6"} style={{ margin: 0 }}>
          {stats.map((s) => (
            <div key={s.id}>
              <dt style={textStyleCss(p.statLabelStyle, "meta")}>{s.label}</dt>
              <dd style={{ ...textStyleCss(p.statValueStyle, "collectionTitle"), margin: "8px 0 0" }}>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

// ----- Section Header -----

export type SectionHeaderProps = Spacing & {
  title: string;
  titleStyle: TextStyleValue;
  titleTag: "h2" | "h3";
  linkLabel: string;
  link: string;
  linkStyle: TextStyleValue;
  ruleBelow: boolean;
};

export function SectionHeaderRender(p: SectionHeaderProps) {
  const Title = p.titleTag === "h3" ? "h3" : "h2";
  return (
    <div
      className="flex items-baseline justify-between gap-6"
      style={{
        ...spacing(p),
        paddingBottom: p.ruleBelow ? 20 : 0,
        borderBottom: p.ruleBelow ? RULE : undefined,
      }}
    >
      <Title style={{ ...textStyleCss(p.titleStyle, "label"), margin: 0 }}>{p.title}</Title>
      {p.linkLabel && p.link && (
        <a
          href={p.link}
          target={isExternal(p.link) ? "_blank" : undefined}
          rel={isExternal(p.link) ? "noopener noreferrer" : undefined}
          className="shrink-0 transition-opacity hover:opacity-70"
          style={{ ...textStyleCss(p.linkStyle, "meta"), textDecoration: "none" }}
        >
          {p.linkLabel}
        </a>
      )}
    </div>
  );
}

// ----- Breadcrumb -----

export type Crumb = { id: string; label: string; link: string };

export type BreadcrumbProps = Spacing & {
  /** The steps leading here, each a link. */
  items: Crumb[];
  /** Where the visitor is now — shown last, not a link. */
  current: string;
  separator: "/" | "›" | "·";
  linkStyle: TextStyleValue;
  currentStyle: TextStyleValue;
};

export function BreadcrumbRender({ editing, ...p }: BreadcrumbProps & { editing?: boolean }) {
  const items = (p.items ?? []).filter((c) => c.label);
  if (items.length === 0 && !p.current) {
    if (!editing) return null;
    return (
      <div style={spacing(p)} className="rounded border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500">
        Add the steps leading to this page.
      </div>
    );
  }

  const linkCss = textStyleCss(p.linkStyle, "meta");
  const separator = (
    <span aria-hidden="true" style={{ ...linkCss, opacity: 0.6, padding: "0 10px" }}>
      {p.separator || "/"}
    </span>
  );

  return (
    <nav aria-label="Breadcrumb" style={spacing(p)}>
      <ol className="m-0 flex list-none flex-wrap items-baseline p-0">
        {items.map((c, i) => (
          <li key={c.id} className="flex items-baseline">
            {i > 0 && separator}
            {c.link ? (
              <a href={c.link} className="transition-opacity hover:opacity-70" style={{ ...linkCss, textDecoration: "none" }}>
                {c.label}
              </a>
            ) : (
              <span style={linkCss}>{c.label}</span>
            )}
          </li>
        ))}
        {p.current && (
          <li className="flex items-baseline">
            {items.length > 0 && separator}
            <span aria-current="page" style={textStyleCss(p.currentStyle, "meta")}>
              {p.current}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}

// ----- Details -----

export type DetailItem = { id: string; term: string; description: string; link: string };

export type DetailsProps = Spacing & {
  items: DetailItem[];
  /** rows: stacked with rules (Contact) · columns: side by side (About) · inline: one line (stats) */
  layout: "rows" | "columns" | "inline";
  columns: "2" | "3" | "4";
  tabletColumns?: TabletColumns;
  phoneColumns?: PhoneColumns;
  termStyle: TextStyleValue;
  descriptionStyle: TextStyleValue;
  dividers: boolean;
};

export function DetailsRender({ editing, ...p }: DetailsProps & { editing?: boolean }) {
  const items = (p.items ?? []).filter((it) => it.term || it.description);
  const termCss = textStyleCss(p.termStyle, "meta");
  const descriptionCss = textStyleCss(p.descriptionStyle, "collectionTitle");

  const description = (it: DetailItem) =>
    it.link ? (
      <a
        href={it.link}
        target={isExternal(it.link) ? "_blank" : undefined}
        rel={isExternal(it.link) ? "noopener noreferrer" : undefined}
        className="transition-opacity hover:opacity-75"
        style={{ color: "var(--theme-color-accent)", textDecoration: "none" }}
      >
        {it.description}
      </a>
    ) : (
      it.description
    );

  if (items.length === 0) {
    // A placeholder in the editor; nothing on the site.
    if (!editing) return null;
    return (
      <div style={spacing(p)} className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
        Add a detail.
      </div>
    );
  }

  if (p.layout === "columns") {
    const grid = responsiveGrid(Number(p.columns) || 3, p.tabletColumns, p.phoneColumns);
    return (
      <div className="@container" style={spacing(p)}>
        <dl className={`${grid.className} gap-x-6 gap-y-10`} style={grid.style}>
          {items.map((it) => (
            <div key={it.id}>
              <dt style={termCss}>{it.term}</dt>
              <dd style={{ ...descriptionCss, margin: "14px 0 0", whiteSpace: "pre-line" }}>{description(it)}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (p.layout === "inline") {
    return (
      <dl className="flex flex-wrap gap-x-14 gap-y-6" style={spacing(p)}>
        {items.map((it) => (
          <div key={it.id}>
            <dt style={termCss}>{it.term}</dt>
            <dd style={{ ...descriptionCss, margin: "8px 0 0" }}>{description(it)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl style={{ ...spacing(p), borderTop: p.dividers ? RULE : undefined }}>
      {items.map((it) => (
        <div key={it.id} style={{ padding: "18px 0", borderBottom: p.dividers ? RULE : undefined }}>
          <dt style={termCss}>{it.term}</dt>
          <dd style={{ ...descriptionCss, margin: "8px 0 0", whiteSpace: "pre-line" }}>{description(it)}</dd>
        </div>
      ))}
    </dl>
  );
}
