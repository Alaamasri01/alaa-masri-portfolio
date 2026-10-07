import type { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function Alert({ tone = "info", children }: { tone?: "info" | "danger"; children: ReactNode }) {
  const Icon = tone === "danger" ? AlertCircle : Info;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm",
        tone === "danger" ? "bg-danger-50 text-danger-700" : "bg-brand-50 text-brand-800",
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
