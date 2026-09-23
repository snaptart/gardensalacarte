"use client";

import type { Overrides } from "@puckeditor/core";
import { draggableOutlinePlugin } from "./DraggableOutline";
import { puckFieldTypes } from "./fieldTypes";

/** The one set of Puck overrides every editor (pages, stories, contents) uses. */
export const puckOverrides: Partial<Overrides> = {
  ...draggableOutlinePlugin().overrides,
  fieldTypes: puckFieldTypes,
};
