import { cn } from "@/lib/cn";

/** Initials avatar. Works for Arabic and Latin names. */
export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2)).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-sand-100 font-semibold text-ink-700 ring-1 ring-sand-200",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-11 text-sm",
        size === "lg" && "size-14 text-lg",
        className,
      )}
    >
      {initials}
    </span>
  );
}
