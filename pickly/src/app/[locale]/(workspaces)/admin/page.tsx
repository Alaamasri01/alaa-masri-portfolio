import { notFound } from "next/navigation";
import { WorkspacePlaceholder } from "@/components/layout/workspace-placeholder";
import { isLocale } from "@/i18n/config";

export default async function Page({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <WorkspacePlaceholder locale={locale} workspace="admin" />;
}
