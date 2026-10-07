import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { pickLocalized, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/server";
import { signOut } from "@/lib/auth/actions";
import type { SchoolSummary, SessionContext } from "@/lib/auth/session";
import { workspacePath, type Workspace } from "@/lib/auth/workspaces";
import { cn } from "@/lib/cn";

/** Content width per workspace: phones for parents, tablets for teacher/gate, desktop for admin. */
const WIDTH: Record<Workspace, string> = {
  parent: "max-w-xl",
  teacher: "max-w-6xl",
  gate: "max-w-6xl",
  admin: "max-w-7xl",
  platform: "max-w-7xl",
};

const ROLE_LABEL_KEY = {
  parent: "parent",
  teacher: "teacher",
  gate: "gate_staff",
  admin: "school_admin",
  platform: "platform_owner",
} as const;

export async function AppShell({
  locale,
  workspace,
  ctx,
  activeSchool,
  children,
}: {
  locale: Locale;
  workspace: Workspace;
  ctx: SessionContext;
  activeSchool: SchoolSummary | null;
  children: ReactNode;
}) {
  const t = await getMessages(locale);
  const schoolName = activeSchool ? pickLocalized(locale, activeSchool.name_ar, activeSchool.name_en) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-canvas/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className={cn("mx-auto flex h-16 items-center gap-3 px-4 sm:px-6", WIDTH[workspace])}>
          <Link href={`/${locale}`} className="shrink-0" aria-label={t.common.appName}>
            <Logo name={t.common.appName} />
          </Link>
          {schoolName && (
            <span className="hidden truncate border-s border-ink-200 ps-3 text-sm font-medium text-ink-600 sm:block">
              {schoolName}
            </span>
          )}
          <div className="ms-auto flex items-center gap-1">
            <LocaleSwitcher />
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="inline-flex size-10 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-100"
                aria-label={t.common.signOut}
                title={t.common.signOut}
              >
                <LogOut aria-hidden className="size-[18px] rtl:-scale-x-100" />
              </button>
            </form>
          </div>
        </div>

        {ctx.workspaces.length > 1 && (
          <nav aria-label={t.workspaces.switchTo} className={cn("mx-auto -mt-1 flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6", WIDTH[workspace])}>
            {ctx.workspaces.map((ws) => (
              <Link
                key={ws}
                href={workspacePath(locale, ws)}
                aria-current={ws === workspace ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition",
                  ws === workspace ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-100",
                )}
              >
                {t.workspaces[ws].title}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className={cn("mx-auto w-full flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8", WIDTH[workspace])}>
        <div className="mb-6 flex items-center gap-3 animate-enter">
          <Avatar name={ctx.fullName || ctx.email || "?"} />
          <div className="min-w-0">
            <p className="truncate text-sm text-ink-500">
              {ctx.fullName} · {t.roles[ROLE_LABEL_KEY[workspace]]}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-ink-950">{t.workspaces[workspace].title}</h1>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
