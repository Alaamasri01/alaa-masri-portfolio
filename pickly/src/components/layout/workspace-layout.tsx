import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { requireWorkspace } from "@/lib/auth/session";
import type { Workspace } from "@/lib/auth/workspaces";
import { AppShell } from "./app-shell";

/**
 * Shared layout for every role workspace: verifies the session and the role
 * on the server, then renders the app chrome. (Data queries inside the
 * workspace are additionally constrained by RLS.)
 */
export async function WorkspaceLayout({
  params,
  workspace,
  children,
}: {
  params: Promise<{ locale: string }>;
  workspace: Workspace;
  children: ReactNode;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { ctx, activeSchool } = await requireWorkspace(locale, workspace);
  return (
    <AppShell locale={locale} workspace={workspace} ctx={ctx} activeSchool={activeSchool}>
      {children}
    </AppShell>
  );
}
