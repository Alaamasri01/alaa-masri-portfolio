"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/client";

/** Swaps the locale prefix of the current URL (/ar/... ⇄ /en/...). */
export function LocaleSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";
  const href = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${other}`);

  return (
    <Link
      href={href}
      hrefLang={other}
      lang={other}
      aria-label={t.common.switchLanguageLabel}
      className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-100"
    >
      <Languages aria-hidden className="size-4" />
      {t.common.switchLanguage}
    </Link>
  );
}
