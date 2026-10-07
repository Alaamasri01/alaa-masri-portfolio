"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/i18n/client";

export default function NotFound() {
  const { locale, t } = useI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center">
      <EmptyState
        icon={Compass}
        title={t.notFound.title}
        body={t.notFound.body}
        action={
          <Link href={`/${locale}`} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            {t.notFound.home}
          </Link>
        }
      />
    </main>
  );
}
