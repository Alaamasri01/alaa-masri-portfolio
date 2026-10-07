export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

/** Saudi Arabia first: Arabic is the default experience. */
export const defaultLocale: Locale = "ar";

export const LOCALE_COOKIE = "pickly_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function localeDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Picks a bilingual database field (e.g. name_ar / name_en) with fallback. */
export function pickLocalized(locale: Locale, ar: string | null | undefined, en: string | null | undefined) {
  return (locale === "ar" ? ar || en : en || ar) ?? "";
}

/** Intl locale tags. Latin digits are used in Arabic UI for times and numbers, matching common Saudi app conventions. */
export const intlLocale: Record<Locale, string> = {
  ar: "ar-SA-u-nu-latn-ca-gregory",
  en: "en-GB",
};
