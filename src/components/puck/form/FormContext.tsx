"use client";

import { createContext, useContext } from "react";
import type { TextStyleValue } from "@/lib/theme/text-style-value";

type FormContextValue = {
  register: (name: string, value: string | string[], meta?: { required?: boolean; type?: string }) => void;
  update: (name: string, value: string | string[]) => void;
  /** Set on the Form block, so every field's label matches. */
  labelStyle?: TextStyleValue;
};

export const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
  return useContext(FormContext);
}
