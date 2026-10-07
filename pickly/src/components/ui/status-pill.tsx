import { Ban, Car, CheckCheck, CircleCheck, Clock3, Hand, PackageOpen, School } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { STATUS_TONE, type PickupStatus } from "@/lib/pickup/status";

export const STATUS_ICON: Record<PickupStatus, LucideIcon> = {
  REQUESTED: Clock3,
  ON_THE_WAY: Car,
  PREPARING: PackageOpen,
  READY: CircleCheck,
  PARENT_ARRIVED: Hand,
  COLLECTED: CheckCheck,
  CANCELLED: Ban,
};

/**
 * Status chip. Always shows icon + text so status never relies on colour alone.
 * `status = null` renders the neutral "at school" state.
 */
export function StatusPill({
  status,
  label,
  size = "md",
  live = false,
  className,
}: {
  status: PickupStatus | null;
  label: string;
  size?: "sm" | "md" | "lg";
  live?: boolean;
  className?: string;
}) {
  const tone = status ? STATUS_TONE[status] : null;
  const Icon = status ? STATUS_ICON[status] : School;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
        tone ? [tone.soft, tone.text, tone.ring] : "bg-ink-100 text-ink-600 ring-ink-200",
        size === "sm" && "h-7 px-2.5 text-xs",
        size === "md" && "h-8 px-3 text-sm",
        size === "lg" && "h-10 px-4 text-base",
        className,
      )}
    >
      {live ? (
        <span aria-hidden className="size-2 rounded-full bg-current animate-live-dot" />
      ) : (
        <Icon aria-hidden className={size === "lg" ? "size-5" : "size-4"} strokeWidth={2.25} />
      )}
      {label}
    </span>
  );
}
