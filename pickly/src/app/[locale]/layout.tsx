import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { I18nProvider } from "@/i18n/client";
import { isLocale, localeDirection, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/server";
import "../globals.css";

// One family for both scripts keeps Arabic and Latin text visually consistent.
const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getMessages(locale);
  return {
    title: { default: `${t.common.appName} — ${t.common.tagline}`, template: `%s · ${t.common.appName}` },
    description: t.auth.heroBody,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} dir={localeDirection(locale)} className={plex.variable}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
