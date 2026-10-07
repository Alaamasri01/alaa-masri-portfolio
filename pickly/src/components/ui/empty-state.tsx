import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center animate-enter">
      <span className="mb-5 inline-flex size-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <Icon aria-hidden className="size-7" strokeWidth={1.75} />
      </span>
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      {body && <p className="mt-2 max-w-sm text-[15px] text-ink-500">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
