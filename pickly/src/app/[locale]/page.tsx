import { redirect } from "next/navigation";
import { getSessionContext, homePath } from "@/lib/auth/session";

/** Entry point: send each person to the workspace that matches their role. */
export default async function LocaleHome({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const ctx = await getSessionContext();
  redirect(ctx ? homePath(locale, ctx) : `/${locale}/sign-in`);
}
