"use client";

import { useMemo, useRef } from "react";
import { Render } from "@puckeditor/core";
import type { Data } from "@puckeditor/core";
import { puckConfig, ImageCounterContext } from "@/lib/puck/config";
import type { EmbedPhoto, GlobalLightboxSettings } from "@/lib/puck/config";
import { CURATED_FONTS, buildGoogleFontsUrl } from "@/lib/theme/fonts";

export interface PuckRendererProps {
  data: Data;
  galleryPhotos?: Record<string, EmbedPhoto[]>;
  globalLightbox?: GlobalLightboxSettings;
  pageTitle?: string;
  showTitle?: boolean;
}

export default function PuckRenderer({ data, galleryPhotos, globalLightbox, pageTitle, showTitle }: PuckRendererProps) {
  const counterRef = useRef(0);
  const ctx = useRef({ next: () => counterRef.current++ });

  // Rich text content can reference any curated font (Tiptap fontFamily marks);
  // the layout only loads the active theme's role fonts, so load the rest here.
  const contentFontsUrl = useMemo(() => {
    const json = JSON.stringify(data);
    const used = CURATED_FONTS.filter((f) => json.includes(`"${f.name}"`)).map((f) => f.name);
    return buildGoogleFontsUrl(used);
  }, [data]);

  return (
    <ImageCounterContext.Provider value={ctx.current}>
      {contentFontsUrl && <link rel="stylesheet" href={contentFontsUrl} />}
      <Render
        config={puckConfig}
        data={data}
        metadata={{ galleryPhotos: galleryPhotos ?? {}, globalLightbox, pageTitle, showPageTitle: showTitle }}
      />
    </ImageCounterContext.Provider>
  );
}
