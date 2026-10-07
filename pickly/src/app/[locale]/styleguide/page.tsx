import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/server";
import { PICKUP_STATUSES, STATUS_TONE } from "@/lib/pickup/status";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Design system" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Living reference for the Pickly design system. Uses no data; safe to keep public. */
export default async function StyleguidePage({ params }: PageProps<"/[locale]/styleguide">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getMessages(locale);
  const ali = locale === "ar" ? "علي أحمد السالم" : "Ali Ahmed Al-Salem";
  const school = locale === "ar" ? "مدرسة الواحة التجريبية" : "Al Waha Demo School";
  const grade = locale === "ar" ? "الصف الأول ب" : "Grade 1B";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <Logo name={t.common.appName} />
        <LocaleSwitcher />
      </header>

      <Section title="Pickup status">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PICKUP_STATUSES.map((s) => (
            <div key={s} className={cn("flex flex-col gap-3 rounded-2xl p-4 ring-1", STATUS_TONE[s].soft, STATUS_TONE[s].ring)}>
              <StatusPill status={s} label={t.status[s]} className="self-start" />
              <code className={cn("text-xs", STATUS_TONE[s].text)}>{s}</code>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill status={null} label={t.status.none} size="sm" />
          <StatusPill status="READY" label={t.status.READY} size="lg" />
          <StatusPill status="PREPARING" label={t.common.live} live size="md" />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xl">{locale === "ar" ? "طلب الاستلام" : "Request pickup"}</Button>
          <Button variant="brand" size="lg">{t.status.READY}</Button>
          <Button variant="secondary">{t.common.back}</Button>
          <Button variant="ghost">{t.common.retry}</Button>
          <Button variant="danger" size="sm">{t.status.CANCELLED}</Button>
          <Button loading>{t.common.loading}</Button>
        </div>
      </Section>

      <Section title="Parent · child card (mobile)">
        <div className="max-w-sm">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Avatar name={ali} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-ink-950">{ali}</p>
                <p className="truncate text-sm text-ink-500">
                  {grade} · {school}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <StatusPill status={null} label={t.status.none} size="sm" />
            </div>
            <Button size="xl" block className="mt-5">
              {locale === "ar" ? "طلب الاستلام" : "Request pickup"}
            </Button>
          </Card>
        </div>
      </Section>

      <Section title="Teacher / gate · queue row (tablet)">
        <div className="grid gap-3 md:grid-cols-2">
          {(["REQUESTED", "PREPARING"] as const).map((s) => (
            <Card key={s} className="flex items-center gap-4 p-4">
              <Avatar name={ali} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-950">{ali}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusPill status={s} label={t.status[s]} size="sm" />
                  <span className="text-xs text-ink-400">2 min</span>
                </div>
              </div>
              <Button variant={s === "REQUESTED" ? "primary" : "brand"} size="lg">
                {s === "REQUESTED" ? t.status.PREPARING : t.status.READY}
                <ChevronRight aria-hidden className="size-5 rtl:-scale-x-100" />
              </Button>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Feedback">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert>{t.comingSoon.body}</Alert>
          <Alert tone="danger">{t.pickupErrors.PK003}</Alert>
        </div>
        <Card>
          <EmptyState icon={Users} title={t.noAccess.title} body={t.noAccess.body} />
        </Card>
      </Section>
    </div>
  );
}
