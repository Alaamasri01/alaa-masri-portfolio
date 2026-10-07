"use client";

import { createContext, use, type ReactNode } from "react";
import { localeDirection, type Locale } from "./config";
import type { Messages } from "./messages/en";

type I18nValue = { locale: Locale; dir: "rtl" | "ltr"; t: Messages };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  return (
    <I18nContext value={{ locale, dir: localeDirection(locale), t: messages }}>{children}</I18nContext>
  );
}

export function useI18n(): I18nValue {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
