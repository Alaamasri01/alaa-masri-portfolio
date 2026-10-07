import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/server";
import type { Workspace } from "@/lib/auth/workspaces";

/** Milestone 1 stand-in: proves sign-in, role resolution and tenant scoping end to end. */
export async function WorkspacePlaceholder({ locale, workspace }: { locale: Locale; workspace: Workspace }) {
  const t = await getMessages(locale);
  return (
    <Card className="animate-enter">
      <EmptyState icon={ShieldCheck} title={t.comingSoon.title} body={`${t.workspaces[workspace].description} ${t.comingSoon.body}`} />
    </Card>
  );
}
