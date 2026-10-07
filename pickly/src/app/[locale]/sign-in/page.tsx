import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo, LogoMark } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { StatusPill } from "@/components/ui/status-pill";
import { isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/server";
import { env } from "@/lib/env";
import { SignInForm, type DemoAccount } from "./sign-in-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getMessages(locale)).auth.submit };
}

/** Demo accounts from supabase/seed.sql — shown only when NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true. */
const DEMO_PASSWORD = "PicklyDemo2026!";

export default async function SignInPage({ params }: PageProps<"/[locale]/sign-in">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getMessages(locale);

  const demoAccounts: DemoAccount[] = env.showDemoAccounts
    ? [
        { email: "parent@pickly.test", role: t.roles.parent, name: locale === "ar" ? "أحمد السالم" : "Ahmed Al-Salem" },
        { email: "teacher.1b@pickly.test", role: `${t.roles.teacher} · 1B`, name: "Noura Al-Harbi" },
        { email: "gate@pickly.test", role: t.roles.gate_staff, name: "Faisal Al-Qahtani" },
        { email: "admin@pickly.test", role: t.roles.school_admin, name: "Sara Al-Dosari" },
        { email: "teacher.2a@pickly.test", role: `${t.roles.teacher} · 2A`, name: "Khalid Al-Otaibi" },
        { email: "owner@pickly.test", role: t.roles.platform_owner, name: "Pickly Operations" },
      ]
    : [];

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (desktop) */}
      <section className="relative hidden overflow-hidden bg-brand-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -end-32 -top-32 size-[28rem] rounded-full bg-brand-700/60" />
        <div className="pointer-events-none absolute -bottom-40 -start-24 size-[26rem] rounded-full bg-brand-900/60" />
        <div className="relative flex items-center gap-2.5">
          <LogoMark className="size-9 rounded-[10px] ring-1 ring-white/20" />
          <span className="text-lg font-bold">{t.common.appName}</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-bold text-balance">{t.auth.heroTitle}</h1>
          <p className="mt-4 text-lg text-brand-100/90">{t.auth.heroBody}</p>
          <div className="mt-10 flex flex-wrap gap-2">
            {(["REQUESTED", "PREPARING", "READY", "PARENT_ARRIVED", "COLLECTED"] as const).map((s) => (
              <StatusPill key={s} status={s} label={t.status[s]} size="sm" className="ring-white/40" />
            ))}
          </div>
        </div>
        <p className="relative text-sm text-brand-100/70">{t.common.tagline}</p>
      </section>

      {/* Form */}
      <section className="flex flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 sm:px-8">
        <div className="flex items-center justify-between py-2">
          <Logo name={t.common.appName} className="lg:invisible" />
          <LocaleSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 animate-enter">
          <h1 className="text-3xl font-bold tracking-tight text-ink-950">{t.auth.title}</h1>
          <p className="mt-2 mb-8 text-ink-500">{t.auth.subtitle}</p>
          <SignInForm demoAccounts={demoAccounts} demoPassword={env.showDemoAccounts ? DEMO_PASSWORD : undefined} />
        </div>
      </section>
    </main>
  );
}
