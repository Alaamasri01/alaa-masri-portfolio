import { notFound, redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/server";
import { signOut } from "@/lib/auth/actions";
import { getSessionContext, homePath } from "@/lib/auth/session";

export default async function NoAccessPage({ params }: PageProps<"/[locale]/no-access">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = await getSessionContext();
  if (!ctx) redirect(`/${locale}/sign-in`);
  if (ctx.workspaces.length > 0) redirect(homePath(locale, ctx));
  const t = await getMessages(locale);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-4">
      <Logo name={t.common.appName} />
      <Card className="w-full">
        <EmptyState
          icon={Building2}
          title={t.noAccess.title}
          body={t.noAccess.body}
          action={
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <Button variant="secondary">{t.common.signOut}</Button>
            </form>
          }
        />
      </Card>
    </main>
  );
}
